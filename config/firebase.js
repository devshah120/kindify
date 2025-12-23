const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let firebaseApp;

try {
  // Check if Firebase credentials are provided via environment variable (JSON string)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } 
  // Or check if path to service account file is provided
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  // Or use default credentials (for Google Cloud environments)
  else {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  }
  
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error.message);
  console.warn('Firebase notifications will not work until credentials are configured');
}

module.exports = admin;



