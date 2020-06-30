import firebase, {db} from "../firebase";
import express from 'express';

const router = express.Router();
const increment = firebase.firestore.FieldValue.increment(1);
const decrement = firebase.firestore.FieldValue.increment(-1);

router.post("/users", async (req, res) => {
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
router.get("/users", async (req, res) => {
    try {
        let users = await db.collection("users").orderBy("uid", "asc").get()
        users = users.docs.map(user => user.data())
        res.status(200).send(users);
    } catch (err) {
        const error = {
            code: err.code || 500,
            message: err.message || err.status,
        }
        res.status(err.code || 500).json(error);
    }

});
router.get("/users/:uid", async (req, res) => {
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
router.delete("/users/:uid", async (req, res) => {
    try {
        const {uid} = req.params;

        const userRef = db.collection("users").doc(uid.toString())
        const statsRef = db.collection("--stats--").doc("users");

        const batch = db.batch();

        batch.delete(userRef)
        batch.set(statsRef, {count: decrement}, {merge: true})

        batch.commit()
            .then(() => res.status(200).send(`Deleted ${uid} user successfully`))


    } catch (err) {
        const error = {
            code: err.code || 500,
            message: err.message || err.status,
        }
        res.status(err.code || 500).json(error);
    }

});

router.get("/users/:uid/stats", async (req, res) => {
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

export default router