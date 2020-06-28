import express from 'express';
import path from 'path';
import morgan from 'morgan';
import cors from 'cors';
import firebase, {db} from './firebase'
import * as Sentry from '@sentry/node';
import {Storage} from '@google-cloud/storage';
import multer from "multer";
import response from './response';
import axios from 'axios'
import {processResponse} from "./util/Beautifier";
import fs from 'fs';
import {promisify} from 'util'
import FormData from 'form-data'
import {v4 as uuidv4} from 'uuid'


const app = express();
const unlinkAsync = promisify(fs.unlink)

function getEnvironment() {
    if (process.env.NODE_ENV === 'development') {
        return 'development';
    } else if (process.env.NODE_ENV === 'production') {
        return 'production';
    }
}

Sentry.init({
    environment: getEnvironment(),
    dsn: 'https://f2c1250fc2344eaa8c11e9a3e2503fb9@o361783.ingest.sentry.io/5239445'
});

app.use(Sentry.Handlers.requestHandler());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, "public")));


const storage = new Storage({
    projectId: 'ezerka-ocr', keyFilename: 'config/service.json'
});

const increment = firebase.firestore.FieldValue.increment(1);


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

const bucket = storage.bucket(bucketName)

let useNanonets = false;

app.get('/', (req, res) => {
    res.status(200).send(`ESOCR API`)

});

app.post("/users", async (req, res) => {
    try {
        const {name, email} = req.body;
        if (!name || !email) return res.status(400).json({
            code: 400,
            message: 'Please provide the name and email with the request'
        })
        const userData = {
            name, email
        };

        const statsRef = db.collection("--stats--").doc("users");
        const batch = db.batch();

        const userRef = await db.collection("users").add({});

        batch.set(userRef, {...userData, uid: userRef.id});
        batch.set(statsRef, {count: increment}, {merge: true});
        await batch.commit()

        const user = await userRef.get();
        res.status(200).send(user.data());

    } catch (err) {
        const error = {
            code: err.code || 500,
            message: err.message || err.status,
        }
        res.status(err.code || 500).json(error);
    }
})
app.get("/users/:uid", async (req, res) => {
    try {
        const {uid} = req.params;

        const userRef = db.collection("users").doc(uid.toString())
        let user = await userRef.get()
        if (!user.exists) {
            const emptyError = {
                code: 204,
                message: `No, user available with ${uid}`
            }
            res.status(400).json(emptyError)
            return
        }
        res.status(200).send(user.data());

    } catch (err) {
        const error = {
            code: err.code || 500,
            message: err.message || err.status,
        }
        res.status(err.code || 500).json(error);
    }

});
app.get("/users/:uid/stats", async (req, res) => {
    try {
        const {uid} = req.params;
        if (!uid) {
            res.status(400).json({code: 400, message: "Please,provide the uid with the request"})
            return
        }
        const user = await db.collection('users').doc(uid.toString()).get()
        if (!user.exists) {
            res.status(400).json({code: 400, message: `No, user present with the uid ${uid}`})
            return
        }

        const userStats = await db.collection("users").doc(uid).collection("info").doc("ocr")
            .get()

        res.status(200).send(userStats.data());

    } catch (err) {
        const error = {
            code: err.code || 500,
            message: err.message || err.status,
        }
        res.status(err.code || 500).json(error);
    }

});


app.post("/ocr", mul.single("file"), async (req, res, next) => {
    try {
        useNanonets = true
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

        ocrResponse['uploadedFile'] = useNanonets ? ocrResponse["uploadedFile"] : `${req.file.originalname}`

        ocrResponse['gcsFile'] = ocrResponse["gcsFile"] + path.extname(req.file.originalname)

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

        const file = bucket.file(`files/${uid}/${ocrResponse['gcsFile']}`);


        const blobStream = file.createWriteStream({
            metadata: {
                contentType: req.file.mimetype
            }
        });

        blobStream.on("error", err => {
            res.status(err.code || 500).json({code: err.code, message: err.message || err})
            next(err);
        });

        blobStream.on("finish", () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

            file.makePublic().then(() => {
                ocrRef.update({gcsFileLink: publicUrl})
                console.log(`Image public URL: ${publicUrl}`);
            });
        });

        blobStream.end(req.file.buffer);

    } catch (err) {
        const error = {
            code: err.code || 500,
            message: err.message || err.status,
        }
        res.status(err.code || 500).json(error);
    }
})
app.get("/ocr/:ocrId", async (req, res) => {
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
app.get("/ocr", async (req, res) => {
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
app.put("/ocr/:ocrId", async (req, res) => {
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
app.post("/ocr/raw", mul.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({code: 400, message: 'Please, provide an file with the request '})
            return
        }

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

        res.status(200).json(nanonetsResponse.data)

    } catch (err) {
        console.log(err)
        const error = {
            code: err.code || 500,
            message: err.message || err.status,
        }
        res.status(err.code || 500).json(error);
    }
})


app.use(Sentry.Handlers.errorHandler());

app.use(function onError(err, req, res) {
    res.statusCode = 500;
    res.end(res.sentry + "\n" + err.message);
});

const listener = app.listen(process.env.PORT || 8080 || 8500, function () {
    console.log("Listening on port " + listener.address().port);
});

export default app;
