// IMPORTANT: Replace these placeholder values with your actual Firebase project config
// You can find this in your Firebase Console -> Project Settings -> General -> Web Apps
const firebaseConfig = {
    apiKey: "AIzaSyBQ0j4whDMkINtsW65iMIdQ75SIVhOpGgI",
    authDomain: "studentmanagementsystem-52fa7.firebaseapp.com",
    projectId: "studentmanagementsystem-52fa7",
    storageBucket: "studentmanagementsystem-52fa7.firebasestorage.app",
    messagingSenderId: "974530050933",
    appId: "1:974530050933:web:9f07725110a95881b1b13c",
    measurementId: "G-MQRZP0S0ML"
};

// Initialize Firebase
var app, db;
try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    window.db = db; // Export globally
    console.log("Firebase initialized successfully.");
} catch (error) {
    console.error("Firebase initialization error:", error);
}
