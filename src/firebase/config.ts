import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

// These values are public and safe to commit to version control.
// Martin should paste his actual Firebase web app config here once created in the console.
const firebaseConfig = {
  apiKey: "PLACEHOLDER_API_KEY",
  authDomain: "smart10-cb385.firebaseapp.com",
  databaseURL: "https://smart10-cb385-default-rtdb.firebaseio.com",
  projectId: "smart10-cb385",
  storageBucket: "smart10-cb385.appspot.com",
  messagingSenderId: "PLACEHOLDER_SENDER_ID",
  appId: "PLACEHOLDER_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// Connect to emulators in development
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8080);
  connectDatabaseEmulator(rtdb, "localhost", 9000);
}
