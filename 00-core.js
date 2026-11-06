/* COT System Version: V202611061559 */
// קובץ: 00-core.js
// הגדרות גלובליות, חיבור Firebase ומצב משותף. נטען ראשון, לפני כל שאר קבצי COT.

const SECURITY_DEADLINE = new Date("2026-11-15T00:00:00");
const ENFORCE_STRICT_SECURITY = new Date() >= SECURITY_DEADLINE;

window.carryOverData = {};
window.monthlyBalances = {}; 
const MINIMUM_ESHEL_RATE = 52.66; 

window.isDialogOpen = false; // משתנה גלובלי לזיהוי הודעה פתוחה

const firebaseConfig = {
    apiKey: "AIzaSyDzcW_tXO08BxmWki2Imx6sxq_4YKyxBLQ",
    authDomain: "cot2026.firebaseapp.com",
    projectId: "cot2026",
    storageBucket: "cot2026.firebasestorage.app",
    messagingSenderId: "187692524237",
    appId: "1:187692524237:web:6127236e55a6a763dc3f84"
};
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.firestore();

function showLoading(show) { document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none'; }

// הגנה מפני XSS: כל טקסט שהמשתמש הקליד (למשל שם עובד) שנכנס ל-innerHTML/תבנית HTML חייב לעבור את
// זה קודם. בלי זה, שם עובד כמו <img src=x onerror=...> היה מתבצע בפועל ברגע שה-HTML נטען לדף -
// כולל בחלונות שמוצגים למשתמש *אחר* (כמו יומן אי-ההתאמות שמנהל המערכת פותח), שזה בדיוק המקרה
// החמור ביותר: עובד רגיל אחד יכול "להריץ קוד" בתוך הסשן המחובר של מנהל המערכת.
window.escapeHtml = function(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

