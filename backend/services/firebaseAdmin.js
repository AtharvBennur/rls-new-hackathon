import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Initialize Firebase Admin
const initializeFirebase = () => {
  try {
    if (admin.apps.length > 0) {
      return admin;
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (!privateKey || !process.env.FIREBASE_PROJECT_ID) {
      console.log('⚠️  Firebase Admin SDK not fully configured');
      return null;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      })
    });

    console.log('✅ Firebase Admin initialized');
    return admin;
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error.message);
    return null;
  }
};

const firebaseAdmin = initializeFirebase();

// Verify Firebase ID Token
export const verifyIdToken = async (idToken) => {
  if (!firebaseAdmin) {
    throw new Error('Firebase Admin not initialized');
  }
  
  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Get user by UID
export const getUserByUid = async (uid) => {
  if (!firebaseAdmin) {
    throw new Error('Firebase Admin not initialized');
  }
  
  try {
    const userRecord = await firebaseAdmin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    throw new Error('User not found');
  }
};

// Send email verification
export const sendEmailVerification = async (email) => {
  if (!firebaseAdmin) {
    throw new Error('Firebase Admin not initialized');
  }
  
  try {
    const link = await firebaseAdmin.auth().generateEmailVerificationLink(email);
    return link;
  } catch (error) {
    throw new Error('Could not generate verification link');
  }
};

export default firebaseAdmin;
