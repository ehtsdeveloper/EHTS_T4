const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// 1. SETUP FIREBASE ADMIN
// This allows the server to bypass rules and manage Auth users
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

// 2. SETUP EXPRESS
const app = express();
app.use(cors()); // Allow React to talk to us
app.use(express.json());

// 3. SETUP EMAIL TRANSPORTER (Gmail Example)
// Ideally, use environment variables for passwords!
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'YOUR_GMAIL_ADDRESS@gmail.com', // Replace this
    pass: 'YOUR_GMAIL_APP_PASSWORD'      // Replace this (Search "Gmail App Password" to generate one)
  }
});

// --- API ROUTES ---

// CREATE EMPLOYEE (Auth + Database)
app.post('/api/create-employee', async (req, res) => {
  try {
    const { email, password, companyId, userData } = req.body;

    // A. Create User in Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: userData.fullName
    });

    // B. Create Profile in Firestore
    await db.collection('companies').doc(companyId).collection('employees').doc(userRecord.uid).set({
      ...userData,
      authUid: userRecord.uid,
      createdAt: new Date().toISOString(),
      role: 'employee'
    });

    res.status(200).send({ success: true, uid: userRecord.uid });
    console.log(`Created user: ${email}`);

  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send({ error: error.message });
  }
});

// DELETE EMPLOYEE (Auth + Database)
app.post('/api/delete-employee', async (req, res) => {
  try {
    const { uid, companyId } = req.body;

    // A. Delete from Auth (The "Zombie" Killer)
    await auth.deleteUser(uid);

    // B. Delete from Firestore
    await db.collection('companies').doc(companyId).collection('employees').doc(uid).delete();

    res.status(200).send({ success: true });
    console.log(`Deleted user: ${uid}`);

  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send({ error: error.message });
  }
});

// SEND EMAIL (Access Code)
app.post('/api/send-email', async (req, res) => {
  try {
    const { email, name, code } = req.body;

    const mailOptions = {
      from: 'EHTS System <noreply@ehts.com>',
      to: email,
      subject: 'New EHTS Test Assigned',
      text: `Hello ${name},\n\nA new bias test has been assigned to you.\n\nACCESS CODE: ${code}\n\nPlease open the Watch App and enter this code to begin.`
    };

    // Note: This will only work if you configured the 'transporter' above
    // await transporter.sendMail(mailOptions);
    
    // For now, we just log it to the server console
    console.log(`[MOCK EMAIL] To: ${email} | Code: ${code}`);

    res.status(200).send({ success: true });

  } catch (error) {
    console.error("Email error:", error);
    res.status(500).send({ error: error.message });
  }
});

// START SERVER
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});