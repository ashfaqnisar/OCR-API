import express from 'express';
import firebase, {db} from "../firebase";
import response from "../response";
import FormData from "form-data";
import fs from "fs";
import axios from "axios";
import {beautifyResponse, processResponse} from "../util/Beautifier";
import path from "path";
import {Storage} from "@google-cloud/storage";
import multer from "multer";
import {v4 as uuidv4} from 'uuid'

var timeout = require('connect-timeout')


const router = express.Router();

const storage = new Storage({
    projectId: 'ezerka-ocr', keyFilename: 'config/service.json'
});

const increment = firebase.firestore.FieldValue.increment(1);
const decrement = firebase.firestore.FieldValue.increment(-1);


const bucketName = "esocr-app"

const mulStorage = multer.diskStorage({
    destination: 'data/',
    filename(req, file, callback) {
        callback(null, uuidv4() + path.extname(file.originalname));
    },

});

const mul = multer({
    storage: mulStorage,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
})


let useNanonets = true;

router.post("/ocr", timeout('60s'), mul.single("file"), haltOnTimedout, async (req, res, next) => {
    try {
        if (req.timedout) return
        const {uid} = req.query;
        if (!req.file) {
            res.status(400).json({code: 400, message: 'Please, provide an file with the request '})
            return
        }
        if (!uid) {
            res.status(400).json({code: 400, message: "Please, provide the uid with the request"})
            return
        }

        const user = await db.collection('users').doc(uid.toString()).get()
        if (!user.exists) {
            res.status(400).json({code: 400, message: `No, user present with the uid ${uid}`})
        }


        let ocrResponse = response


        if (useNanonets) {
            const formData = new FormData()
            formData.append('modelId', '4ed6dcd3-d1e4-424d-9780-e4acfde58c78')
            formData.append('file', fs.createReadStream(req.file.path))

            const nanonetsResponse = await axios.post('https://app.nanonets.com/api/v2/OCR/Model/4ed6dcd3-d1e4-424d-9780-e4acfde58c78/LabelFile/',
                formData, {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': 'Basic ' + Buffer.from('-w7X4B2isVUQ1BRAFbuypR8lED41DlD5' + ':').toString('base64')
                    }
                })
            ocrResponse = nanonetsResponse.data

        }

        ocrResponse = processResponse(ocrResponse)
        ocrResponse['processedAt'] = new Date().toISOString()

        ocrResponse['uploadedFile'] = `${req.file.originalname}`

        ocrResponse['fileId'] = ocrResponse["fileId"] + path.extname(req.file.originalname)

        console.log(ocrResponse)

        const statsRef = db.collection("--stats--").doc("ocr");
        const userOCRStatsRef = db.collection("users").doc(uid.toString()).collection('info').doc("ocr");
        const ocrRef = db.collection("users").doc(uid.toString()).collection("ocr").doc()

        const batch = db.batch();

        batch.set(ocrRef, {id: ocrRef.id, ...ocrResponse})

        batch.set(userOCRStatsRef, {count: increment}, {merge: true});
        batch.set(statsRef, {count: increment}, {merge: true});
        await batch.commit()

        const ocr = await ocrRef.get()
        res.status(200).json(ocr.data())

        storage.bucket(bucketName).upload(req.file.path, {
            destination: `files/${uid}/${ocrResponse['fileId']}`,
            metadata: {
                contentType: req.file.mimetype
            }
        }).then(() => {
            ocrRef.update({"fileLink": `https://storage.googleapis.com/esocr-app/files/${uid}/${ocrResponse['fileId']}`});
        })

    } catch (err) {
        const error = {
            code: err.code || 500,
            message: err.message || err.status,
        }
        res.status(err.code || 500).json(error);
    }
})
router.get("/ocr", async (req, res) => {
    try {
        const {uid} = req.query;
        if (!uid) {
            res.status(400).json({code: 400, message: "Please,provide the uid with the request"})
            return
        }
        const user = await db.collection('users').doc(uid.toString()).get()
        if (!user.exists) {
            res.status(400).json({code: 400, message: `No, user present with the uid ${uid}`})
            return
        }
        let ocrArray;

        const ocrDocs = await db.collection("users").doc(uid).collection("ocr")
            .orderBy("processedAt", "desc")
            .get()

        ocrArray = ocrDocs.docs.map(ocrDoc => ocrDoc.data())

        res.status(200).send(ocrArray);

    } catch (err) {
        const error = {
            code: err.code || 500,
            message: err.message || err.status,
        }
        res.status(err.code || 500).json(error);
    }

});
router.get("/ocr/:ocrId", async (req, res) => {
    try {
        const {ocrId} = req.params;
        const {uid} = req.query;

        if (!(ocrId && uid)) {
            res.status(400).json({code: 400, message: "Please,provide the uid & ocrId"})
            return
        }
        const user = await db.collection('users').doc(uid.toString()).get()
        if (!user.exists) {
            res.status(400).json({code: 400, message: `No, user present with the uid ${uid}`})
            return
        }

        const ocrRef = db.collection("users").doc(uid).collection("ocr").doc(ocrId)
        let ocr = await ocrRef.get()
        if (!ocr.exists) {
            const emptyError = {
                code: 204,
                message: `No, ocr available with ${uid}`
            }
            res.status(400).json(emptyError)
            return
        }
        res.status(200).send(ocr.data());

    } catch (err) {
        const error = {
            code: err.code || 500,
            message: err.message || err.status,
        }
        res.status(err.code || 500).json(error);
    }

});
router.put("/ocr/:ocrId", async (req, res) => {
    try {
        const {ocrId} = req.params;
        const {uid} = req.query;

        const data = req.body

        if (!(ocrId && uid)) {
            res.status(400).json({code: 400, message: "Please,provide the uid & ocrId"})
            return
        }
        const user = await db.collection('users').doc(uid.toString()).get()
        if (!user.exists) {
            res.status(400).json({code: 400, message: `No, user present with the uid ${uid}`})
            return
        }

        const ocrRef = db.collection("users").doc(uid).collection("ocr").doc(ocrId)
        let ocr = await ocrRef.get()
        if (!ocr.exists) {
            const emptyError = {
                code: 204,
                message: `No, ocr available with ${uid}`
            }
            res.status(400).json(emptyError)
            return
        }
        await ocrRef.update(data)

        ocr = await ocrRef.get()

        res.status(200).send(ocr.data());

    } catch (err) {
        const error = {
            code: err.code || 500,
            message: err.message || err.status,
        }
        res.status(err.code || 500).json(error);
    }

});
router.delete("/ocr/:ocrId", async (req, res) => {
    try {
        const {ocrId} = req.params;
        const {uid} = req.query;

        if (!(ocrId && uid)) {
            res.status(400).json({code: 400, message: "Please,provide the uid & ocrId"})
            return
        }
        const user = await db.collection('users').doc(uid.toString()).get()
        if (!user.exists) {
            res.status(400).json({code: 400, message: `No, user present with the uid ${uid}`})
            return
        }

        const ocrRef = db.collection("users").doc(uid).collection("ocr").doc(ocrId)
        const statsRef = db.collection("--stats--").doc("ocr");
        const userOCRStatsRef = db.collection("users").doc(uid.toString()).collection('info').doc("ocr");

        const batch = db.batch();

        batch.delete(ocrRef)
        batch.set(userOCRStatsRef, {count: decrement}, {merge: true});
        batch.set(statsRef, {count: decrement}, {merge: true});
        batch.commit()
            .then(() => res.status(200).send(`Deleted ${ocrId} ocr form successfully`))

    } catch (err) {
        const error = {
            code: err.code || 500,
            message: err.message || err.status,
        }
        res.status(err.code || 500).json(error);
    }

});


router.post("/ocr/raw", timeout('60s'), mul.single("file"), haltOnTimedout, async (req, res) => {
    try {
        if (req.timedout) return
        if (!req.file) {
            res.status(400).json({code: 400, message: 'Please, provide an file with the request '})
            return
        }
        let ocrResponse = response

        if (useNanonets) {
            const formData = new FormData()
            formData.append('modelId', '4ed6dcd3-d1e4-424d-9780-e4acfde58c78')
            formData.append('file', fs.createReadStream(req.file.path))

            const nanonetsResponse = await axios.post('https://app.nanonets.com/api/v2/OCR/Model/4ed6dcd3-d1e4-424d-9780-e4acfde58c78/LabelFile/',
                formData, {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': 'Basic ' + Buffer.from('-w7X4B2isVUQ1BRAFbuypR8lED41DlD5' + ':').toString('base64')
                    }
                })
            ocrResponse = nanonetsResponse.data
        }

        res.status(200).json(ocrResponse)

    } catch (err) {
        console.log(err)
        const error = {
            code: err.code || 500,
            message: err.message || err.status,
        }
        res.status(err.code || 500).json(error);
    }
})
router.post("/ocr/raw/beautify", timeout('60s'), haltOnTimedout, mul.single("file"), async (req, res) => {
    try {
        if (!req.timedout) return
        if (!req.file) {
            res.status(400).json({code: 400, message: 'Please, provide an file with the request '})
            return
        }
        let ocrResponse = response

        if (useNanonets) {
            const formData = new FormData()
            formData.append('modelId', '4ed6dcd3-d1e4-424d-9780-e4acfde58c78')
            formData.append('file', fs.createReadStream(req.file.path))

            const nanonetsResponse = await axios.post('https://app.nanonets.com/api/v2/OCR/Model/4ed6dcd3-d1e4-424d-9780-e4acfde58c78/LabelFile/',
                formData, {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': 'Basic ' + Buffer.from('-w7X4B2isVUQ1BRAFbuypR8lED41DlD5' + ':').toString('base64')
                    }
                })
            ocrResponse = nanonetsResponse.data
        }
        ocrResponse = beautifyResponse(ocrResponse)
        res.status(200).json(ocrResponse)

    } catch (err) {
        console.log(err)
        const error = {
            code: err.code || 500,
            message: err.message || err.status,
        }
        res.status(err.code || 500).json(error);
    }
})

function haltOnTimedout(req, res, next) {
    if (!req.timedout) next()
}

export default router