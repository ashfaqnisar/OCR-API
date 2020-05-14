import express from 'express';
import path from 'path';
import morgan from 'morgan';
import cors from 'cors';
import indexRouter from './routes/index'
import usersRouter from './routes/users'
import firebase, {db} from './firebase'
import * as Sentry from '@sentry/node';

const app = express();


Sentry.init({ dsn: 'https://f2c1250fc2344eaa8c11e9a3e2503fb9@o361783.ingest.sentry.io/5239445' });
// app.set('views', path.join(__dirname, 'routes'));
// app.set('view engine', 'pug');
app.use(Sentry.Handlers.requestHandler());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, "public")));




app.get('/', (req, res) => {
    res.status(200).send(`OCR API`)
});



app.get('/debug-sentry', function mainHandler(req, res) {
    throw new Error('This is an test error!');
});

app.use(Sentry.Handlers.errorHandler());

// app.use(function onError(err, req, res, next) {
//     res.statusCode = 500;
//     res.end(res.sentry + "\n" + err.message);
// });

const listener = app.listen(process.env.PORT || 8080 || 8500, function () {
    console.log("Listening on port " + listener.address().port);
});

export default app;
