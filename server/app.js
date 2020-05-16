import express from 'express';
import path from 'path';
import morgan from 'morgan';
import cors from 'cors';
import firebase, {db} from './firebase'
import * as Sentry from '@sentry/node';

const app = express();


Sentry.init({dsn: 'https://f2c1250fc2344eaa8c11e9a3e2503fb9@o361783.ingest.sentry.io/5239445'});
// app.set('views', path.join(__dirname, 'routes'));
// app.set('view engine', 'pug');
app.use(Sentry.Handlers.requestHandler());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, "public")));


const increment = firebase.firestore.FieldValue.increment(1);

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

app.post("/ocr", async (req, res) => {
    try {
        const {image} = req.body;
        const {uid} = req.query;

        if (!uid) {
            res.status(400).json({code: 400, message: "Please,provide the uid with the request"})
        }

        const statsRef = db.collection("--stats--").doc("ocr");

        const userRef = db.collection("users").doc(uid)
        const ocrRef = userRef.collection("ocr").doc()

        const batch = db.batch();

        batch.set(ocrRef, {image, ocrId: ocrRef.id, text: "Text from image"});
        batch.set(statsRef, {count: increment}, {merge: true});
        await batch.commit()

        const ocr = await ocrRef.get()
        res.status(200).send(ocr.data());

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
        }

        const ocrRef = db.collection("users").doc(uid).collection("ocr").doc(ocrId)
        let ocr = await ocrRef.get()
        if (!ocr.exists) {
            const emptyError = {
                code: 204,
                message: `No, ocr available with ${uid}`
            }
            res.status(400).json(emptyError)
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
        }
        let ocrArray = [];

        const ocrDocs = await db.collection("users").doc(uid).collection("ocr").get()

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


app.get('/debug-sentry', function mainHandler(req, res) {
    throw new Error('This is an test error!');
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
