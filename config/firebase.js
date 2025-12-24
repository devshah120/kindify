const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
let firebaseApp;
let isInitialized = false;

try {
  // Check if Firebase credentials are provided via environment variable (JSON string)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      isInitialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully (from FIREBASE_SERVICE_ACCOUNT)');
    } catch (parseError) {
      console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT JSON:', parseError.message);
    }
  } 
  // Or check if path to service account file is provided
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    
    if (!fs.existsSync(serviceAccountPath)) {
      console.error(`❌ Firebase service account file not found: ${serviceAccountPath}`);
      console.warn('💡 Please check FIREBASE_SERVICE_ACCOUNT_PATH in your .env file');
    } else {
      try {
        const serviceAccount = require(serviceAccountPath);
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        isInitialized = true;
        console.log('✅ Firebase Admin SDK initialized successfully (from file)');
      } catch (requireError) {
        console.error('❌ Error loading Firebase service account file:', requireError.message);
        console.warn('💡 Please check that the JSON file is valid');
      }
    }
  }
  // Or use default credentials (for Google Cloud environments)
  else {
    try {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      isInitialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully (using default credentials)');
    } catch (defaultError) {
      console.error('❌ Firebase initialization failed:', defaultError.message);
      console.warn('');
      console.warn('═══════════════════════════════════════════════════════════');
      console.warn('⚠️  FIREBASE NOT CONFIGURED');
      console.warn('═══════════════════════════════════════════════════════════');
      console.warn('To fix this, add ONE of these to your .env file:');
      console.warn('');
      console.warn('Option 1 (Recommended):');
      console.warn('  FIREBASE_SERVICE_ACCOUNT_PATH=./config/serviceAccountKey.json');
      console.warn('');
      console.warn('Option 2:');
      console.warn('  FIREBASE_SERVICE_ACCOUNT=\'{"type":"service_account",...}\'');
      console.warn('');
      console.warn('See FIREBASE_SETUP_QUICK.md for detailed instructions');
      console.warn('═══════════════════════════════════════════════════════════');
      console.warn('');
    }
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  console.warn('💡 Firebase notifications will not work until credentials are configured');
}

// Export admin and initialization status
admin.isInitialized = isInitialized;
module.exports = admin;




