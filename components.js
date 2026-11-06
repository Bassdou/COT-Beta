/* COT System Version: V202611061559 */
// קובץ: components.js
// חלונות קופצים קבועים (shell). התוכן הטקסטואלי של "מדריך למשתמש" ו"קודי משמרות" עבר לקבצי content/*.he.html,
// שנטענים אוטומטית ע"י content-loader.js - כדי שעדכון טקסט לא ידרוש נגיעה בקובץ הזה או בגרסת האפליקציה.

const cotStaticComponents = `
<!-- מסך תחזוקה מתפרץ (נשלט מהענן) -->
<div id="maintenanceOverlay" class="full-screen-overlay maintenance-overlay" style="display:none; z-index: 99999;">
    <div style="background:#fff; padding:40px; border-radius:16px; box-shadow:0 10px 40px rgba(0,0,0,0.2); text-align:center; max-width:400px; width: 100%;">
        <div class="maintenance-icon" aria-hidden="true">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2a1 1 0 011 1v1.09a7.94 7.94 0 012.12.88l.77-.77a1 1 0 011.41 0l1.41 1.41a1 1 0 010 1.41l-.77.77c.4.65.7 1.37.88 2.12H20a1 1 0 011 1v2a1 1 0 01-1 1h-1.09a7.94 7.94 0 01-.88 2.12l.77.77a1 1 0 010 1.41l-1.41 1.41a1 1 0 01-1.41 0l-.77-.77a7.94 7.94 0 01-2.12.88V21a1 1 0 01-1 1h-2a1 1 0 01-1-1v-1.09a7.94 7.94 0 01-2.12-.88l-.77.77a1 1 0 01-1.41 0l-1.41-1.41a1 1 0 010-1.41l.77-.77A7.94 7.94 0 014.09 14H3a1 1 0 01-1-1v-2a1 1 0 011-1h1.09c.18-.75.48-1.47.88-2.12l-.77-.77a1 1 0 010-1.41l1.41-1.41a1 1 0 011.41 0l.77.77A7.94 7.94 0 0111 4.09V3a1 1 0 011-1z"/><circle cx="12" cy="12" r="3.25"/></svg>
        </div>
        <h2 style="color:#B06F1F; margin-top:0; font-size:22px; font-weight:bold; line-height:1.4;">אנחנו משדרגים לך את המערכת</h2>
        <p style="color:#253246; font-size:18px; font-weight:bold; margin-top:15px; margin-bottom:0;">נחזור לפעילות בקרוב</p>
    </div>
</div>

<!-- חלונית קופצת לעדכון גרסה (Toast) -->
<div id="updateToast" style="display:none; position: fixed; bottom: 20px; right: 20px; background: #16233B; color: white; padding: 16px 20px; border-radius: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); z-index: 30000; align-items: center; gap: 15px; font-family: 'Heebo', sans-serif; direction: rtl; animation: slideInUp 0.4s ease;">
    <div class="update-toast-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B06F1F" stroke-width="2"><path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6"/></svg>
    </div>
    <div>
        <strong style="display:block; font-size: 15px; margin-bottom: 3px;">גרסה חדשה זמינה</strong>
        <span style="font-size: 13px; opacity: .85;">רענון יחיל את העדכונים האחרונים.</span>
    </div>
    <button onclick="applyUpdate()" style="background: #1D4E89; color: white; border: none; padding: 9px 16px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; box-shadow: 0 2px 8px rgba(29,78,137,0.4); transition: 0.2s;">רענן עכשיו</button>
</div>
<style>
@keyframes slideInUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.update-toast-icon { width: 34px; height: 34px; border-radius: 9px; background: #F3E8DA; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
#updateToast button:hover { background: #163C6C; transform: translateY(-1px); }
</style>

<!-- חלון מידע כללי והוראות הפעלה -->
<div id="shiftInfoModal" class="modal" role="dialog" aria-modal="true" style="z-index: 20000;">
    <div class="modal-content" style="max-width: 800px; padding: 30px;">
        <span class="close-btn" role="button" tabindex="0" aria-label="סגור" onkeydown="if(event.key==='Enter'||event.key===' '){this.click();}" onclick="closeShiftInfo()">&times;</span>
        <div class="modal-header">
            <h2 style="font-size: 22px; color: #16233B; font-weight: 800; display: flex; align-items: center; gap: 10px;">
                <span style="width: 32px; height: 32px; border-radius: 9px; background: #E3ECF8; color: #1D4E89; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/></svg></span>
                מדריך למשתמש
            </h2>
        </div>
        <div id="shiftInfoContent" style="max-height: 65vh; overflow-y: auto; padding-left: 15px; font-size: 14.5px; line-height: 1.6; color: #34495e;">טוען...</div>
    </div>
</div>

<!-- חלון קודי משמרות -->
<div id="miniShiftInfoModal" class="modal" role="dialog" aria-modal="true" style="z-index: 20000;">
    <div class="modal-content" style="max-width: 420px; padding: 18px;">
        <span class="close-btn" role="button" tabindex="0" aria-label="סגור" onkeydown="if(event.key==='Enter'||event.key===' '){this.click();}" onclick="closeMiniShiftInfo()">&times;</span>
        <div class="modal-header"><h2 style="font-size: 17px; margin: 0; color: #16233B; font-weight: 800; display: flex; align-items: center; gap: 8px;"><span style="width: 26px; height: 26px; border-radius: 7px; background: #E3ECF8; color: #1D4E89; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/></svg></span>קודי משמרות להקלדה מהירה</h2></div>
        <div id="miniShiftInfoContent" style="max-height: 55vh; overflow-y: auto;">טוען...</div>
    </div>
</div>

<!-- חלון הזנת משמרות נגררות -->
<div id="firstMonthCarryModal" class="modal" role="dialog" aria-modal="true" style="z-index: 25000;">
    <div class="modal-content" style="max-width: 400px; text-align: center; padding: 30px;">
        <h3 style="color: #d35400; margin-top: 0; font-size: 20px;">הזנת משמרות מסוף חודש שעבר</h3>
        <p style="font-size: 14px; color: #34495e; line-height: 1.6; margin-bottom: 16px;">
            למעקב התקרות השבועיות (5 בסה"כ, מתוכן עד 4 נוכחות), אנא הקלד את מה שנקלט בשבוע האחרון
            (החלקי) בדו"ח של החודש הקודם
            <br><span id="carryMaxInfo" style="font-weight:bold; color:#e74c3c;"></span>
        </p>
        <div style="display:flex; gap:16px; justify-content:center; margin-bottom:8px;">
            <div>
                <label for="manualCarryInput" style="display:block; font-size:12.5px; color:#64748B; margin-bottom:4px;">סה"כ משמרות (נוכחות+היעדרות)</label>
                <input type="number" id="manualCarryInput" value="0" min="0" max="6" oninput="syncCarryPresenceMax()" onkeydown="if(event.key==='Enter'){event.preventDefault();saveFirstMonthCarry();}" style="width: 80px; padding: 10px; font-size: 20px; font-weight: bold; text-align: center; border: 2px solid #e3f2fd; border-radius: 8px; outline: none;">
            </div>
            <div>
                <label for="manualCarryPresenceInput" style="display:block; font-size:12.5px; color:#64748B; margin-bottom:4px;">מתוכן - נוכחות בלבד</label>
                <input type="number" id="manualCarryPresenceInput" value="0" min="0" max="6" onkeydown="if(event.key==='Enter'){event.preventDefault();saveFirstMonthCarry();}" style="width: 80px; padding: 10px; font-size: 20px; font-weight: bold; text-align: center; border: 2px solid #e3f2fd; border-radius: 8px; outline: none;">
            </div>
        </div>
        <p id="carryPresenceWarning" style="display:none; color:#B3261E; font-size:12.5px; font-weight:700; margin:0 0 14px;">מספר הנוכחות לא יכול להיות גדול מהסה"כ</p>
        <br>
        <button class="btn-3d" onclick="saveFirstMonthCarry()" style="background-color: #d35400; color: white; padding: 12px 25px; border-radius: 8px; font-size: 16px; box-shadow: 0 4px #a04000;">שמור והתחל לעבוד</button>
    </div>
</div>

<!-- חלון בחירת סוג ייצוא לאקסל -->
<div id="excelExportModal" class="modal" role="dialog" aria-modal="true" style="z-index: 25000;">
    <div class="modal-content" style="max-width: 380px; text-align: center; padding: 30px;">
        <span class="close-btn" role="button" tabindex="0" aria-label="סגור" onkeydown="if(event.key==='Enter'||event.key===' '){this.click();}" onclick="document.getElementById('excelExportModal').style.display='none'">&times;</span>
        <h3 style="color: #0d47a1; margin-top: 0; font-size: 22px;">ייצוא נתונים לאקסל</h3>
        <p style="font-size: 15px; color: #34495e; margin-bottom: 25px;">בחר כיצד תרצה לייצא את גיליון החודש הנוכחי:</p>
        
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <button class="btn-3d" onclick="exportToNewExcel()" style="background-color: #27ae60; color: white; padding: 14px; border-radius: 8px; font-size: 16px; box-shadow: 0 4px #1e8449;">📄 צור קובץ אקסל חדש</button>
            <button class="btn-3d" onclick="document.getElementById('excelExportModal').style.display='none'; document.getElementById('excelFileLoader').click();" style="background-color: #f39c12; color: white; padding: 14px; border-radius: 8px; font-size: 16px; box-shadow: 0 4px #d68910;">📚 הוסף לקובץ אקסל קיים</button>
        </div>
    </div>
</div>

<!-- חלון קופץ מותאם אישית של COT -->
<div id="customDialogModal" class="modal" role="dialog" aria-modal="true" style="z-index: 25000;">
    <div class="modal-content" style="max-width: 400px; text-align: center; padding: 28px 25px;">
        <div id="customDialogIcon" class="dialog-icon" aria-hidden="true"></div>
        <div class="modal-header" style="border-bottom: none; margin-bottom: 10px; padding-bottom: 0;">
            <h2 id="customDialogTitle" style="font-size: 19px; color: #16233B; margin: 0; font-weight: 800;">לתשומת לבך</h2>
        </div>
        <p id="customDialogMessage" style="font-size: 15px; color: #253246; line-height: 1.6; margin-bottom: 20px; font-weight: 600;"></p>

        <input type="text" id="customDialogInput" style="display:none; width: 80%; padding: 10px; font-size: 16px; margin: 0 auto 20px auto; border: 1.5px solid #DCE3EC; border-radius: 8px; text-align: center; outline: none;">

        <div style="display: flex; justify-content: center; gap: 12px;">
            <button id="customDialogOkBtn" class="btn-3d" style="background-color: #1D4E89; color: white; padding: 11px 26px; border-radius: 10px; font-size: 15px; font-weight: 700; min-width: 90px; box-shadow: 0 3px 10px rgba(29,78,137,0.3); border: none;">אישור</button>
            <button id="customDialogCancelBtn" class="btn-3d" style="background-color: #fff; color: #B3261E; border: 1.5px solid #F2D4D4; padding: 11px 26px; border-radius: 10px; font-size: 15px; font-weight: 700; min-width: 90px; display: none;">ביטול</button>
        </div>
    </div>
</div>

<!-- פוטר משפטי (Footer) -->
<div class="legal-footer hide-print" style="position: fixed; bottom: 0; left: 0; width: 100%; text-align: center; padding: 10px 0; font-size: 12px; color: #546e7a; background-color: rgba(238, 245, 249, 0.95); z-index: 9999; border-top: 1px solid #bbdefb; box-shadow: 0 -2px 5px rgba(0,0,0,0.05);">
    <span style="font-weight: bold;">&copy; 2026 COT by B Systems. כל הזכויות שמורות.</span> | 
    <a href="terms.pdf" target="_blank" style="color: #1976d2; text-decoration: none; margin: 0 5px;">תקנון ותנאי שימוש</a> | 
    <a href="privacy.pdf" target="_blank" style="color: #1976d2; text-decoration: none; margin: 0 5px;">מדיניות פרטיות</a> | 
    <a href="accessibility.pdf" target="_blank" style="color: #1976d2; text-decoration: none; margin: 0 5px;">הצהרת נגישות</a>
</div>
`;

// הזרקת כל החלונות לתוך העמוד רגע לפני סגירת ה-BODY
document.body.insertAdjacentHTML('beforeend', cotStaticComponents);
