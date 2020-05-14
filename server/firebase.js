import firebase from "firebase";
const config ={
    "apiKey": "AIzaSyAM5ll_76WioPQyUqole9R_cT923t8X4Og",
    "authDomain": "ezerka-ocr.firebaseapp.com",
    "databaseURL": "https://ezerka-ocr.firebaseio.com",
    "projectId": "ezerka-ocr",
    "storageBucket": "ezerka-ocr.appspot.com",
    "messagingSenderId": "736297238373",
    "appId": "1:736297238373:web:6c3dbe34c87b6e1ba4eb8c",
    "measurementId": "G-T9PG0MJEQN"
}

firebase.initializeApp(config);
export const db = firebase.firestore();
export default firebase;
