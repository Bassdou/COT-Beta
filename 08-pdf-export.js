/* COT System Version: V202611061559 */
// קובץ: 08-pdf-export.js
// ייצוא ישיר לקובץ PDF - לא תלוי בדפדפן/מדפסת של המשתמש, בניגוד להדפסה (Ctrl+P).
//
// הגרסה הזו בנויה במבנה הדומה לדוח הפיצול האמיתי של מחלקת השכר (שחור-לבן, שורות צפופות, אותו
// סדר עמודות, כותרת "לתקופה: MM/YYYY" ושורת סיכום בתחתית) - לא עוד צילום מסך של הטבלה הצבעונית
// החיה של COT. זה מחליף את הגרסה הקודמת, לא מתווסף לצידה.
//
// חשוב: jsPDF לבדו לא יודע לצייר טקסט עברי בכלל (הגופנים המובנים שלו - helvetica/times/courier -
// הם לטיניים בלבד, ואין ל-jsPDF תמיכה מובנית בכיווניות RTL). לכן גם כאן, כמו בניסיון המקורי,
// בונים תבנית HTML נפרדת (לא את הטבלה החיה), מצלמים אותה עם html2canvas (הדפדפן מצייר את
// העברית נכון, לא jsPDF), ומטביעים את ה"צילום" כתמונה בתוך קובץ ה-PDF. המחיר המודע: הטקסט בקובץ
// שנוצר אינו ניתן לסימון/חיפוש, כי זו תמונה.

window.exportToPDF = async function() {
    if (typeof window.jsPDF === 'undefined' || typeof window.html2canvas === 'undefined') {
        return customAlert("ספריית ה-PDF עדיין לא נטענה. ודא שיש חיבור לאינטרנט ונסה שוב.");
    }
    var tc = document.getElementById('tableContainer');
    if (!tc || tc.style.display === 'none') return customAlert("אין גליון פתוח לייצוא.");

    var ym = getSelectedMonthYear();
    var empNameEl = document.getElementById('employeeName');
    var empName = empNameEl ? empNameEl.value.trim() : 'ללא שם';

    function getVal(id) {
        var el = document.getElementById(id);
        var v = el ? parseFloat(el.getAttribute('data-val') || 0) : 0;
        return v === 0 ? '' : v.toFixed(2);
    }

    var pctCols = columnsData.map(function(c) { return c.id; }); // I,I2,J,K,L,M,N,O,P,Q,R,S,T,U,V,W - אותו סדר שכבר קיים בחישוב של COT
    var pctLabels = { I: 'תקן', I2: 'רגילות', J: '100%', K: '125%', L: '150%', M: '175%', N: '200%', O: '180%', P: '187.5%', Q: '225%', R: '250%', S: '20%', T: '50%', U: '75%', V: '87.5%', W: '100%' };
    // קווי תיחום מלאים בכל תא (לא רק קו תחתון) - בדיוק כמו עיצוב הטבלה הראשית של COT עצמה.
    var CELL = 'border:1px solid #333;padding:2px 3px;text-align:center;white-space:nowrap;';
    // בלי כפיית כיווניות - אותו תיקון כמו ב-09-payroll-import.js: bidi-override היה כופה סדר
    // שמאל-לימין מוחלט ומייצר בדיוק את ההיפוך שהמשתמש דיווח עליו. הכיווניות הטבעית (RTL) כבר
    // מציגה כניסה מימין ויציאה משמאל נכון, בלי שום override.

    var rowsHtml = '';
    for (var r = 1; r <= 31; r++) {
        var tr = document.querySelector('#tbody tr:nth-child(' + r + ')'); if (!tr) continue;
        var shift = tr.querySelector('.shift-type-input')?.value || '';
        var times = tr.querySelectorAll('.time-input');
        var start = times[0]?.value || '', end = times[1]?.value || '';
        var descEl = document.getElementById('val-desc-' + r);
        var desc = descEl ? descEl.innerText.trim() : '';
        if (!shift && !start && !end && !desc) continue; // יום ריק לגמרי - לא נכלל, כמו בדוח האמיתי
        var dayNum = new Date(ym.y, ym.m - 1, r).getDay();
        rowsHtml += '<tr>' +
            '<td style="' + CELL + '">' + pad2(r) + '</td>' +
            '<td style="' + CELL + '">' + daysHebrew[dayNum] + '</td>' +
            '<td style="' + CELL + '">' + (start || '') + '</td>' +
            '<td style="' + CELL + '">' + (end || '') + '</td>' +
            '<td style="' + CELL + 'white-space:nowrap;">' + desc + '</td>' +
            '<td style="' + CELL + '">' + getVal('val-total-hours-' + r) + '</td>' +
            '<td style="' + CELL + '">' + getVal('val-shabbat-hours-' + r) + '</td>' +
            pctCols.map(function(c) { return '<td style="' + CELL + '">' + getVal('val-' + c + '-' + r) + '</td>'; }).join('') +
            '</tr>';
    }
    if (rowsHtml === '') return customAlert("אין נתונים בגליון הנוכחי לייצוא.");

    var summaryHtml = '<tr style="font-weight:700;">' +
        '<td colspan="5" style="' + CELL + '">סה"כ שעות:</td>' +
        '<td style="' + CELL + '">' + (document.getElementById('sum-hours-totalShift')?.innerText || '') + '</td>' +
        '<td style="' + CELL + '">' + (document.getElementById('sum-hours-shabbat')?.innerText || '') + '</td>' +
        pctCols.map(function(c) { return '<td style="' + CELL + '">' + (document.getElementById('sum-hours-' + c)?.innerText || '') + '</td>'; }).join('') +
        '</tr>' +
        '<tr style="font-weight:700;">' +
        '<td colspan="5" style="' + CELL + '">ערך עמודה:</td>' +
        '<td style="' + CELL + '"></td><td style="' + CELL + '"></td>' +
        pctCols.map(function(c) { return '<td style="' + CELL + '">' + (document.getElementById('sum-cost-' + c)?.innerText || '') + '</td>'; }).join('') +
        '</tr>';

    // רוחב רחב מספיק ל-23 עמודות בלי גלישה/חיתוך (7 עמודות קבועות + 16 עמודות אחוזים).
    var container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:-9999px;right:-9999px;background:#fff;color:#000;padding:16px;width:1600px;direction:rtl;font-family:Arial,Heebo,sans-serif;font-size:10px;';
    container.innerHTML =
        '<div style="display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:8px;font-size:12px;">' +
        '<span>שם עובד: ' + window.escapeHtml(empName) + '</span><span>לתקופה: ' + pad2(ym.m) + ' / ' + ym.y + '</span><span>תאריך הפקה: ' + new Date().toLocaleDateString('he-IL') + '</span></div>' +
        '<table style="width:100%;border-collapse:collapse;">' +
        '<tr style="font-weight:700;">' +
        '<th style="' + CELL + '">יום</th><th style="' + CELL + '"></th><th style="' + CELL + '">כניסה</th><th style="' + CELL + '">יציאה</th>' +
        '<th style="' + CELL + '">תאור</th><th style="' + CELL + '">סך שעות</th><th style="' + CELL + '">י.שבת</th>' +
        pctCols.map(function(c) { return '<th style="' + CELL + '">' + pctLabels[c] + '</th>'; }).join('') +
        '</tr>' + rowsHtml + summaryHtml + '</table>';
    document.body.appendChild(container);

    try {
        // width/windowWidth מפורשים (תואמים לרוחב הקונטיינר בפועל) - בלי זה html2canvas עלול
        // לחתוך עמודות שחורגות מרוחב חלון הדפדפן הרגיל, כי הקונטיינר ממוקם מחוץ למסך (top:-9999px).
        var canvas = await window.html2canvas(container, { scale: 2, backgroundColor: '#ffffff', width: container.scrollWidth, windowWidth: container.scrollWidth });
        var imgData = canvas.toDataURL('image/jpeg', 0.92);

        var pageW = 842, pageH = 595; // A4 landscape, pt (72dpi)
        var margin = 20;
        var usableW = pageW - margin * 2, usableH = pageH - margin * 2;
        var ratio = Math.min(usableW / canvas.width, usableH / canvas.height);
        var imgW = canvas.width * ratio, imgH = canvas.height * ratio;

        var doc = new window.jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        doc.addImage(imgData, 'JPEG', (pageW - imgW) / 2, margin, imgW, imgH);
        doc.save("COT_משמרות_" + empName.replace(/\s+/g, '_') + "_" + ym.y + "-" + pad2(ym.m) + ".pdf");
        customAlert("קובץ ה-PDF נוצר והורד למחשב שלך בהצלחה!");
    } catch (err) {
        console.error("PDF export failed:", err);
        customAlert("שגיאה ביצירת קובץ ה-PDF.");
    } finally {
        document.body.removeChild(container);
    }
};
