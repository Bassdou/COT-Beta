/* COT System Version: V202611061559 */
// קובץ: 07-version-manager.js
// בדיקת גרסה מול version.json ומול הענן, הצגת התראת "גרסה חדשה", ועדכון אוטומטי של גרסת הענן כשהמנהל מחובר.

const ADMIN_EMAIL = "bassam@bsbc.co.il"; 

let cotLocalVersion = null, cotCloudVersion = null, cotCloudLoaded = false, cotUpdatesUnsub = null;

function evaluateVersionState() {
    if (!cotLocalVersion || !cotCloudLoaded) return;
    const currentUser = firebase.auth().currentUser;
    if (currentUser && currentUser.email && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        // מנגנון המנהל (Auto Updater)
        if (cotLocalVersion !== cotCloudVersion) {
            db.collection('system').doc('settings').set({ latestVersion: cotLocalVersion }, { merge: true })
                .then(() => console.log("Admin Action: Cloud version updated automatically to " + cotLocalVersion))
                .catch(err => console.error("Admin version update failed:", err));
        }
    } else if (cotCloudVersion && cotLocalVersion !== cotCloudVersion) {
        // משתמשי קצה
        showUpdateToast(cotCloudVersion);
    }
}

async function checkForUpdates() {
    try {
        // 1. קריאת הגרסה מהקובץ החיצוני (תוך עקיפת המטמון בכוח)
        const response = await fetch('version.json?t=' + new Date().getTime());
        const data = await response.json();
        cotLocalVersion = data.version;

        // עדכון החותמות הפיזיות במסך הראשי ובמסך ההתחברות (לנוחות המשתמש)
        const versionStamp = document.querySelector('.app-version-badge');
        const loginVersionBadge = document.querySelector('.login-version-badge');
        if (versionStamp) versionStamp.innerText = cotLocalVersion;
        if (loginVersionBadge) loginVersionBadge.innerText = cotLocalVersion;

        // הבודק הסמוי: חסימת בדיקת הענן למניעת שיבושים במסך
        if (window.isTesterMode) return;

        // 2. האזנה יחידה למסד הנתונים (נקראת פעם אחת בלבד, גם אם הפונקציה רצה כמה פעמים)
        if (!cotUpdatesUnsub) {
            cotUpdatesUnsub = db.collection('system').doc('settings').onSnapshot(doc => {
                if (doc.exists) {
                    cotCloudVersion = doc.data().latestVersion;
                    cotCloudLoaded = true;
                    evaluateVersionState();
                }
            });
        } else {
            evaluateVersionState(); // למשל: המנהל התחבר אחרי שההאזנה כבר קיבלה נתונים
        }
    } catch (error) {
        console.error("שגיאה בבדיקת גרסאות מערכת:", error);
    }
}

function showUpdateToast(newVersion) {
    const toast = document.getElementById('updateToast');
    if (toast) {
        toast.style.display = 'flex';
        window.newCloudVersion = newVersion; // שמירת חותמת לטובת הרענון
    }
}

window.applyUpdate = function() {
    // שומרים טיוטה של מה שהוקלד (אם יש) לפני הרענון הכפוי, כדי לשחזר אותה אוטומטית אחרי הטעינה מחדש
    if (window.saveDraftBeforeRefresh) window.saveDraftBeforeRefresh();
    // רענון כפוי שעוקף את המטמון של הדפדפן כדי לשאוב את הקבצים החדשים
    window.location.href = window.location.pathname + '?v=' + (window.newCloudVersion || new Date().getTime());
};

// הפעלה אוטומטית של המנגנון רק לאחר שהמשתמש מחובר (או מיד במסך ההתחברות כדי להציג גרסה)
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(checkForUpdates, 1000);
});

firebase.auth().onAuthStateChanged(user => {
    if (user) {
        setTimeout(checkForUpdates, 1500); 
    }
});
