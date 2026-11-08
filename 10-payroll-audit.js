/* COT System Version: V202611041915 */
// קובץ: 10-payroll-audit.js
// "בדיקת דו"ח פיצול" - בקרה מקיפה על דוח הפיצול של מחלקת השכר, בנפרד לגמרי מ"יבא דו"ח פיצול"
// (שמטרתו רק לחסוך הקלדה). כאן המטרה הפוכה: COT משמש כ"חשב שכר מומחה" ומצביע על פערים.
//
// עיצוב (אחרי כמה סבבים): החלון/הקובץ נראה כמו **הדוח עצמו** - כל ימי החודש, לא רק הימים הבעייתיים.
// כל תא שגוי מוצג בשני ערכים: הערך הנכון (COT) למעלה, והערך השגוי מהדוח מתחתיו עם קו חוצה - בדיוק
// כמו תיקון מבחן. זה גלוי לכולם (לא רק למנהל מערכת) - התוצאה היא בדיוק מה שהעובד צריך כדי להבין
// ולתקן, לא רק "נרשם לבדיקה" סתמי.
//
// העקרון החישובי: לא בונים מחדש את חוקי התקשי"ר - calculator.js כבר מיישם ומאמת אותם. מריצים את
// מנוע החישוב האמיתי של COT על השעות שכבר בטבלה (אחרי שהעובד תיקן, אם היה צריך), ומשווים כל
// עמודה מול מה שהדוח מציג.

// נושא בדיקה: קטגוריה עסקית משמעותית לכל עמודה (לשימוש ביומן המצטבר/מנהל בלבד - ראו למטה).
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

function getDayShiftType(day) {
    const tr = document.querySelector('#tbody tr:nth-child(' + day + ')');
    return tr ? (tr.querySelector('.shift-type-input')?.value || '') : '';
}
function getDayDescription(day) {
    const el = document.getElementById('val-desc-' + day);
    return el ? el.innerText.trim() : '';
}
function getCotColVal(col, day) {
    const el = document.getElementById('val-' + col + '-' + day);
    return el ? parseFloat(el.getAttribute('data-val') || 0) : 0;
}

// מריצה בדיקה מקיפה: מחזירה *כל* הימים שחולצו (לא רק את הבעייתיים - הדוח צריך להיראות כמו הדוח
// האמיתי, כולל הימים התקינים), עם כל עמודות השעות וממפה-פערים לכל יום.
// חשוב: לעולם לא כותבת/משנה שעות בטבלה. "יבא דו"ח פיצול" (ייבוא+תיקון ע"י העובד) הוא תמיד פעולה
// מקדימה; הבדיקה כאן רק קוראת את חישוב COT מהשעות שכבר בטבלה (אחרי תיקון העובד, אם היה) מול הדוח.
window.auditPayrollReport = function(extractedDays) {
    const allDays = [];
    for (const d of extractedDays) {
        const tr = document.querySelector('#tbody tr:nth-child(' + d.day + ')');
        if (!tr) continue;
        const times = tr.querySelectorAll('.time-input');
        const cotStart = times[0]?.value || '', cotEnd = times[1]?.value || '';

        const mismatchesByCol = {};
        let hasMismatch = false;
        if (d.rawNumbers && d.rawNumbers.length > 0) {
            const result = window.detectPayrollDiscrepancies([d]);
            if (result.length > 0) {
                for (const m of result[0].mismatches) { mismatchesByCol[m.col] = m; hasMismatch = true; }
            }
        }
        allDays.push({
            day: d.day, cotStart: cotStart, cotEnd: cotEnd,
            desc: getDayDescription(d.day), shiftType: getDayShiftType(d.day),
            mismatchesByCol: mismatchesByCol, hasMismatch: hasMismatch,
        });
    }
    return allDays;
};

// רושמת כל אי-התאמה כשורה נפרדת ביומן מתמשך - נגיש למנהל המערכת בלבד (ראו openPayrollAuditLogViewer),
// כדי לזהות מגמה (הרבה שורות תחת אותו נושא, באותו חודש, אצל עובדים שונים => כנראה באג בקוד).
window.logPayrollDiscrepancies = async function(allDays) {
    var user = firebase.auth().currentUser;
    if (!user || typeof db === 'undefined') return;
    var ym = getSelectedMonthYear();
    var empName = (document.getElementById('employeeName')?.value || '').trim() || 'ללא שם';
    var writes = [];
    for (var r of allDays) {
        for (var col in r.mismatchesByCol) {
            var m = r.mismatchesByCol[col];
            writes.push(db.collection('payrollAuditLog').add({
                topic: topicFor(col), column: col, employeeName: empName, uid: user.uid,
                year: ym.y, month: ym.m, day: r.day, shiftType: r.shiftType || '',
                cotVal: m.cotVal, pdfVal: m.pdfVal,
                timestamp: new Date().toISOString(),
            }).catch(function(e) { console.error('payrollAuditLog write failed:', e); }));
        }
    }
    try { await Promise.all(writes); } catch (e) { /* כשלון בודד כבר נתפס למעלה, לא עוצר את השאר */ }
};

// כפתור אחד בלבד: "יבא דו"ח פיצול" ← (אחרי "עדכן שעות") → "בדוק דו"ח פיצול".
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
    const allDays = window.auditPayrollReport(days);
    const mismatchDays = allDays.filter((r) => r.hasMismatch);
    if (mismatchDays.length > 0) await window.logPayrollDiscrepancies(allDays); // תמיד נרשם ליומן
    renderPayrollAudit(allDays);
};

// בונה את טבלת "הדוח עצמו" - משותפת לחלון שבתוך האפליקציה ולקובץ ה-PDF, כדי ששניהם ייראו אותו
// דבר בדיוק. תא תקין מציג ערך אחד; תא שגוי מציג את הערך הנכון (COT) למעלה, ירוק ומודגש, ואת הערך
// השגוי מהדוח מתחתיו עם קו חוצה - בדיוק כמו תיקון מבחן, מובן לכל אחד בלי שום הסבר טכני נדרש.
function renderValueCell(col, day, mismatchesByCol) {
    const cotVal = getCotColVal(col, day);
    const m = mismatchesByCol[col];
    if (!m) {
        return cotVal >= 0.005 || cotVal <= -0.005 ? cotVal.toFixed(2) : '';
    }
    const wrongDisplay = m.pdfVal !== null ? m.pdfVal.toFixed(2) : '(לא דווח)';
    return '<div style="color:#15803D;font-weight:800;">' + m.cotVal.toFixed(2) + '</div>' +
        '<div style="text-decoration:line-through;color:#B3261E;font-size:10px;">' + wrongDisplay + '</div>';
}

function buildReportStyleTableHtml(allDays, cellPadding) {
    const pad = cellPadding || '3px 6px';
    const cols = window.HOUR_COLUMNS_ORDER || [];
    let html = '<table style="width:100%;border-collapse:collapse;font-size:11px;">' +
        '<tr style="background:#E3ECF8;font-weight:700;">' +
        '<th style="padding:' + pad + ';border:1px solid #DCE3EC;">יום</th>' +
        '<th style="padding:' + pad + ';border:1px solid #DCE3EC;">כניסה</th>' +
        '<th style="padding:' + pad + ';border:1px solid #DCE3EC;">יציאה</th>' +
        '<th style="padding:' + pad + ';border:1px solid #DCE3EC;">תאור</th>' +
        cols.map((c) => '<th style="padding:' + pad + ';border:1px solid #DCE3EC;">' + (AUDIT_COLUMN_LABELS[c] || c) + '</th>').join('') +
        '</tr>';
    for (const r of allDays) {
        const rowBg = r.hasMismatch ? 'background:#FFFBF2;' : '';
        html += '<tr style="' + rowBg + '">' +
            '<td style="padding:' + pad + ';border:1px solid #DCE3EC;text-align:center;font-weight:700;">' + pad2(r.day) + '</td>' +
            '<td style="padding:' + pad + ';border:1px solid #DCE3EC;text-align:center;">' + (r.cotStart || '') + '</td>' +
            '<td style="padding:' + pad + ';border:1px solid #DCE3EC;text-align:center;">' + (r.cotEnd || '') + '</td>' +
            '<td style="padding:' + pad + ';border:1px solid #DCE3EC;text-align:center;">' + window.escapeHtml(r.desc || '') + '</td>' +
            cols.map((c) => '<td style="padding:' + pad + ';border:1px solid #DCE3EC;text-align:center;">' + renderValueCell(c, r.day, r.mismatchesByCol) + '</td>').join('') +
            '</tr>';
    }
    html += '</table>';
    return html;
}

// תוצאה גלויה לכולם - אין יותר הבדל בין עובד למנהל מערכת בתצוגה הזו (רק ביומן המצטבר, ראו למטה).
function renderPayrollAudit(allDays) {
    window.__lastPayrollAuditReport = allDays;
    const body = document.getElementById('payrollAuditBody');
    if (!body) return;
    const mismatchCount = allDays.filter((r) => r.hasMismatch).length;
    const summary = mismatchCount === 0
        ? '<p style="color:#15803D;font-weight:700;margin-bottom:10px;">✅ ' + allDays.length + ' ימים נבדקו, הכל תואם לדוח.</p>'
        : '<p style="color:#B3261E;font-weight:700;margin-bottom:10px;">⚠️ ' + mismatchCount + ' מתוך ' + allDays.length + ' ימים עם אי-התאמה - מסומנים למטה (ערך נכון למעלה, ערך שגוי בדוח עם קו חוצה).</p>';
    const printBtn = mismatchCount > 0
        ? '<button onclick="downloadPayrollErrorReportPDF()" style="background:#0E7490;color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13.5px;font-weight:700;cursor:pointer;margin-bottom:12px;">הדפס את הדוח המתוקן</button>'
        : '';
    body.innerHTML = summary + printBtn + buildReportStyleTableHtml(allDays);
    document.getElementById('payrollAuditModal').style.display = 'block';
}

// יומן אי-התאמות מצטבר - מנהל-בלבד, נפרד לגמרי מהתצוגה הרגילה שכולם רואים. הנקודה המרכזית:
// קיבוץ לפי נושא+חודש, לזיהוי "הרבה שורות תחת אותו נושא, אצל עובדים שונים" => כנראה באג בקוד.
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
        const suspicious = g.count >= 3 && g.employees.size >= 2;
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

// קובץ ה-PDF - אותה טבלת "דוח מתוקן" בדיוק (buildReportStyleTableHtml), לא עוד מבנה נפרד. זה מה
// שהופך את זה לממש "הדוח עצמו עם הסימונים", לא מסמך טכני נבדל.
window.downloadPayrollErrorReportPDF = async function() {
    const allDays = window.__lastPayrollAuditReport || [];
    if (allDays.length === 0) return;
    if (typeof window.jsPDF === 'undefined' || typeof window.html2canvas === 'undefined') {
        return customAlert("ספריית ה-PDF עדיין לא נטענה. ודא שיש חיבור לאינטרנט ונסה שוב.");
    }
    const ym = getSelectedMonthYear();
    const empName = (document.getElementById('employeeName')?.value || '').trim() || 'ללא שם';

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:-9999px;right:-9999px;background:#fff;color:#16233B;padding:20px;width:1500px;direction:rtl;font-family:Heebo,Arial,sans-serif;';
    container.innerHTML =
        '<h1 style="font-size:16px;margin:0 0 4px;">דוח פיצול מתוקן - ערך נכון למעלה, ערך שגוי בדוח המקורי מתחתיו עם קו חוצה</h1>' +
        '<p style="font-size:11.5px;color:#64748B;margin:0 0 14px;">עובד: ' + window.escapeHtml(empName) + ' | תקופה: ' + pad2(ym.m) + '/' + ym.y + ' | הופק: ' + new Date().toLocaleDateString('he-IL') + '</p>' +
        buildReportStyleTableHtml(allDays, '2px 4px') +
        '<p style="font-size:10px;color:#94A3B8;margin-top:10px;">דוח זה הופק אוטומטית לצורך בדיקה. יש לאמת את הפרטים מול ההסכם הקיבוצי וחוקי העבודה הרלוונטיים לפני ביצוע כל תיקון.</p>';
    document.body.appendChild(container);

    try {
        const canvas = await window.html2canvas(container, { scale: 2, backgroundColor: '#ffffff', width: container.scrollWidth, windowWidth: container.scrollWidth });
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const pageW = 842, pageH = 595, margin = 20; // A4 landscape - טבלה רחבה עם הרבה עמודות
        const ratio = Math.min((pageW - margin * 2) / canvas.width, (pageH - margin * 2) / canvas.height);
        const imgW = canvas.width * ratio, imgH = canvas.height * ratio;
        const doc = new window.jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
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
