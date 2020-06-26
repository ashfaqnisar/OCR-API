import express from 'express';
import path from 'path';
import morgan from 'morgan';
import cors from 'cors';
import firebase, {db} from './firebase'
import * as Sentry from '@sentry/node';
import {Storage} from '@google-cloud/storage';
import multer, {memoryStorage} from "multer";
import response from './response';
import axios from 'axios'
import {processResponse} from "./util/Beautifier";
import fs from 'fs';


const app = express();

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

const mul = multer({
    storage: memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

const bucket = storage.bucket(bucketName)

let useNanonets = false;

app.get('/', (req, res) => {
    res.status(200).send(`OCR API`)

});

app.post("/users", async (req, res) => {
    try {
        const {name, email, uid} = req.body;
        const userData = {
            name, email, uid
        };

        const statsRef = db.collection("--stats--").doc("customers");
        const batch = db.batch();

        const userRef = await db.collection("users").doc(uid);
        batch.set(userRef, userData,);
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

app.post("/ocr", mul.single("file"), async (req, res, next) => {
    try {
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
            try {
                const form_data = {file: fs.createReadStream(req.file)}
                const nanonetsResponse = axios({
                    method: 'post',
                    url: "https://app.nanonets.com/api/v2/OCR/Model/fb1a831a-f45d-4809-b212-12c311e2e75f/LabelFile/",
                    formData: form_data,
                    headers: {
                        'Authorization': 'Basic ' + Buffer.from('hc-nkSevYsWFvfuTkmx5GLhGpQBc8DIy' + ':').toString('base64')
                    }
                })
                ocrResponse = nanonetsResponse.data
            } catch (e) {
                const error = {
                    code: e.code || 500,
                    message: e.message || e.status
                }
                console.log(error)
                res.status(e.code || 500).json(error)
                return
            }
        }

        ocrResponse = processResponse(ocrResponse)
        ocrResponse['processedAt'] = firebase.firestore.FieldValue.serverTimestamp()

        ocrResponse['uploadedFile'] = useNanonets ? ocrResponse["uploadedFile"] : `${req.file.originalname}`
        console.log(ocrResponse)

        let gcsFileName = ocrResponse["fileId"] + path.extname(req.file.originalname)

        ocrResponse['gcsFile'] = gcsFileName

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

        const file = bucket.file(`files/${uid}/${gcsFileName}`);


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
            // The public URL can be used to directly access the file via HTTP.
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

            // Make the image public to the web (since we'll be displaying it in browser)
            file.makePublic().then(() => {
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


app.use(Sentry.Handlers.errorHandler());

app.use(function onError(err, req, res, next) {
    res.statusCode = 500;
    res.end(res.sentry + "\n" + err.message);
});

const listener = app.listen(process.env.PORT || 8080 || 8500, function () {
    console.log("Listening on port " + listener.address().port);
});

export default app;
