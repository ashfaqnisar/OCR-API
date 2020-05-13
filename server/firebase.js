import firebase from "firebase";
import firebaseConfig from './firebase.json'

firebase.initializeApp(firebaseConfig);
export const db = firebase.firestore();
export default firebase;
