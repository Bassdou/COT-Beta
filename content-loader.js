/* COT System Version: V202611061559 */
// קובץ: content-loader.js
// טוען את תוכן חלונות ה"מידע" מהקבצים החיצוניים שב-content/ ומזריק אותם לתוך המכלים שב-components.js.
// כך אפשר לעדכן את תוכן ההדרכה בלי לגעת בקוד ובלי להעלות גרסה חדשה.
// יש להריץ את האפליקציה דרך שרת (GitHub Pages, או שרת מקומי) ולא ע"י פתיחת index.html ישירות מהדיסק (file://),
// אחרת הדפדפן יחסום את הבקשה מטעמי אבטחה - בדיוק כמו טעינת version.json הקיימת.

async function loadContentInto(url, containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    try {
        var res = await fetch(url + '?t=' + new Date().getTime());
        if (!res.ok) throw new Error('HTTP ' + res.status);
        el.innerHTML = await res.text();
    } catch (err) {
        console.error('טעינת תוכן נכשלה (' + url + '):', err);
        el.innerHTML = '<p style="color:#c0392b;">שגיאה בטעינת התוכן. ודא שהאפליקציה רצה משרת (לא מקובץ מקומי), ושקובץ ' + url + ' קיים.</p>';
    }
}

// "עדכוני מערכת": כל <article> הוא הודעה, עם data-date/data-expires/data-pinned (ראו content/system-updates.he.html).
// הודעות שפג תוקפן (data-expires עבר) לא מוצגות; הודעות מוצמדות (data-pinned) מופיעות ראשונות,
// ובתוך כל קבוצה (מוצמד/רגיל) המיון הוא לפי תאריך יורד.
async function loadSystemUpdates(url, containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    try {
        var res = await fetch(url + '?t=' + new Date().getTime());
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var tmp = document.createElement('div');
        tmp.innerHTML = await res.text();
        var today = new Date().toISOString().slice(0, 10);
        var items = Array.from(tmp.querySelectorAll('article')).filter(function(a) {
            var exp = a.getAttribute('data-expires');
            return !exp || exp >= today;
        });
        items.sort(function(a, b) {
            var pa = a.getAttribute('data-pinned') === 'true', pb = b.getAttribute('data-pinned') === 'true';
            if (pa !== pb) return pa ? -1 : 1;
            return (b.getAttribute('data-date') || '').localeCompare(a.getAttribute('data-date') || '');
        });
        el.innerHTML = '';
        if (items.length === 0) el.innerHTML = '<p style="color:rgba(255,255,255,0.6); font-size:13px;">אין עדכונים חדשים כרגע.</p>';
        items.forEach(function(a) { el.appendChild(a); });
    } catch (err) {
        console.error('טעינת עדכוני מערכת נכשלה (' + url + '):', err);
        el.innerHTML = '<p style="color:#FCA5A5; font-size:13px;">שגיאה בטעינת העדכונים. ודא שהאפליקציה רצה משרת (לא מקובץ מקומי).</p>';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadContentInto('content/shift-info.he.html', 'shiftInfoContent');
    loadContentInto('content/mini-shift-info.he.html', 'miniShiftInfoContent');
    loadSystemUpdates('content/system-updates.he.html', 'updatesContainer');
});
