/* COT System Version: V202611061559 */
// קובץ: 06-excel-export.js
// ייצוא הגליון לקובץ Excel - חדש או הוספה לקובץ קיים.

function fillExcelSheetHelper(worksheet, ym) {
    worksheet.columns = [ { key:'dateNum',width:6 }, { key:'dayStr',width:6 }, { key:'shift',width:10 }, { key:'in',width:10 }, { key:'out',width:10 }, { key:'desc',width:20 }, { key:'totalHours',width:10 }, { key:'shabHours',width:10 }, { key:'I',width:8 }, { key:'I2',width:8 }, { key:'J',width:8 }, { key:'K',width:8 }, { key:'L',width:8 }, { key:'M',width:8 }, { key:'N',width:8 }, { key:'O',width:8 }, { key:'P',width:8 }, { key:'Q',width:8 }, { key:'R',width:8 }, { key:'S',width:8 }, { key:'T',width:8 }, { key:'U',width:8 }, { key:'V',width:8 }, { key:'W',width:8 }, { key:'cost',width:12 } ];
    worksheet.addRow(['תאריך','','משמרת','כניסה','יציאה','תאור','סה"כ\nשעות','חופש\nשבת','תקן','רגילות','ש"נ','','','שבת','','ש"נ','','','','ת.מ.','','','','','ערך']);
    worksheet.addRow(['','','','','','','','','','','100%','125%','150%','175%','200%','180%','187.5%','225%','250%','20%','50%','75%','87.5%','100%','']);
    worksheet.mergeCells('A1:B2'); worksheet.mergeCells('C1:C2'); worksheet.mergeCells('D1:D2'); worksheet.mergeCells('E1:E2'); worksheet.mergeCells('F1:F2'); worksheet.mergeCells('G1:G2'); worksheet.mergeCells('H1:H2'); worksheet.mergeCells('I1:I2'); worksheet.mergeCells('J1:J2'); worksheet.mergeCells('K1:M1'); worksheet.mergeCells('N1:O1'); worksheet.mergeCells('P1:S1'); worksheet.mergeCells('T1:X1'); worksheet.mergeCells('Y1:Y2');
    worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) { if(rowNumber<=2){ row.height=25; row.eachCell({includeEmpty:true}, function(cell){ cell.font={name:'Arial',bold:true,color:{argb:'FFFFFFFF'},size:11}; cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0D47A1'}}; cell.alignment={vertical:'middle',horizontal:'center',wrapText:true}; cell.border={top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'}}; }); } });
    for (var r = 1; r <= 31; r++) {
        var tr = document.querySelector('#tbody tr:nth-child(' + r + ')'); if (!tr) continue;
        var dateStr = pad2(r), dayNum = new Date(ym.y, ym.m - 1, r).getDay();
        var shiftVal = tr.querySelector('.shift-type-input')?.value || '';
        var inVal = tr.querySelectorAll('.time-input')[0]?.value || '';
        var outVal = tr.querySelectorAll('.time-input')[1]?.value || '';
        var descVal = document.getElementById('val-desc-' + r)?.innerText || '';
        if (!shiftVal && !inVal && !outVal && !descVal) continue; 
        
        var getVal = (id) => { let cell = document.getElementById(id); let val = cell ? parseFloat(cell.getAttribute('data-val') || 0) : 0; return val === 0 ? '' : val; };
        var costCell = document.getElementById('val-cost-' + r);
        var costVal = costCell ? parseFloat(costCell.getAttribute('data-cost') || 0) : 0;
        var addedRow = worksheet.addRow([ dateStr, daysHebrew[dayNum], shiftVal, inVal, outVal, descVal, getVal('val-total-hours-' + r), getVal('val-shabbat-hours-' + r), getVal('val-I-' + r), getVal('val-I2-' + r), getVal('val-J-' + r), getVal('val-K-' + r), getVal('val-L-' + r), getVal('val-M-' + r), getVal('val-N-' + r), getVal('val-O-' + r), getVal('val-P-' + r), getVal('val-Q-' + r), getVal('val-R-' + r), getVal('val-S-' + r), getVal('val-T-' + r), getVal('val-U-' + r), getVal('val-V-' + r), getVal('val-W-' + r), costVal === 0 ? '' : costVal ]);
        
        var rowColor = Math.floor((r - 1) / 7) % 2 === 0 ? 'FFE8F5E9' : 'FFFFF3E0'; if (dayNum === 6) rowColor = 'FFBBDEFB'; 
        var isAbs = window.ABSENCE_CODES.includes(shiftVal);

        addedRow.eachCell({ includeEmpty: true }, function(cell, colN) {
            var isRed = (colN === 8 && cell.value === -1);
            var isHighlight = ((colN === 7 || colN === 9) && isAbs && cell.value === 8);
            
            cell.font = { name:'Arial', size:11, color: isRed ? {argb:'FFE74C3C'} : (isHighlight ? {argb:'FF8E44AD'} : undefined), bold:(colN===25&&cell.value!=='') || isHighlight || isRed }; 
            cell.alignment = { vertical:'middle', horizontal: isRed ? 'left' : 'center' }; 
            cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:rowColor} }; 
            cell.border = { top:{style:'thin',color:{argb:'FFCCCCCC'}}, left:{style:'thin',color:{argb:'FFCCCCCC'}}, bottom:{style:'thin',color:{argb:'FFCCCCCC'}}, right:{style:'thin',color:{argb:'FFCCCCCC'}} };
        });
    }
}

window.exportToNewExcel = async function() {
    let exMod = document.getElementById('excelExportModal');
    if(exMod) exMod.style.display = 'none';
    if (typeof ExcelJS === 'undefined') return customAlert("ספריית האקסל עדיין לא נטענה.");
    
    var ym = getSelectedMonthYear(), workbook = new ExcelJS.Workbook();
    let sel = document.getElementById('monthYearSelect');
    let sheetName = sel ? sel.options[sel.selectedIndex].text : "Sheet1";
    fillExcelSheetHelper(workbook.addWorksheet(sheetName, { views: [{ rightToLeft: true }] }), ym);
    
    try {
        let empNameEl = document.getElementById('employeeName');
        let empName = empNameEl ? empNameEl.value.trim() : 'ללא_שם';
        saveAs(new Blob([await workbook.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "COT_משמרות_" + empName.replace(/\s+/g, '_') + "_" + ym.y + "-" + pad2(ym.m) + ".xlsx");
        customAlert("קובץ האקסל החדש נוצר והורד למחשב שלך בהצלחה! 📗");
    } catch(err) { customAlert("שגיאה ביצירת קובץ האקסל."); }
};

window.processExcelExport = async function(event) {
    var file = event.target.files[0]; if (!file) return;
    if (typeof ExcelJS === 'undefined') return customAlert("ספריית האקסל עדיין לא נטענה.");
    
    let sel = document.getElementById('monthYearSelect');
    var defaultSheetName = sel ? sel.options[sel.selectedIndex].text : "Sheet1";
    
    let targetSheetName = await customPrompt("איך תרצה לקרוא לגיליון החדש בקובץ?"); 
    if (targetSheetName === null) { event.target.value = ''; return; }
    if (targetSheetName.trim() === '') targetSheetName = defaultSheetName;
    
    var reader = new FileReader();
    reader.onload = async function(e) {
        try {
            var workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(e.target.result);
            if (workbook.getWorksheet(targetSheetName)) workbook.removeWorksheet(workbook.getWorksheet(targetSheetName).id);
            fillExcelSheetHelper(workbook.addWorksheet(targetSheetName, { views: [{ rightToLeft: true }] }), getSelectedMonthYear());
            saveAs(new Blob([await workbook.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), file.name.replace(".xlsx", "") + "_מעודכן.xlsx");
            customAlert("הגיליון נוסף בהצלחה לקובץ הקיים! 📗<br>הורדנו למחשב שלך קובץ מעודכן."); event.target.value = ''; 
        } catch(err) { customAlert("שגיאה בעיבוד קובץ האקסל. ודא שזהו קובץ תקין ולא פתוח בתוכנה אחרת."); event.target.value = ''; }
    };
    reader.readAsArrayBuffer(file);
};

// ====================================================================
// מנגנון ניהול גרסאות אוטומטי (Auto Version Manager)
// ====================================================================
