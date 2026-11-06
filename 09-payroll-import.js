/* COT System Version: V202611061559 */
// קובץ: 09-payroll-import.js
// ייבוא דוח פיצול (PDF) ממחלקת השכר, לעדכון שעות הכניסה/יציאה בטבלת COT - חוסך הקלדה חוזרת.
//
// הדוח האמיתי של מחלקת השכר (לא הדוגמה הראשונית שנבדקה לפני כן) מופק כטקסט עברי תקין לגמרי -
// אין כאן את בעיית הגופן ההפוכה שהייתה בקובץ הראשון. הבעיה היחידה כאן היא כיווניות (RTL): כלי
// החילוץ (גם ב-pdfplumber בפייתון וגם ב-PDF.js בדפדפן) מוציאים כל שורה "הפוכה מבחינה חזותית" -
// סדר המילים בשורה הפוך (האחרונה בעברית=הראשונה בקובץ), ומילים עבריות עצמן הפוכות אות-אות.
// מספרים/שעות לא נפגעים (הם תמיד LTR גם בטקסט עברי). התיקון: הופכים את סדר המילים בשורה, ולכל
// מילה שאינה מספר/שעה - הופכים גם את סדר האותיות בתוכה. אומת ידנית מול דוח אמיתי לפני המימוש הזה.

function isNumericToken(t) { return /^[\d:./%,-]+$/.test(t); }

function fixRtlLineTokens(tokens) {
    return tokens.slice().reverse().map((t) => (isNumericToken(t) ? t : t.split('').reverse().join('')));
}

// מקבצת textContent.items (עם המרת Y ל"יורד מלמעלה") לשורות טקסט, ואז מתקנת כל שורה ל-RTL נכון.
function itemsToFixedLines(items, pageHeight) {
    const words = items
        .filter((it) => it.str && it.str.trim() !== '')
        .map((it) => ({ text: it.str, x: it.transform[4], yTop: pageHeight - it.transform[5] }));
    const tops = [...new Set(words.map((w) => Math.round(w.yTop)))].sort((a, b) => a - b);
    const lineTops = [];
    for (const t of tops) { if (lineTops.length === 0 || t - lineTops[lineTops.length - 1] > 3) lineTops.push(t); }
    const lines = [];
    for (const lt of lineTops) {
        const lineWords = words.filter((w) => Math.abs(w.yTop - lt) <= 3).sort((a, b) => a.x - b.x);
        lines.push(fixRtlLineTokens(lineWords.map((w) => w.text)));
    }
    return lines;
}

// שורת יום: "02 ד 07:58 19:00 נוכחות 11.03 8.00 8.00 2.00 1.03 1.97" (אחרי תיקון RTL) - היום
// תמיד הטוקן הראשון, ואחריו אות יום בשבוע; שעות (אם יש) מיד אחרי; שאר המספרים הם ערכי העמודות
// לפי הסדר (עמודות שערכן 0 מודלגות בדוח המקורי - לכן אורך המערך משתנה בין שורה לשורה).
function parseDayLine(tokens) {
    const dayMatch = tokens[0] && tokens[0].match(/^(\d{1,2})$/);
    if (!dayMatch) return null;
    const day = parseInt(dayMatch[1], 10);
    const times = tokens.filter((t) => /^\d{1,2}:\d{2}$/.test(t));
    const numbers = tokens.filter((t) => /^-?\d+\.\d+$/.test(t)).map(Number);
    return { day: day, start: times[0] || '', end: times[1] || '', rawNumbers: numbers };
}

// מחלצת "לתקופה: 2026 / 09" מכותרת הדוח. מחזירה {year, month} או null אם לא נמצא.
function extractReportPeriod(lines) {
    const joined = lines.map((l) => l.join(' ')).join(' ');
    const m = joined.match(/לתקופה:\s*(\d{4})\s*\/\s*(\d{1,2})/);
    if (!m) return null;
    return { year: parseInt(m[1], 10), month: parseInt(m[2], 10) };
}

// מחלצת את השורה "סה"כ שעות לפני הקיזוז: 212.95 ..." - משמשת לבדיקת שלמות (ראו verifyExtractionTotal).
function extractReportTotalHours(lines) {
    for (const tokens of lines) {
        const joined = tokens.join(' ');
        if (joined.includes('לפני הקיזוז')) {
            const firstNum = tokens.find((t) => /^-?\d+\.\d+$/.test(t));
            if (firstNum) return parseFloat(firstNum);
        }
    }
    return null;
}

window.extractPayrollPdf = async function(file) {
    if (typeof window.pdfjsLib === 'undefined') throw new Error('ספריית PDF.js עדיין לא נטענה. ודא שיש חיבור לאינטרנט ונסה שוב.');
    const buf = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
    const allDays = [];
    let period = null, reportTotal = null;
    for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 1 });
        const textContent = await page.getTextContent();
        const lines = itemsToFixedLines(textContent.items, viewport.height);
        if (!period) period = extractReportPeriod(lines);
        if (reportTotal === null) reportTotal = extractReportTotalHours(lines);
        for (const tokens of lines) {
            const parsed = parseDayLine(tokens);
            if (parsed) allDays.push(parsed);
        }
    }
    return { days: allDays, period: period, reportTotal: reportTotal };
};

// משווה את חודש/שנת הדוח (אם זוהה) מול החודש הפתוח כרגע ב-COT. לא חוסם - רק מחזירה אזהרה שהקורא
// (importPayrollForComparison) מציג למשתמש, כדי שיוכל לעצור אם זה לא נכון.
window.checkPayrollPeriodMatch = function(period) {
    if (!period) return { checked: false, match: null, message: 'לא זוהה חודש/שנה בדוח - אין אפשרות לבדוק התאמה אוטומטית.' };
    const ym = getSelectedMonthYear();
    const match = period.year === ym.y && period.month === ym.m;
    return {
        checked: true, match: match,
        message: match
            ? `הדוח שייך ל-${period.month}/${period.year} - תואם לחודש הפתוח ב-COT.`
            : `שים לב: הדוח שייך ל-${period.month}/${period.year}, אבל ב-COT פתוח כרגע ${ym.m}/${ym.y}. ייתכן שזה לא החודש הנכון!`,
    };
};

// בדיקת שלמות: סוכמת את "סה"כ שעות" שחולץ מכל יום (העמודה הראשונה אחרי התיאור) ומשווה מול השורה
// "סה"כ שעות לפני הקיזוז" שבתחתית הדוח - תופסת טעויות חילוץ (שורה שנשמטה וכו') לפני שהן מגיעות
// לשום מקום אחר. לא משווה עמודה-עמודה (ראו detectPayrollDiscrepancies לכך), רק את הסכום הכולל.
window.verifyExtractionTotal = function(days, reportTotal) {
    if (reportTotal === null) return { checked: false, match: null, extractedSum: null, reportTotal: null };
    const extractedSum = days.reduce((sum, d) => sum + (d.rawNumbers[0] || 0), 0);
    const match = Math.abs(extractedSum - reportTotal) < 0.05;
    return { checked: true, match: match, extractedSum: extractedSum, reportTotal: reportTotal };
};

window.importPayrollForComparison = async function(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = ''; // מאפשר לבחור את אותו קובץ שוב בפעם הבאה
    if (!file) return;
    try {
        const extraction = await window.extractPayrollPdf(file);
        const days = extraction.days;
        if (days.length === 0) {
            return customAlert("לא זוהו שורות נתונים בקובץ. ייתכן שזה לא דוח פיצול בפורמט המוכר.");
        }

        const periodCheck = window.checkPayrollPeriodMatch(extraction.period);
        const totalCheck = window.verifyExtractionTotal(days, extraction.reportTotal);

        let msg = "הדוח נסרק בהצלחה, נא לעבור על השעות ולוודא שלא נפלה טעות סריקה, לאחר הסיום יש ללחוץ עדכן שעות";
        if (periodCheck.checked && !periodCheck.match) msg += "\n\n⚠️ " + periodCheck.message;
        if (totalCheck.checked && !totalCheck.match) msg += `\n\n⚠️ בדיקת שלמות: סה"כ שעות שחולץ (${totalCheck.extractedSum.toFixed(2)}) לא תואם לסה"כ שבדוח (${totalCheck.reportTotal.toFixed(2)}) - ייתכן ששורה לא זוהתה נכון.`;
        customAlert(msg);

        window.__lastPayrollExtractedDays = days; // נשמר לשימוש "בדוק דו"ח פיצול" בלי סריקה חוזרת
        const results = window.comparePayrollToTable(days);
        renderPayrollComparison(results, null);
    } catch (err) {
        console.error("Payroll import failed:", err);
        customAlert("שגיאה בקריאת הדוח: " + err.message);
    }
};

// כותבת שעת כניסה/יציאה ישירות לתא המתאים בטבלת COT ומפעילה חישוב מחדש - אותה פעולה בדיוק כמו
// הקלדה ידנית של המשתמש בתא הזה, רק אוטומטית. לא נוגעת בימים בלי שעות (אין מה לעדכן מהם).
// מפיקה PDF "בקשת עדכון לדו"ח פיצול" - מסמך שאפשר להעביר למחלקת השכר, עם תאריך/משמרת/כניסה/
// יציאה/תאור בלבד מתוך הטבלה הראשית (לא כל 25 העמודות - זה לא דוח חישוב, זה טופס בקשה). אותה
// שיטת html2canvas+jsPDF שכבר קיימת ב-08-pdf-export.js (jsPDF לבדו לא יודע לצייר עברית).
window.generatePayrollUpdateRequest = async function() {
    if (typeof window.jsPDF === 'undefined' || typeof window.html2canvas === 'undefined') {
        return customAlert("ספריית ה-PDF עדיין לא נטענה. ודא שיש חיבור לאינטרנט ונסה שוב.");
    }
    var tc = document.getElementById('tableContainer');
    if (!tc || tc.style.display === 'none') return customAlert("אין גליון פתוח לייצוא.");

    var ym = getSelectedMonthYear();
    var empName = (document.getElementById('employeeName')?.value || '').trim() || 'ללא שם';

    // "מהדוח המקורי של השכר" = מה שחולץ בסריקה האחרונה בסשן הזה (window.__lastPayrollCompareResults,
    // שכבר נשמר שם ממילא לטובת כפתור "עדכן שעות"). אם לא נסרק אף דוח בסשן הזה - אין עם מה להשוות,
    // ואז פשוט לא מסמנים "שונה" לאף שורה (בלי שגיאה - זה מצב לגיטימי, לא חובה לסרוק לפני בקשה).
    var lastScan = {};
    (window.__lastPayrollCompareResults || []).forEach(function(r) { lastScan[r.day] = r; });

    var rows = [];
    for (var r = 1; r <= 31; r++) {
        var tr = document.querySelector('#tbody tr:nth-child(' + r + ')'); if (!tr) continue;
        var shift = tr.querySelector('.shift-type-input')?.value || '';
        var times = tr.querySelectorAll('.time-input');
        var start = times[0]?.value || '', end = times[1]?.value || '';
        var descEl = document.getElementById('val-desc-' + r);
        var desc = descEl ? descEl.innerText.trim() : '';
        if (!shift && !start && !end && !desc) continue; // יום ריק לגמרי - לא נכלל בבקשה
        var isAbsence = !start && !end;
        var scanned = lastScan[r];
        var isChanged = !!(scanned && (start || end) && (scanned.pdfStart !== start || scanned.pdfEnd !== end));
        rows.push({ day: r, shift: shift, start: start, end: end, desc: desc, isAbsence: isAbsence, isChanged: isChanged });
    }
    if (rows.length === 0) return customAlert("אין נתונים בגליון הנוכחי להפקת בקשה.");

    var container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:-9999px;right:-9999px;background:#fff;padding:16px;width:460px;direction:rtl;font-family:Heebo,Arial,sans-serif;color:#16233B;';
    var rowsHtml = rows.map(function(d) {
        var bg = d.isChanged ? '#F3E8DA' : (d.isAbsence ? '#F3E8FF' : '');
        return '<tr style="border-bottom:1px solid #DCE3EC;' + (bg ? 'background:' + bg + ';' : '') + '">' +
            '<td style="padding:2px 6px;text-align:center;">' + pad2(d.day) + '/' + pad2(ym.m) + '</td>' +
            '<td style="padding:2px 6px;text-align:center;">' + (d.shift || '-') + '</td>' +
            '<td style="padding:2px 6px;text-align:center;">' + (d.start || '-') + '</td>' +
            '<td style="padding:2px 6px;text-align:center;">' + (d.end || '-') + '</td>' +
            '<td style="padding:2px 6px;text-align:right;">' + (d.desc || '-') + '</td></tr>';
    }).join('');
    var legend = '<div style="font-size:9.5px;color:#64748B;margin-bottom:8px;display:flex;gap:14px;">' +
        '<span><span style="display:inline-block;width:10px;height:10px;background:#F3E8DA;border-radius:2px;vertical-align:middle;"></span> שונה מהדוח שנסרק</span>' +
        '<span><span style="display:inline-block;width:10px;height:10px;background:#F3E8FF;border-radius:2px;vertical-align:middle;"></span> היעדרות</span></div>';
    container.innerHTML =
        '<h2 style="font-size:13.5px;margin:0 0 8px;text-align:center;">בקשת עדכון לדו"ח פיצול לחודש ' + pad2(ym.m) + '/' + ym.y + ' עבור עובד ' + window.escapeHtml(empName) + '</h2>' +
        legend +
        '<table style="width:100%;border-collapse:collapse;font-size:10.5px;">' +
        '<tr style="background:#E3ECF8;"><th style="padding:3px 6px;">תאריך</th><th style="padding:3px 6px;">משמרת</th><th style="padding:3px 6px;">כניסה</th><th style="padding:3px 6px;">יציאה</th><th style="padding:3px 6px;">תאור</th></tr>' +
        rowsHtml + '</table>';
    document.body.appendChild(container);

    try {
        var canvas = await window.html2canvas(container, { scale: 2, backgroundColor: '#ffffff' });
        var imgData = canvas.toDataURL('image/jpeg', 0.95);
        var pageW = 595.28, pageH = 841.89; // A4 portrait, pt
        var margin = 24;
        var usableW = pageW - margin * 2, usableH = pageH - margin * 2;
        var ratio = Math.min(usableW / canvas.width, usableH / canvas.height);
        var imgW = canvas.width * ratio, imgH = canvas.height * ratio;
        var doc = new window.jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        doc.addImage(imgData, 'JPEG', (pageW - imgW) / 2, margin, imgW, imgH);
        doc.save('בקשת_עדכון_פיצול_' + empName.replace(/\s+/g, '_') + '_' + ym.y + '-' + pad2(ym.m) + '.pdf');
    } catch (err) {
        console.error("Payroll update-request PDF failed:", err);
        customAlert("שגיאה ביצירת קובץ הבקשה.");
    } finally {
        document.body.removeChild(container);
    }
};

window.applyPayrollTime = function(day, start, end) {
    if (!start || !end) return;
    const tr = document.querySelector('#tbody tr:nth-child(' + day + ')');
    if (!tr) return;
    const inputs = tr.querySelectorAll('.time-input');
    if (inputs.length < 2) return;
    inputs[0].value = start; inputs[1].value = end;
    calculateRow(inputs[0]);
};

// כפתור "עדכן שעות" היחיד: קוראת את הערכים שבתיבות העריכה כרגע (מה שחולץ מהדוח, או מה שהמשתמש
// תיקן ידנית לפני הלחיצה - שתי האפשרויות נתמכות באותו אופן) ומעדכנת את כל הימים שיש להם שעות.
window.applyAllPayrollTimes = async function(results) {
    const toApply = [];
    for (const r of results) {
        const startEl = document.getElementById('payroll-start-' + r.day);
        const endEl = document.getElementById('payroll-end-' + r.day);
        const start = startEl ? startEl.value.trim() : '';
        const end = endEl ? endEl.value.trim() : '';
        if (start && end) toApply.push({ day: r.day, start, end });
    }
    if (toApply.length === 0) return customAlert("אין שעות לעדכן.");
    const proceed = await customConfirm(`לעדכן ${toApply.length} ימים לפי השעות שבטבלה למעלה? ודא שעברת עליהן ואין טעות סריקה.`);
    if (!proceed) return;
    for (const d of toApply) window.applyPayrollTime(d.day, d.start, d.end);
    document.getElementById('payrollCompareModal').style.display = 'none';
    // זה הטריגר: אחרי שהעובד בדק ועדכן שעות, הכפתור היחיד הופך מ"יבא" ל"בדוק" - לא לפני.
    if (window.transformImportButtonToAudit) window.transformImportButtonToAudit();
    else customAlert(`עודכנו ${toApply.length} ימים. בדוק את הטבלה ושמור כשתהיה מרוצה.`);
};

window.comparePayrollToTable = function(extractedDays) {
    const results = [];
    for (const d of extractedDays) {
        const tr = document.querySelector('#tbody tr:nth-child(' + d.day + ')');
        if (!tr) continue;
        const cotStart = tr.querySelectorAll('.time-input')[0]?.value || '';
        const cotEnd = tr.querySelectorAll('.time-input')[1]?.value || '';
        const timesMatch = (!d.start && !d.end) || (cotStart === d.start && cotEnd === d.end);
        results.push({ day: d.day, cotStart: cotStart, cotEnd: cotEnd, pdfStart: d.start, pdfEnd: d.end, timesMatch: timesMatch });
    }
    return results;
};

// מנגנון בדיקת סתירות (כל עמודות השעות, לא רק סה"כ) - מוצג אך ורק למשתמש המנהל (אותו ADMIN_EMAIL
// שכבר קיים ב-07-version-manager.js; מוגדר כאן שוב כי כל קובץ <script> נפרד מקבל scope משלו
// ל-const). לא מוצג/לא רץ לאף משתמש אחר בכלל - זו בדיקת דיוק נוסחאות אישית, לא תכונה כללית.
const PAYROLL_ANALYSIS_ADMIN_EMAIL = "bassam@bsbc.co.il";

function isPayrollAnalysisAdmin() {
    var user = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;
    return !!(user && user.email && user.email.toLowerCase() === PAYROLL_ANALYSIS_ADMIN_EMAIL.toLowerCase());
}
window.isPayrollAnalysisAdmin = isPayrollAnalysisAdmin; // חשוף דרך window - 10-payroll-audit.js צריך את אותה בדיקה, וכל קובץ script מקבל scope נפרד

// סדר עמודות השעות הקבוע של COT (בלי העלות - נבדקת בנפרד/לא בכלל, כי תלויה בתעריף שהוזן ולא
// בהכרח משקפת באג בנוסחה). הדוח מדלג על עמודות שערכן 0 - לכן ההשוואה מיישרת רצפים: לוקחים את
// העמודות שה-COT עצמו מחשב כלא-אפס לפי הסדר הקבוע, ומצמידים אותן לרצף המספרים (גם הוא ללא
// אפסים) שחולץ מהדוח. אומת ידנית מול יום אמיתי בדוח.
// חשוף דרך window (לא const רגיל) כי 10-payroll-audit.js צריך להשתמש באותו סדר עמודות, וכל
// קובץ <script> נפרד מקבל scope משלו ל-const - לא ניתן לשתף אותו ישירות בין קבצים בלעדי זה.
window.HOUR_COLUMNS_ORDER = ['total-hours', 'shabbat-hours', 'I', 'I2', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'];
const HOUR_COLUMNS_ORDER = window.HOUR_COLUMNS_ORDER;

window.detectPayrollDiscrepancies = function(extractedDays) {
    const discrepancies = [];
    for (const d of extractedDays) {
        if (!d.rawNumbers || d.rawNumbers.length === 0) continue; // יום היעדרות - אין עמודות שעות להשוות

        const cotNonZero = [];
        for (const col of HOUR_COLUMNS_ORDER) {
            const el = document.getElementById('val-' + col + '-' + d.day);
            if (!el) continue;
            const v = parseFloat(el.getAttribute('data-val') || 0);
            if (Math.abs(v) >= 0.005) cotNonZero.push({ col: col, val: v });
        }

        const mismatches = [];
        const len = Math.max(cotNonZero.length, d.rawNumbers.length);
        for (let i = 0; i < len; i++) {
            const cotEntry = cotNonZero[i];
            const pdfVal = d.rawNumbers[i];
            if (cotEntry === undefined && pdfVal === undefined) continue;
            const diff = (cotEntry !== undefined && pdfVal !== undefined) ? Math.abs(cotEntry.val - pdfVal) : Infinity;
            if (diff >= 0.01) {
                mismatches.push({ col: cotEntry ? cotEntry.col : '?', cotVal: cotEntry ? cotEntry.val : null, pdfVal: pdfVal !== undefined ? pdfVal : null });
            }
        }
        if (mismatches.length > 0) discrepancies.push({ day: d.day, mismatches: mismatches });
    }
    return discrepancies;
};

function renderPayrollComparison(results, discrepancies) {
    window.__lastPayrollCompareResults = results; // נקרא ע"י כפתור "עדכן שעות" בלי להטביע JSON בתוך ה-HTML
    const body = document.getElementById('payrollCompareBody');
    if (!body) return;
    const mismatches = results.filter((r) => !r.timesMatch);

    let analysisHtml = '';
    if (discrepancies !== null && discrepancies !== undefined) {
        analysisHtml = '<div style="background:#F3E8DA;border-right:4px solid #B06F1F;border-radius:8px;padding:10px 14px;margin-bottom:14px;">' +
            '<div style="font-weight:800;color:#7a4e10;font-size:13px;margin-bottom:4px;">ניתוח סתירות (מוצג רק עבורך)</div>';
        if (discrepancies.length === 0) {
            analysisHtml += '<div style="font-size:12.5px;color:#7a4e10;">אין סתירות בין עמודות השעות המחושבות ל-COT לבין מה שרשום בדוח, בימים שנסרקו (העלות לא נבדקת - תלויה בתעריף שהוזן).</div>';
        } else {
            analysisHtml += `<div style="font-size:12.5px;color:#7a4e10;margin-bottom:6px;">${discrepancies.length} ימים עם עמודת שעות שונה בין COT לדוח, על אותן שעות כניסה/יציאה - ייתכן פער בנוסחה:</div>` +
                '<ul style="margin:0;padding-right:18px;font-size:12px;color:#7a4e10;">' +
                discrepancies.map((d) => '<li>יום ' + d.day + ': ' + d.mismatches.map((m) =>
                    (m.col) + ' - COT=' + (m.cotVal !== null ? m.cotVal.toFixed(2) : 'חסר') + ', דוח=' + (m.pdfVal !== null ? m.pdfVal.toFixed(2) : 'חסר')
                ).join(' | ') + '</li>').join('') +
                '</ul>';
        }
        analysisHtml += '</div>';
    }

    // 4 עמודות נפרדות (כניסה/יציאה × COT/דוח) עם כותרת-קבוצה דו-שורתית, בדיוק אותו דפוס
    // שהטבלה הראשית של COT כבר משתמשת בו (למשל "ש"נ"/"שבת" מעל תתי-עמודות). זה מחליף לגמרי את
    // ניסיון ה"מחרוזת הפוכה" הקודם - עמודות טבלה נפרדות כבר מסתדרות נכון ב-RTL מאליהן, בלי שום
    // טריק כיווניות; זו בדיוק הסיבה שבקשת העדכון ו"הורד PDF" (ששניהם כבר משתמשים בעמודות נפרדות)
    // מעולם לא סבלו מהבעיה הזו בכלל.
    let html = '<table style="width:100%;border-collapse:collapse;font-size:12.5px;">' +
        '<tr style="background:#E3ECF8;">' +
        '<th rowspan="2" style="padding:3px 6px;text-align:right;border:1px solid #DCE3EC;">יום</th>' +
        '<th colspan="2" style="padding:3px 6px;border:1px solid #DCE3EC;">COT</th>' +
        '<th colspan="2" style="padding:3px 6px;border:1px solid #DCE3EC;">דוח (ניתן לתקן)</th>' +
        '</tr>' +
        '<tr style="background:#E3ECF8;">' +
        '<th style="padding:3px 6px;border:1px solid #DCE3EC;">כניסה</th><th style="padding:3px 6px;border:1px solid #DCE3EC;">יציאה</th>' +
        '<th style="padding:3px 6px;border:1px solid #DCE3EC;">כניסה</th><th style="padding:3px 6px;border:1px solid #DCE3EC;">יציאה</th>' +
        '</tr>';
    for (const r of results) {
        const rowColor = r.timesMatch ? '' : 'background:#FDF2F2;';
        const inputStyle = 'width:52px;text-align:center;border:1px solid #DCE3EC;border-radius:5px;padding:2px;font-size:11.5px;';
        const startInput = (r.pdfStart || r.pdfEnd) ? `<input type="text" id="payroll-start-${r.day}" value="${r.pdfStart}" style="${inputStyle}">` : '<span style="color:#94A3B8;">-</span>';
        const endInput = (r.pdfStart || r.pdfEnd) ? `<input type="text" id="payroll-end-${r.day}" value="${r.pdfEnd}" style="${inputStyle}">` : '<span style="color:#94A3B8;">-</span>';
        html += `<tr style="${rowColor}border-bottom:1px solid #DCE3EC;">` +
            `<td style="padding:2px 6px;text-align:center;font-weight:700;border:1px solid #DCE3EC;">${r.day}</td>` +
            `<td style="padding:2px 6px;text-align:center;border:1px solid #DCE3EC;">${r.cotStart}</td>` +
            `<td style="padding:2px 6px;text-align:center;border:1px solid #DCE3EC;">${r.cotEnd}</td>` +
            `<td style="padding:2px 6px;text-align:center;border:1px solid #DCE3EC;">${startInput}</td>` +
            `<td style="padding:2px 6px;text-align:center;border:1px solid #DCE3EC;">${endInput}</td></tr>`;
    }
    html += '</table>';
    const summary = mismatches.length === 0
        ? '<p style="color:#15803D;font-weight:700;margin-bottom:10px;">כל הימים שנבדקו תואמים! ✅</p>'
        : `<p style="color:#B3261E;font-weight:700;margin-bottom:6px;">${mismatches.length} ימים עם שעות שונות מה-COT - מסומנים באדום. אפשר לתקן את השעות בטבלה לפני העדכון.</p>`;
    const applyBtn = `<button onclick="applyAllPayrollTimes(window.__lastPayrollCompareResults)" style="background:#7C3AED;color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13.5px;font-weight:700;cursor:pointer;margin-bottom:12px;">עדכן שעות</button>`;
    body.innerHTML = analysisHtml + summary + applyBtn + html;
    document.getElementById('payrollCompareModal').style.display = 'block';
}
