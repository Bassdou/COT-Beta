/* COT System Version: V202611061559 */
// קובץ: 02-ui-dialogs.js
// דיאלוגים מותאמים אישית, ניווט מקלדת בטבלה, חלונות מידע, ודגל "הזנות שלא נשמרו".

// אייקוני SVG לפי סוג ההודעה (ולא לפי ניחוש מהטקסט - שומר את זה יציב גם לכל הודעה עתידית)
var DIALOG_ICONS = {
    success: ['#F0FDF4', '#15803D', '<path d="M20 6L9 17l-5-5"/>'],
    error:   ['#FDF2F2', '#B3261E', '<path d="M18 6L6 18M6 6l12 12"/>'],
    confirm: ['#F3E8DA', '#B06F1F', '<path d="M9.1 9a3 3 0 015.8 1c0 2-3 2-3 4"/><path d="M12 17h.01"/>'],
    info:    ['#E3ECF8', '#1D4E89', '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>']
};
function renderDialogIcon(kind) {
    var el = document.getElementById('customDialogIcon');
    if (!el) return;
    var def = DIALOG_ICONS[kind] || DIALOG_ICONS.info;
    el.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="' + def[1] + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + def[2] + '</svg>';
    el.style.background = def[0]; el.style.color = def[1];
}

window.customDialog = function(type, msg, title = null) {
    return new Promise((resolve) => {
        window.isDialogOpen = true; 
        let modal = document.getElementById('customDialogModal');
        let titleEl = document.getElementById('customDialogTitle');
        let msgEl = document.getElementById('customDialogMessage');
        let inputEl = document.getElementById('customDialogInput');
        let okBtn = document.getElementById('customDialogOkBtn');
        let cancelBtn = document.getElementById('customDialogCancelBtn');

        // כותרת אישית: "לתשומת לבך, [שם העובד]" אם יש שם מוזן, אחרת "לתשומת לבך" בלבד
        if (title === null) {
            var empName = document.getElementById('employeeName')?.value?.trim();
            title = empName ? ("לתשומת לבך, " + empName) : "לתשומת לבך";
        }
        titleEl.innerText = title;

        // בחירת אייקון: confirm/prompt -> סימן שאלה; alert -> ירוק אם נראית הודעת הצלחה, אדום אם נראית
        // שגיאה, כחול ניטרלי אחרת. זו רק בחירה ויזואלית - לא משנה את תוכן ההודעה עצמה.
        if (type === 'confirm' || type === 'prompt') renderDialogIcon('confirm');
        else {
            var low = String(msg).replace(/<[^>]*>/g, '');
            if (/(בהצלחה|עודכנ|נשמר|תקין)/.test(low)) renderDialogIcon('success');
            else if (/(שגיאה|נכשל|לא ניתן|חרג)/.test(low)) renderDialogIcon('error');
            else renderDialogIcon('info');
        }

        msgEl.innerHTML = msg;
        inputEl.value = '';
        
        if (type === 'alert') {
            inputEl.style.display = 'none';
            cancelBtn.style.display = 'none';
        } else if (type === 'confirm') {
            inputEl.style.display = 'none';
            cancelBtn.style.display = 'inline-block';
        } else if (type === 'prompt') {
            inputEl.style.display = 'block';
            cancelBtn.style.display = 'inline-block';
        }
        
        modal.style.display = 'block';
        
        let newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        let newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        newOkBtn.onclick = function() {
            modal.style.display = 'none';
            window.isDialogOpen = false; 
            if (type === 'prompt') resolve(inputEl.value);
            else resolve(true);
        };
        newCancelBtn.onclick = function() {
            modal.style.display = 'none';
            window.isDialogOpen = false; 
            if (type === 'prompt') resolve(null);
            else resolve(false);
        };
        
        if(type === 'prompt') {
            inputEl.onkeydown = function(e) { if (e.key === 'Enter') { e.preventDefault(); newOkBtn.click(); } };
            setTimeout(() => inputEl.focus(), 100);
        } else {
            setTimeout(() => newOkBtn.focus(), 100);
        }
    });
};

window.customAlert = (msg) => customDialog('alert', msg);
window.customConfirm = (msg) => customDialog('confirm', msg);
window.customPrompt = (msg) => customDialog('prompt', msg);

// מתג תצוגה פשוטה/מלאה בטבלה: מסתיר/מציג את 14 עמודות האחוזים (מתג קבוע, לא נזכר אוטומטית בין
// כניסות - בכל טעינה חוזרים לברירת המחדל: פשוט בטלפון, מלא בדסקטופ). לא משנה שום חישוב - רק display.
window.toggleTableView = function() {
    var tc = document.getElementById('tableContainer');
    var btn = document.getElementById('viewToggleBtn');
    var label = document.getElementById('viewToggleLabel');
    if (!tc || !btn) return;
    var isSimple = tc.classList.toggle('simple-view');
    btn.setAttribute('aria-pressed', isSimple ? 'true' : 'false');
    if (label) label.innerText = isSimple ? 'תצוגה מלאה' : 'תצוגה פשוטה';
};

window.applyDefaultTableView = function() {
    var tc = document.getElementById('tableContainer');
    var btn = document.getElementById('viewToggleBtn');
    var label = document.getElementById('viewToggleLabel');
    if (!tc || !btn) return;
    var compact = window.innerWidth < 700;
    tc.classList.toggle('simple-view', compact);
    btn.setAttribute('aria-pressed', compact ? 'true' : 'false');
    if (label) label.innerText = compact ? 'תצוגה מלאה' : 'תצוגה פשוטה';
};

window.switchTab = function(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    if (tabName === 'login') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('tab-login').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('tab-register').classList.add('active');
    }
};

window.togglePassword = function(inputId, eyeIcon) {
    var pwd = document.getElementById(inputId);
    if (pwd) {
        if (pwd.type === 'password') { 
            pwd.type = 'text'; 
            eyeIcon.innerText = '🙈'; 
        } else { 
            pwd.type = 'password'; 
            eyeIcon.innerText = '👁️'; 
        }
    }
};

window.toggleLock = function(inputId, btn) {
    let inp = document.getElementById(inputId);
    if (inp.readOnly) { inp.readOnly = false; inp.classList.remove('locked-input'); btn.innerText = '🔓'; inp.focus(); inp.select(); } 
    else { inp.readOnly = true; inp.classList.add('locked-input'); btn.innerText = '🔒'; }
};

window.openMiniShiftInfo = function() { let m = document.getElementById('miniShiftInfoModal'); if(m) m.style.display = "block"; };
window.closeMiniShiftInfo = function() { let m = document.getElementById('miniShiftInfoModal'); if(m) m.style.display = "none"; };
window.openShiftInfo = function() { let m = document.getElementById('shiftInfoModal'); if(m) m.style.display = "block"; };
window.closeShiftInfo = function() { let m = document.getElementById('shiftInfoModal'); if(m) m.style.display = "none"; };

window.onclick = function(event) {
    if (event.target == document.getElementById('shiftInfoModal')) closeShiftInfo();
    if (event.target == document.getElementById('miniShiftInfoModal')) closeMiniShiftInfo();
    if (event.target == document.getElementById('excelExportModal')) document.getElementById('excelExportModal').style.display='none';
};

// אזהרה לפני יציאה/רענון כשיש הזנות שלא נשמרו לקובץ
window.__cotDirty = false;
function markCotDirty(e) {
    var t = e && e.target;
    if (t && t.classList && (t.classList.contains('shift-type-input') || t.classList.contains('time-input'))) window.__cotDirty = true;
}
document.addEventListener('input', markCotDirty);
document.addEventListener('change', markCotDirty);
window.addEventListener('beforeunload', function(e) {
    if (window.__cotDirty) { e.preventDefault(); e.returnValue = ''; return ''; }
});

// Esc סוגר חלונות מידע
document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape' || window.isDialogOpen) return;
    ['shiftInfoModal', 'miniShiftInfoModal', 'excelExportModal'].forEach(function(id) {
        var m = document.getElementById(id);
        if (m && m.style.display === 'block') m.style.display = 'none';
    });
});

document.addEventListener('focusin', function(e) {
    var el = e.target;
    if (el.tagName === 'INPUT' && (el.classList.contains('shift-type-input') || el.classList.contains('time-input'))) {
        el.setAttribute('data-original-val', el.value);
    }
});

document.addEventListener('keydown', function(e) {
    if (window.isDialogOpen) {
        if (e.key === 'Enter') {
            e.preventDefault();
            let okBtn = document.getElementById('customDialogOkBtn');
            if (okBtn) okBtn.click();
        }
        return; 
    }
    
    var el = e.target;
    
    if (e.key === 'Escape' && el.tagName === 'INPUT' && (el.classList.contains('shift-type-input') || el.classList.contains('time-input'))) {
        e.preventDefault();
        if (el.hasAttribute('data-original-val')) {
            el.value = el.getAttribute('data-original-val');
            if (el.classList.contains('time-input')) formatTimeInput(el);
            else handleShiftType(el);
            el.blur();
        }
        return;
    }
    
    if (e.key === 'Enter' && el.classList.contains('bal-input')) {
        e.preventDefault();
        el.blur();
        if (!el.readOnly) {
            var btn = el.nextElementSibling;
            if (btn && btn.classList.contains('lock-btn')) {
                toggleLock(el.id, btn);
            }
        }
        return;
    }

    if (el.tagName === 'INPUT' && (el.classList.contains('shift-type-input') || el.classList.contains('time-input'))) {
        
        if (e.key === 'Enter') {
            e.preventDefault();
            var tr = el.closest('tr');
            if (!tr) return;
            var inputs = Array.from(tr.querySelectorAll('.time-input'));
            
            if (el === inputs[0]) {
                inputs[1].focus(); 
                inputs[1].select();
            } else if (el === inputs[1]) {
                var nextTr = tr.nextElementSibling; 
                if (nextTr) {
                    var nextInput = nextTr.querySelector('.time-input');
                    if(nextInput) { nextInput.focus(); nextInput.select(); }
                }
            } else if (el.classList.contains('shift-type-input')) {
                if(inputs.length > 0) { inputs[0].focus(); inputs[0].select(); }
            }
            return;
        }

        if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            if (el.classList.contains('time-input') && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return; 
            var row = el.closest('tr');
            if (!row) return;
            var inputsInRow = Array.from(row.querySelectorAll('input.shift-type-input, input.time-input'));
            var inputIndex = inputsInRow.indexOf(el);
            var targetInput = null;

            if (e.key === 'ArrowDown') {
                var tTr = row.nextElementSibling;
                if (tTr) targetInput = Array.from(tTr.querySelectorAll('input.shift-type-input, input.time-input'))[inputIndex];
            } else if (e.key === 'ArrowUp') {
                var prevTr = row.previousElementSibling;
                if (prevTr) targetInput = Array.from(prevTr.querySelectorAll('input.shift-type-input, input.time-input'))[inputIndex];
            } else if (e.key === 'ArrowLeft') {
                if (inputIndex < inputsInRow.length - 1) targetInput = inputsInRow[inputIndex + 1]; 
                else {
                    var nTr = row.nextElementSibling;
                    if (nTr) targetInput = Array.from(nTr.querySelectorAll('input.shift-type-input, input.time-input'))[0];
                }
            } else if (e.key === 'ArrowRight') {
                if (inputIndex > 0) targetInput = inputsInRow[inputIndex - 1]; 
                else {
                    var pTr = row.previousElementSibling;
                    if (pTr) {
                        var pInputs = Array.from(pTr.querySelectorAll('input.shift-type-input, input.time-input'));
                        if (pInputs.length > 0) targetInput = pInputs[pInputs.length - 1];
                    }
                }
            }
            if (targetInput) {
                e.preventDefault(); 
                targetInput.focus();
                if(targetInput.type === 'text') targetInput.select();
            }
        }
    }
});

