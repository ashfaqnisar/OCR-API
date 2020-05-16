import express from 'express';
import path from 'path';
import morgan from 'morgan';
import cors from 'cors';
import * as Sentry from '@sentry/node';
import vision from '@google-cloud/vision'
import {Storage} from '@google-cloud/storage';
import multer, {memoryStorage} from "multer";
import service from './service'

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

const options = {
    projectId: "test1-235407", keyFileName: service
}
const client = new vision.ImageAnnotatorClient(options)
const storage = new Storage(options);


const bucketName = "bucket-ezerka-ocr"

const bucketFileName = "best.pdf"

const outputPrefix = 'results'

const gcsSourceUri = `gs://${bucketName}/${bucketFileName}`;
const gcsDestinationUri = `gs://${bucketName}/${outputPrefix}/`;


const inputConfig = {
    // Supported mime_types are: 'application/pdf' and 'image/tiff'
    mimeType: 'application/pdf',
    gcsSource: {
        uri: gcsSourceUri,
    },
};
const outputConfig = {
    gcsDestination: {
        uri: gcsDestinationUri,
    },
};
const features = [{type: 'DOCUMENT_TEXT_DETECTION'}];
const request = {
    requests: [
        {
            inputConfig: inputConfig,
            features: features,
            outputConfig: outputConfig,
        },
    ],
};

const mul = multer({
    storage: memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});
const bucket = storage.bucket(bucketName)


app.get('/process', async (req, res) => {
    try {
        const [operation] = await client.asyncBatchAnnotateFiles(request);
        const [filesResponse] = await operation.promise();
        const destinationUri =
            filesResponse.responses[0].outputConfig.gcsDestination.uri;
        console.log('Json saved to: ' + destinationUri);

        res.status(200).send(destinationUri)
    } catch (e) {
        const err = {
            code: e.code || 500,
            message: e.message || e.status
        }
        res.status(e.code || 500).send(err)
    }

});
app.post("/upload", mul.single("file"), async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400).json('Provide an pdf')
        }
        const gcsFileName = `${req.file.originalname}`
        const file = bucket.file(gcsFileName);

        const blobStream = file.createWriteStream({
            metadata: {
                contentType: req.file.mimetype
            }
        });

        blobStream.on("error", err => {
            next(err);
        });

        blobStream.on("finish", () => {
            // The public URL can be used to directly access the file via HTTP.
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

            // Make the image public to the web (since we'll be displaying it in browser)
            file.makePublic().then(() => {
                res.status(200).send(`Success!\n Image uploaded to ${publicUrl}`);
            });
        });

        blobStream.end(req.file.buffer);

    } catch (e) {
        res.status(500).send({...e})
    }
})

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
