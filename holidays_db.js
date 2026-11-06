/* COT System Version: V202611061559 */
// קובץ מסד נתונים: holidays_db.js
// מבוסס על חוזר נציבות שירות המדינה לשנת 2026 (מותאם לעובדי משמרות - תקן 5.5 בערבי חג בשישי)

window.HOLIDAYS_DB = {
    // --- מרץ 2026 ---
    "2026-03-03": { type: "agreed_vacation", hebrew: "פורים (חופשה הסכמית)" },
    "2026-03-04": { type: "choice", hebrew: "שושן פורים (בחירה)" },
    "2026-03-31": { type: "agreed_vacation", hebrew: "לפני פסח (חופשה הסכמית)" },
    
    // --- אפריל 2026 ---
    "2026-04-01": { type: "eve", hebrew: "ערב חג הפסח", standardHours: 4.5 },
    "2026-04-02": { type: "holiday", hebrew: "חג הפסח" },
    "2026-04-03": { type: "cholhamoed", hebrew: "א' חוה\"מ פסח", standardHours: 5.0 }, // חול המועד שישי
    "2026-04-05": { type: "cholhamoed", hebrew: "ג' חוה\"מ פסח", standardHours: 7.0 },
    "2026-04-06": { type: "eve", hebrew: "ערב שביעי של פסח", standardHours: 5.5 },
    "2026-04-07": { type: "holiday", hebrew: "שביעי של פסח" },
    "2026-04-21": { type: "eve", hebrew: "ערב יום העצמאות", standardHours: 5.5 },
    "2026-04-22": { type: "holiday", hebrew: "יום העצמאות" },
    
    // --- מאי 2026 ---
    "2026-05-21": { type: "eve", hebrew: "ערב שבועות", standardHours: 5.5 },
    "2026-05-22": { type: "holiday", hebrew: "חג השבועות" },
    
    // --- יולי - אוגוסט 2026 ---
    "2026-07-30": { type: "agreed_vacation", hebrew: "קיץ (חופשה הסכמית)" },
    "2026-08-23": { type: "agreed_vacation", hebrew: "סוף קיץ (חופשה הסכמית)" },
    
    // --- ספטמבר 2026 ---
    "2026-09-11": { type: "eve", hebrew: "ערב ראש השנה", standardHours: 5.5 }, // עודכן מ-5 ל-5.5 לפי מחלקת שכר
    "2026-09-12": { type: "holiday", hebrew: "ראש השנה א'" },
    "2026-09-13": { type: "holiday", hebrew: "ראש השנה ב'" },
    "2026-09-20": { type: "eve", hebrew: "ערב יום הכיפורים", standardHours: 4.5 },
    "2026-09-21": { type: "holiday", hebrew: "יום הכיפורים" },
    "2026-09-25": { type: "eve", hebrew: "ערב חג סוכות", standardHours: 5.5 }, // עודכן מ-5 ל-5.5 לפי מחלקת שכר
    "2026-09-26": { type: "holiday", hebrew: "חג הסוכות" },
    "2026-09-27": { type: "cholhamoed", hebrew: "א' חוה\"מ סוכות", standardHours: 7.0 },
    "2026-09-28": { type: "cholhamoed", hebrew: "ב' חוה\"מ סוכות", standardHours: 7.0 },
    "2026-09-29": { type: "cholhamoed", hebrew: "ג' חוה\"מ סוכות", standardHours: 7.0 },
    "2026-09-30": { type: "cholhamoed", hebrew: "ד' חוה\"מ סוכות", standardHours: 7.0 },
    
    // --- אוקטובר 2026 ---
    "2026-10-01": { type: "cholhamoed", hebrew: "ה' חוה\"מ סוכות", standardHours: 7.0 },
    "2026-10-02": { type: "eve", hebrew: "הושענא רבה", standardHours: 5.5 }, // עודכן מ-5 ל-5.5 לפי מחלקת שכר
    "2026-10-03": { type: "holiday", hebrew: "שמחת תורה" },
    
    // --- דצמבר 2026 ---
    "2026-12-04": { type: "eve", hebrew: "ערב חנוכה", standardHours: 5.5 } // עודכן מ-5 ל-5.5 לפי מחלקת שכר
};
