/* COT System Version: V202611061559 */
// קובץ: 10-payroll-audit.js
// "בדיקת דו"ח פיצול" - בקרה מקיפה על דוח הפיצול של מחלקת השכר, בנפרד לגמרי מ"יבא דו"ח פיצול"
// (שמטרתו רק לחסוך הקלדה). כאן המטרה הפוכה: COT משמש כ"חשב שכר מומחה" ומצביע על פערים.
//
// העקרון: לא בונים מחדש את חוקי התקשי"ר - calculator.js כבר מיישם ומאמת אותם (תקן 8/7/6.5/5.5,
// פיצול לאחוזים, זכאות ל-20%/50% וכו'). במקום זאת, מריצים את מנוע החישוב האמיתי של COT על אותן
// שעות כניסה/יציאה בדיוק שמופיעות בדוח (באמצעות כתיבתן לטבלה הקיימת, כמו ייבוא רגיל), ומשווים
// כל עמודה בתוצאה מול מה שהדוח בפועל מציג - כל פער הוא אוטומטית "חוקי לעומת בפועל".

// נושא בדיקה: קטגוריה עסקית משמעותית לכל עמודה, לא קוד עמודה גולמי - זה מה שמאפשר לזהות "מגמה"
// (הרבה פערים תחת אותו נושא, בחודש אחד, אצל עובדים שונים) ולא רק רשימת שורות בודדות לא-קשורות.
// תואם לקיבוץ העמודות שכבר מוצג בכותרת הטבלה הראשית עצמה (ת.מ./ש"נ/שבת/ש"נ).
const DISCREPANCY_TOPICS = {
    'total-hours': 'סה"כ שעות', 'shabbat-hours': 'חופש שבת',
    I: 'תקן שעות', I2: 'שעות רגילות',
    J: 'שעות נוספות (ש"נ)', K: 'שעות נוספות (ש"נ)', L: 'שעות נוספות (ש"נ)', M: 'שעות נוספות (ש"נ)', N: 'שעות נוספות (ש"נ)',
    O: 'תעריפי שבת/חג', P: 'תעריפי שבת/חג', Q: 'תעריפי שבת/חג', R: 'תעריפי שבת/חג',
    S: 'תוספות מיוחדות (ת.מ.)', T: 'תוספות מיוחדות (ת.מ.)', U: 'תוספות מיוחדות (ת.מ.)', V: 'תוספות מיוחדות (ת.מ.)', W: 'תוספות מיוחדות (ת.מ.)',
};
function topicFor(col) { return DISCREPANCY_TOPICS[col] || col; }

const AUDIT_COLUMN_LABELS = {
    I: 'תקן', I2: 'רגילות', J: '100%', K: '125%', L: '150%', M: '175%', N: '200%',
    O: '180%', P: '187.5%', Q: '225%', R: '250%', S: '20%', T: '50%', U: '75%', V: '87.5%', W: '100%',
};

const AUDIT_COLUMN_EXPLANATIONS = {
    I: 'מכסת שעות התקן (8 שעות ליום חול, 7 למשמרת לילה, 6.5 ליום שישי, לפי שעות מקוצרות לערבי חג) חושבה אחרת מהצפוי.',
    J: 'שעות מעבר לתקן אמורות להיספר כ-100% עד לסף השעות הנוספות הראשון.',
    K: 'שעות נוספות מהסוג השני אמורות להיספר כ-125%.',
    L: 'שעות נוספות מעבר לסף השני אמורות להיספר כ-150%.',
    S: 'זכאות ל-20% תוספת צהריים דורשת עבודה של 3 שעות לפחות אחרי 14:00, עם סיום אחרי 17:00.',
    T: 'זכאות ל-50% תוספת לילה דורשת 2 שעות לפחות בין 22:00 ל-06:00.',
};
function explanationFor(col, shiftType) {
    // קוד חש מקבל הסבר ייעודי (לא רק "תקן שגוי") - הכלל כולל גם קיזוז ממאזן חופש שבת, לא רק את
    // עמודת השעות עצמה, ולכן דורש ניסוח שונה מהסבר ה-I הכללי.
    if (shiftType === 'חש' && col === 'I') {
        return 'קוד חש מזכה 8 שעות תקן ומקזז יום שלם (-1.00) ממאזן חופש השבת הייעודי - אין לכך השפעה על תקן השעות השבועי הרגיל.';
    }
    return AUDIT_COLUMN_EXPLANATIONS[col] || 'שיעור השעות בעמודה זו אמור להיגזר ממכפיל חוקי קבוע (ראו הסכם/תקשי"ר), ואינו תואם את מה שחושב בפועל.';
}

// כל עמודות השעות הלא-אפס של COT ליום נתון (לא רק אלה שהתגלו כשגויות) - כדי שאפשר להציג את כל
// חלוקת היום בבלוק אחד, לא רק שורה מבודדת לכל פער (זה בדיוק מה שיצר את ה"קפיצה" המבלבלת קודם).
function getCotHourColumns(day) {
    const out = [];
    for (const col of (window.HOUR_COLUMNS_ORDER || [])) {
        const el = document.getElementById('val-' + col + '-' + day);
        if (!el) continue;
        const v = parseFloat(el.getAttribute('data-val') || 0);
        if (Math.abs(v) >= 0.005) out.push({ col: col, val: v });
    }
    return out;
}

function getDayShiftType(day) {
    const tr = document.querySelector('#tbody tr:nth-child(' + day + ')');
    return tr ? (tr.querySelector('.shift-type-input')?.value || '') : '';
}

// מריצה בדיקה מקיפה: לכל יום שחולץ, כותבת את השעות לטבלה (אם עדיין לא שם), ומשווה את כל עמודות
// השעות של COT מול מה שהדוח מציג - אותה שיטת יישור-רצף שכבר קיימת ומאומתת ב-detectPayrollDiscrepancies.
// חשוב: הפונקציה הזו לעולם לא כותבת/משנה שעות בטבלה. "יבא דו"ח פיצול" (ייבוא+בדיקה+תיקון ע"י
// העובד) היא תמיד פעולה מקדימה שחייבת לקרות לפני זה; הבדיקה כאן משווה את חישוב COT מהשעות
// שכבר בטבלה (אחרי שהעובד עבר עליהן ותיקן, אם היה צריך) מול מה שבדוח - לא מחליפה אותן בשקט
// בשעות הגולמיות מהסריקה. אם זה היה קורה, היינו מאבדים בדיוק את תיקוני העובד שחלק מהתהליך.
window.auditPayrollReport = function(extractedDays) {
    const report = [];
    for (const d of extractedDays) {
        if (!d.rawNumbers || d.rawNumbers.length === 0) continue; // יום היעדרות ללא שעות - אין מה להשוות כאן
        const tr = document.querySelector('#tbody tr:nth-child(' + d.day + ')');
        if (!tr) continue;
        const times = tr.querySelectorAll('.time-input');
        const cotStart = times[0]?.value || '', cotEnd = times[1]?.value || '';
        const mismatches = window.detectPayrollDiscrepancies([d]);
        if (mismatches.length > 0) {
            report.push({
                day: d.day, cotStart: cotStart, cotEnd: cotEnd, reportStart: d.start, reportEnd: d.end,
                mismatches: mismatches[0].mismatches,
                shiftType: getDayShiftType(d.day),
                allColumns: getCotHourColumns(d.day), // כל חלוקת היום, לא רק מה שגוי - להצגה מלאה בבלוק
            });
        }
    }
    return report;
};

// רושמת כל אי-התאמה כשורה נפרדת ביומן מתמשך (לא רק מוצגת פעם אחת ונעלמת) - נגיש למנהל המערכת
// בכל עת, לא רק לעובד שהריץ את הבדיקה כרגע. זה מה שמאפשר לזהות מגמה (הרבה שורות תחת אותו נושא,
// באותו חודש, אצל עובדים שונים => כנראה באג בקוד; שורה בודדת אצל עובד אחד => כנראה טעות/דוח).
// כשלון כתיבה (למשל אם חוקי האבטחה של Firestore עוד לא מאפשרים את זה) לא עוצר/מבטל את הבדיקה
// עצמה - העובד עדיין מקבל את התוצאה והקובץ להדפסה, רק הרישום ליומן לא מתבצע באותו מקרה.
window.logPayrollDiscrepancies = async function(report) {
    var user = firebase.auth().currentUser;
    if (!user || typeof db === 'undefined') return;
    var ym = getSelectedMonthYear();
    var empName = (document.getElementById('employeeName')?.value || '').trim() || 'ללא שם';
    var writes = [];
    for (var r of report) {
        for (var m of r.mismatches) {
            writes.push(db.collection('payrollAuditLog').add({
                topic: topicFor(m.col), column: m.col, employeeName: empName, uid: user.uid,
                year: ym.y, month: ym.m, day: r.day, shiftType: r.shiftType || '',
                cotVal: m.cotVal, pdfVal: m.pdfVal,
                timestamp: new Date().toISOString(),
            }).catch(function(e) { console.error('payrollAuditLog write failed:', e); }));
        }
    }
    try { await Promise.all(writes); } catch (e) { /* כשלון בודד לא אמור לעצור את השאר - כל כתיבה כבר תפסה את השגיאה שלה למעלה */ }
};

// כפתור אחד בלבד: "יבא דו"ח פיצול" ← (אחרי "עדכן שעות") → "בדוק דו"ח פיצול". השלב השני לא דורש
// העלאת קובץ מחדש בכלל - משתמש בנתונים שכבר חולצו בשלב הייבוא (window.__lastPayrollExtractedDays),
// שנכתבו ממש לפי מה שהעובד תיקן בפועל.
window.transformImportButtonToAudit = function() {
    const btn = document.getElementById('importPayrollBtn');
    if (!btn) return;
    btn.textContent = 'בדוק דו"ח פיצול';
    btn.style.backgroundColor = '#0E7490';
    btn.onclick = function() { window.runPayrollAudit(); };
};

window.runPayrollAudit = async function() {
    const days = window.__lastPayrollExtractedDays;
    if (!days || days.length === 0) return customAlert("לא נמצאו נתוני דוח לבדיקה. יש לייבא דוח שכר קודם.");
    const report = window.auditPayrollReport(days);
    if (report.length > 0) await window.logPayrollDiscrepancies(report); // תמיד נרשם ליומן, בלי תלות במי שהריץ את הבדיקה
    renderPayrollAudit(report);
};

// תצוגה שונה לעובד מול מנהל המערכת, בכוונה: העובד מקבל אישור פשוט, לא רשימה טכנית של קודי עמודות
// (שלא אומרת לו כלום ורק עלולה להדאיג סתם) - הוא כבר קיבל את מה שבאמת שימושי לו (קובץ ה-PDF
// להדפסה למחלקת השכר). הפירוט הטכני המלא קיים תמיד ביומן (payrollAuditLog), נגיש למנהל בנפרד -
// לא "נעלם" רק כי העובד לא מנהל מערכת.
function renderPayrollAudit(report) {
    window.__lastPayrollAuditReport = report;
    const body = document.getElementById('payrollAuditBody');
    if (!body) return;
    const isAdmin = window.isPayrollAnalysisAdmin && window.isPayrollAnalysisAdmin();
    let html;
    if (report.length === 0) {
        html = '<p style="color:#15803D;font-weight:700;">לא נמצאו פערים בין הדוח לחישוב COT לכל הימים שנבדקו. ✅</p>';
    } else if (!isAdmin) {
        html = `<p style="color:#B3261E;font-weight:700;">נמצאו ${report.length} ימים עם אי-התאמה בין הדוח לחישוב המערכת. הפרטים נרשמו לבדיקת מנהל המערכת - אפשר להמשיך ולהדפיס את התוצאות למחלקת השכר.</p>`;
    } else {
        const adminMsg = window.buildPayrollAdminMessageText(report);
        html = `<p style="color:#B3261E;font-weight:700;margin-bottom:10px;">נמצאו פערים ב-${report.length} ימים (מוצג רק עבורך).</p>` +
            '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:14px;">' +
            '<tr style="background:#E3ECF8;"><th style="padding:3px 6px;">יום</th><th style="padding:3px 6px;">כניסה</th><th style="padding:3px 6px;">יציאה</th><th style="padding:3px 6px;">נושא</th><th style="padding:3px 6px;">COT</th><th style="padding:3px 6px;">דוח</th></tr>';
        for (const r of report) {
            for (const m of r.mismatches) {
                html += `<tr style="border-bottom:1px solid #DCE3EC;"><td style="padding:3px 6px;text-align:center;">${r.day}</td>` +
                    `<td style="padding:3px 6px;text-align:center;">${r.cotStart}</td><td style="padding:3px 6px;text-align:center;">${r.cotEnd}</td>` +
                    `<td style="padding:3px 6px;text-align:center;">${topicFor(m.col)}</td>` +
                    `<td style="padding:3px 6px;text-align:center;">${m.cotVal !== null ? m.cotVal.toFixed(2) : '-'}</td>` +
                    `<td style="padding:3px 6px;text-align:center;">${m.pdfVal !== null ? m.pdfVal.toFixed(2) : '-'}</td></tr>`;
            }
        }
        html += '</table>' +
            '<div style="background:#F3E8DA;border-right:4px solid #B06F1F;border-radius:8px;padding:10px 14px;">' +
            '<div style="font-weight:800;color:#7a4e10;font-size:13px;margin-bottom:6px;">הודעה טכנית הוכנה עבור מנהל המערכת</div>' +
            '<textarea readonly style="width:100%;height:120px;font-size:11.5px;padding:8px;border:1px solid #DCE3EC;border-radius:6px;box-sizing:border-box;">' + adminMsg + '</textarea>' +
            '</div>';
    }
    body.innerHTML = html + '<button onclick="downloadPayrollErrorReportPDF()" style="background:#0E7490;color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13.5px;font-weight:700;cursor:pointer;margin-top:14px;display:' + (report.length === 0 ? 'none' : 'inline-block') + ';">הדפס תוצאות בדיקה</button>';
    document.getElementById('payrollAuditModal').style.display = 'block';
}

// יומן אי-התאמות מצטבר - מנהל-בלבד. הנקודה המרכזית: קיבוץ לפי נושא+חודש (לא רק רשימת שורות),
// כדי שאפשר לראות במבט אחד "הרבה שורות תחת אותו נושא, באותו חודש, אצל עובדים שונים" - בדיוק
// המגמה שמעידה על באג בקוד COT, לעומת שורה בודדת אצל עובד אחד שכנראה טעות נקודתית.
window.openPayrollAuditLogViewer = async function() {
    if (!window.isPayrollAnalysisAdmin || !window.isPayrollAnalysisAdmin()) return;
    if (typeof db === 'undefined') return customAlert("אין חיבור לענן כרגע.");
    const body = document.getElementById('payrollAuditLogBody');
    if (!body) return;
    body.innerHTML = '<p>טוען...</p>';
    document.getElementById('payrollAuditLogModal').style.display = 'block';
    try {
        const snap = await db.collection('payrollAuditLog').orderBy('timestamp', 'desc').limit(500).get();
        const rows = snap.docs.map((d) => d.data());
        renderPayrollAuditLog(rows);
    } catch (err) {
        console.error("payrollAuditLog query failed:", err);
        body.innerHTML = '<p style="color:#B3261E;">שגיאה בטעינת היומן: ' + err.message + '</p>';
    }
};

function renderPayrollAuditLog(rows) {
    const body = document.getElementById('payrollAuditLogBody');
    if (rows.length === 0) { body.innerHTML = '<p>היומן ריק - אין עדיין אי-התאמות רשומות.</p>'; return; }

    // קיבוץ לפי נושא+חודש+שנה - הטבלה הראשונה, לזיהוי מגמה במבט אחד
    const groups = {};
    for (const r of rows) {
        const key = r.year + '-' + r.month + '|' + r.topic;
        if (!groups[key]) groups[key] = { year: r.year, month: r.month, topic: r.topic, count: 0, employees: new Set() };
        groups[key].count++;
        groups[key].employees.add(r.employeeName);
    }
    const groupRows = Object.values(groups).sort((a, b) => b.count - a.count);

    let html = '<h3 style="font-size:14px;color:#16233B;margin:0 0 8px;">סיכום לפי נושא וחודש (ממוין לפי שכיחות - מגמה חשודה למעלה)</h3>' +
        '<table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:20px;">' +
        '<tr style="background:#E3ECF8;"><th style="padding:4px 8px;">נושא</th><th style="padding:4px 8px;">חודש</th><th style="padding:4px 8px;">מספר מקרים</th><th style="padding:4px 8px;">עובדים שונים</th></tr>';
    for (const g of groupRows) {
        const suspicious = g.count >= 3 && g.employees.size >= 2; // חוזר הרבה, אצל כמה עובדים - חשד לבאג, לא טעות נקודתית
        html += `<tr style="border-bottom:1px solid #DCE3EC;${suspicious ? 'background:#FDF2F2;' : ''}">` +
            `<td style="padding:4px 8px;text-align:center;${suspicious ? 'font-weight:700;color:#B3261E;' : ''}">${g.topic}${suspicious ? ' ⚠️' : ''}</td>` +
            `<td style="padding:4px 8px;text-align:center;">${pad2(g.month)}/${g.year}</td>` +
            `<td style="padding:4px 8px;text-align:center;">${g.count}</td>` +
            `<td style="padding:4px 8px;text-align:center;">${g.employees.size}</td></tr>`;
    }
    html += '</table>';

    html += '<h3 style="font-size:14px;color:#16233B;margin:0 0 8px;">כל השורות (לפירוט)</h3>' +
        '<table style="width:100%;border-collapse:collapse;font-size:11.5px;">' +
        '<tr style="background:#E3ECF8;"><th style="padding:3px 6px;">נושא</th><th style="padding:3px 6px;">עובד</th><th style="padding:3px 6px;">תאריך</th><th style="padding:3px 6px;">פירוט</th></tr>';
    for (const r of rows) {
        html += `<tr style="border-bottom:1px solid #DCE3EC;"><td style="padding:3px 6px;text-align:center;">${window.escapeHtml(r.topic)}</td>` +
            `<td style="padding:3px 6px;text-align:center;">${window.escapeHtml(r.employeeName)}</td>` +
            `<td style="padding:3px 6px;text-align:center;">${pad2(r.day)}/${pad2(r.month)}/${r.year}</td>` +
            `<td style="padding:3px 6px;text-align:center;">COT=${r.cotVal !== null ? r.cotVal.toFixed(2) : '-'}, דוח=${r.pdfVal !== null ? r.pdfVal.toFixed(2) : '-'}</td></tr>`;
    }
    html += '</table>';
    document.getElementById('payrollAuditLogBody').innerHTML = html;
}

// תוצר 1: דוח שגיאות רשמי למחלקת שכר - PDF נקי, בלי מושגי תכנות, מוכן להדפסה.
window.downloadPayrollErrorReportPDF = async function() {
    const report = window.__lastPayrollAuditReport || [];
    if (report.length === 0) return;
    if (typeof window.jsPDF === 'undefined' || typeof window.html2canvas === 'undefined') {
        return customAlert("ספריית ה-PDF עדיין לא נטענה. ודא שיש חיבור לאינטרנט ונסה שוב.");
    }
    const ym = getSelectedMonthYear();
    const empName = (document.getElementById('employeeName')?.value || '').trim() || 'ללא שם';

    // בלוק אחד לכל יום (לא שורה לכל עמודה שגויה בנפרד) - כולל מיני-טבלה עם כל חלוקת השעות של
    // אותו יום (לא רק מה שגוי), כדי שמחלקת השכר תראה את ההקשר המלא, לא פער מבודד בלי הסבר למה
    // הוא קשור לשאר היום. עמודה שגויה מסומנת ברקע אדום בתוך המיני-טבלה.
    const blocksHtml = report.map((r) => {
        const mismatchedCols = new Set(r.mismatches.map((m) => m.col));
        const miniCells = (r.allColumns.length ? r.allColumns : r.mismatches.map((m) => ({ col: m.col, val: m.cotVal })))
            .map((c) => {
                const isWrong = mismatchedCols.has(c.col);
                return '<td style="padding:4px 7px;text-align:center;border:1px solid #DCE3EC;' + (isWrong ? 'background:#FDF2F2;color:#B3261E;font-weight:700;' : '') + '">' +
                    (AUDIT_COLUMN_LABELS[c.col] || c.col) + '=' + c.val.toFixed(2) + '</td>';
            }).join('');
        const explanationsHtml = r.mismatches.map((m) =>
            '<li>' + (AUDIT_COLUMN_LABELS[m.col] || m.col) + ': בדוח נרשם ' + (m.pdfVal !== null ? m.pdfVal.toFixed(2) : 'לא דווח') +
            ', נדרש ' + (m.cotVal !== null ? m.cotVal.toFixed(2) : '-') + '. ' + explanationFor(m.col, r.shiftType) + '</li>'
        ).join('');
        return '<div style="border:1px solid #DCE3EC;border-radius:8px;padding:12px 14px;margin-bottom:14px;page-break-inside:avoid;">' +
            '<div style="font-weight:700;margin-bottom:6px;">יום ' + pad2(r.day) + '/' + pad2(ym.m) + (r.shiftType ? ' (קוד: ' + r.shiftType + ')' : '') +
            ' - כניסה: ' + r.cotStart + ' | יציאה: ' + r.cotEnd + '</div>' +
            '<table style="border-collapse:collapse;font-size:11.5px;margin-bottom:8px;"><tr>' + miniCells + '</tr></table>' +
            '<ul style="margin:0;padding-right:18px;font-size:12px;color:#253246;">' + explanationsHtml + '</ul>' +
            '</div>';
    }).join('');

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:-9999px;right:-9999px;background:#fff;color:#16233B;padding:24px;width:900px;direction:rtl;font-family:Heebo,Arial,sans-serif;';
    container.innerHTML =
        '<h1 style="font-size:17px;margin:0 0 4px;">דוח אי-התאמות בחישוב שעות - לבדיקת מחלקת השכר</h1>' +
        '<p style="font-size:12.5px;color:#64748B;margin:0 0 18px;">עובד: ' + window.escapeHtml(empName) + ' | תקופה: ' + pad2(ym.m) + '/' + ym.y + ' | הופק: ' + new Date().toLocaleDateString('he-IL') + '</p>' +
        blocksHtml +
        '<p style="font-size:11px;color:#94A3B8;margin-top:10px;">דוח זה הופק אוטומטית לצורך בדיקה. יש לאמת את הפרטים מול ההסכם הקיבוצי וחוקי העבודה הרלוונטיים לפני ביצוע כל תיקון.</p>';
    document.body.appendChild(container);

    try {
        const canvas = await window.html2canvas(container, { scale: 2, backgroundColor: '#ffffff', width: container.scrollWidth, windowWidth: container.scrollWidth });
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const pageW = 595, pageH = 842, margin = 24; // A4 portrait - הבלוקים נערמים אנכית, לא עוד טבלה רחבה
        const ratio = Math.min((pageW - margin * 2) / canvas.width, (pageH - margin * 2) / canvas.height);
        const imgW = canvas.width * ratio, imgH = canvas.height * ratio;
        const doc = new window.jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        doc.addImage(imgData, 'JPEG', (pageW - imgW) / 2, margin, imgW, imgH);
        const HEBREW_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
        doc.save('ממצאי בדיקת דוח פיצול לחודש ' + HEBREW_MONTHS[ym.m - 1] + ' עבור עובד ' + empName + '.pdf');
    } catch (err) {
        console.error("Error report PDF failed:", err);
        customAlert("שגיאה ביצירת קובץ הדוח.");
    } finally {
        document.body.removeChild(container);
    }
};

// תוצר 2: הודעה טכנית למנהל המערכת (QA) - טקסט להעתקה, לא PDF.
// בונה רק את הטקסט (לא מציגה כלום) - מוטמעת ישירות בתוך חלון התוצאות (renderPayrollAudit),
// לא עוד כפתור/חלון נפרד. "נשלחה" במשמעות שהיא מוכנה ומוצגת בפני מנהל המערכת כשהוא פותח את
// המערכת - ל-COT אין יכולת שליחת אימייל/הודעה אמיתית, אז אין טענה שזה נשלח לאנשהו בפועל.
window.buildPayrollAdminMessageText = function(report) {
    const ym = getSelectedMonthYear();
    const lines = [];
    lines.push('בדיקת דו"ח פיצול - ' + pad2(ym.m) + '/' + ym.y + ' - נמצאו ' + report.length + ' ימים עם פערים בין COT לדוח השכר.');
    lines.push('');
    for (const r of report) {
        lines.push('יום ' + r.day + ' (כניסה: ' + r.cotStart + ', יציאה: ' + r.cotEnd + '):');
        for (const m of r.mismatches) {
            lines.push('  עמודה ' + (AUDIT_COLUMN_LABELS[m.col] || m.col) + ': COT חישב ' +
                (m.cotVal !== null ? m.cotVal.toFixed(2) : 'חסר') + ', בדוח נרשם ' + (m.pdfVal !== null ? m.pdfVal.toFixed(2) : 'חסר') + '.');
        }
    }
    lines.push('');
    lines.push('בקשה: יש לבדוק האם מדובר בטעות אנוש של חשב השכר, או שקיים מקרה-קצה שחושף באג בלוגיקת החישוב של COT (calculator.js) שדורש תיקון קוד.');
    return lines.join('\n');
};
