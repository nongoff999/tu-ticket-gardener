/**
 * TU Ticket Gardener - Firebase Configuration
 * มหาวิทยาลัยธรรมศาสตร์ รังสิต
 * 
 * วิธีตั้งค่า Firebase:
 * 1. ไปที่ https://console.firebase.google.com
 * 2. สร้าง Project ใหม่ (ชื่ออะไรก็ได้ เช่น tu-ticket-gardener)
 * 3. ไปที่ Project Settings > General > Your apps > Web app
 * 4. Copy ค่า apiKey, authDomain, databaseURL, projectId มาวางแทนที่ด้านล่าง
 * 5. ไปที่ Realtime Database > Create Database > Start in test mode
 */

// =====================================
// 🔥 FIREBASE CONFIG - แก้ไขค่าตรงนี้!
// =====================================
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// =====================================
// Firebase Initialization
// =====================================
let firebaseApp = null;
let database = null;
let isFirebaseEnabled = false;

// Check if Firebase config is set
function isFirebaseConfigured() {
    return firebaseConfig.apiKey !== "YOUR_API_KEY" &&
        firebaseConfig.projectId !== "YOUR_PROJECT_ID";
}

// Initialize Firebase
function initFirebase() {
    if (!isFirebaseConfigured()) {
        console.warn('⚠️ Firebase ยังไม่ได้ตั้งค่า - ใช้ LocalStorage แทน');
        console.log('📖 ดูวิธีตั้งค่าที่ไฟล์ js/firebase.js');
        return false;
    }

    try {
        // Initialize Firebase
        firebaseApp = firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        isFirebaseEnabled = true;
        console.log('🔥 Firebase เชื่อมต่อสำเร็จ!');
        return true;
    } catch (error) {
        console.error('❌ ไม่สามารถเชื่อมต่อ Firebase:', error);
        return false;
    }
}

// =====================================
// Firebase Data Functions
// =====================================

// Load data from Firebase
async function loadDataFromFirebase() {
    if (!isFirebaseEnabled) return null;

    try {
        const snapshot = await database.ref('tickets').once('value');
        const data = snapshot.val();

        if (data) {
            console.log('☁️ โหลดข้อมูลจาก Firebase สำเร็จ');
            return data;
        }
        return null;
    } catch (error) {
        console.error('❌ โหลดข้อมูลจาก Firebase ล้มเหลว:', error);
        return null;
    }
}

// Save data to Firebase
async function saveDataToFirebase(data) {
    if (!isFirebaseEnabled) return false;

    try {
        await database.ref('tickets').set(data);
        console.log('☁️ บันทึกข้อมูลไป Firebase สำเร็จ');
        return true;
    } catch (error) {
        console.error('❌ บันทึกข้อมูลไป Firebase ล้มเหลว:', error);
        return false;
    }
}

// Listen for realtime updates
function listenForUpdates(callback) {
    if (!isFirebaseEnabled) return;

    database.ref('tickets').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && callback) {
            console.log('🔄 ได้รับข้อมูลใหม่จาก Firebase');
            callback(data);
        }
    });
}

// Export functions
window.initFirebase = initFirebase;
window.isFirebaseEnabled = () => isFirebaseEnabled;
window.loadDataFromFirebase = loadDataFromFirebase;
window.saveDataToFirebase = saveDataToFirebase;
window.listenForUpdates = listenForUpdates;
