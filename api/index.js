// server.ts
import express from "express";
import path from "path";
import { google } from "googleapis";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });
var ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
var app = express();
app.use(express.json());
app.use((req, _res, next) => {
  if (req.originalUrl && req.url !== req.originalUrl) {
    req.url = req.originalUrl;
  }
  next();
});
var getGoogleAuth = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }
  const token = authHeader.split(" ")[1];
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });
  return oauth2Client;
};
function indexToColLetter(index) {
  let temp = index;
  let letter = "";
  while (temp >= 0) {
    letter = String.fromCharCode(temp % 26 + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}
function extractCode(batchName) {
  let raw = (batchName || "").toString().trim().toUpperCase();
  const parts = raw.split("-");
  if (parts.length > 1) raw = parts[1].trim();
  raw = raw.replace(/\s*20\d{2}\s*$/i, "");
  raw = raw.replace(/[^A-Z0-9]/g, "");
  return raw;
}
function getCategory(batchName) {
  const code = extractCode(batchName);
  const prefix = code.substring(0, 2);
  if (["LJ", "AJ", "PJ"].includes(prefix)) return "JEE";
  if (["LN", "AN", "YN", "YA"].includes(prefix)) return "NEET";
  if (["UF", "NF", "UP"].includes(prefix)) return "Foundation";
  return "Other";
}
function getPhase(batchName) {
  const code = extractCode(batchName);
  if (code.length < 3) return "Unknown";
  const ch = code.charAt(2);
  if (ch === "E" || ch === "1") return "Phase 1";
  if (ch === "2") return "Phase 2";
  if (ch === "3") return "Phase 3";
  const n = parseInt(ch, 10);
  if (!isNaN(n) && n >= 4) return "Phase 4+";
  return "Unknown";
}
function getTimeSlot(batchName) {
  const code = extractCode(batchName);
  if (code.length < 2) return "";
  const suffix = code.substring(code.length - 2);
  if (["MA", "MP"].includes(suffix)) return "Morning";
  if (["NA", "NP"].includes(suffix)) return "Afternoon";
  if (["EA", "EP"].includes(suffix)) return "Evening";
  if (suffix === "WA") return "Weekend";
  return "";
}
var TIMETABLE_SHEET_IDS = [
  "1U5BGET6T_6vzFdEj1BrktFyeKAUNM3le-d6_QXX3IdE",
  "1YRDNMMvsCO8zBzfWP2JA__ewJZqyb8oIUBG8n3evps8",
  "1aUGmqbnCdVIXrmRXwHTItUN6kKTmk0UFuFi5D172NC4",
  "1qsgnhF3JTHPJKYSf19uSj5xtivxIDib1CnwSj-kSioE",
  "1PnpJ7N0VGyn093T3DGxg5DY7RgcEw1sjvJh7ZWhRw20",
  "103nQ5mxTrQFu8fQgppgzQIkOhbIrrY4VN5s3WpFx4p4",
  "1JtBcMmkNwnt2hqNgIEBGwNlcdEN4YziQYAN4j6q3GE0",
  "1KbI77PEFsxFqFB1ElUQlqSxz9ixTBevxt7wJPNI8FFU",
  "1po8VrTl5DXXwxcJN_evxQRn_5S4oNcxnbObQ5rd2K0w"
];
var centerTimetableMap = {};
function getIstDateInfo() {
  const now = /* @__PURE__ */ new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "short"
  }).formatToParts(now);
  const getPart = (type) => parts.find((p) => p.type === type)?.value || "";
  const day = getPart("day");
  const month = getPart("month");
  const year = getPart("year");
  const weekday = getPart("weekday");
  const dateStr = `${day}-${month}-${year}`;
  return { dateStr, dayStr: weekday, now };
}
function parseTimeString(timeStr, baseDate) {
  try {
    const clean = (timeStr || "").trim();
    const match = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = (match[3] || "").toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    const d = new Date(baseDate);
    d.setHours(hours, minutes, 0, 0);
    return d;
  } catch {
    return null;
  }
}
function computeLectureStatus(startTimeStr, endTimeStr, isToday, now) {
  if (!isToday) return "upcoming";
  try {
    const start = parseTimeString(startTimeStr, now);
    const end = parseTimeString(endTimeStr, now);
    if (!start || !end) return "upcoming";
    if (now < start) return "upcoming";
    if (now >= start && now <= end) return "ongoing";
    if (now > end) return "completed";
  } catch {
  }
  return "upcoming";
}
var rawDbCache = /* @__PURE__ */ new Map();
var RAW_DB_CACHE_TTL_MS = 5 * 60 * 1e3;
async function fetchRawDbWithCache(sheets, spreadsheetId, forceRefresh = false) {
  const cached = rawDbCache.get(spreadsheetId);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < RAW_DB_CACHE_TTL_MS) {
    return { title: cached.title, rows: cached.rows };
  }
  const [metaRes, valuesRes] = await Promise.all([
    sheets.spreadsheets.get({
      spreadsheetId,
      fields: "properties.title"
    }).catch(() => ({ data: { properties: { title: spreadsheetId } } })),
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Raw_DB'!A1:AL1000"
    }).catch((err) => {
      console.warn(`Failed to fetch Raw_DB for ${spreadsheetId}:`, err.message);
      return { data: { values: [] } };
    })
  ]);
  const title = metaRes.data?.properties?.title || spreadsheetId;
  const rows = valuesRes.data?.values || [];
  rawDbCache.set(spreadsheetId, {
    spreadsheetId,
    title,
    rows,
    timestamp: Date.now()
  });
  return { title, rows };
}
function getCenterKeywords(name) {
  const clean = (name || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const tokens = clean.split(/\s+/).filter((t) => t.length > 1);
  const keywords = new Set(tokens);
  if (clean.includes("pcmc") || clean.includes("pimpri")) {
    keywords.add("pcmc");
    keywords.add("pimpri");
  }
  if (clean.includes("viman")) {
    keywords.add("viman");
    keywords.add("vimannagar");
  }
  if (clean.includes("hadapsar")) {
    keywords.add("hadapsar");
  }
  if (clean.includes("fc") || clean.includes("fergusson") || clean.includes("fcroad")) {
    keywords.add("fc");
    keywords.add("fcroad");
    keywords.add("fergusson");
  }
  if (clean.includes("kothrud") || clean.includes("kothurd")) {
    keywords.add("kothrud");
    keywords.add("kothurd");
  }
  if (clean.includes("tc") || clean.includes("tuition")) {
    keywords.add("tc");
    keywords.add("tuition");
  }
  if (clean.includes("vp") || clean.includes("vidyapeeth")) {
    keywords.add("vidyapeeth");
    keywords.add("vp");
  }
  return Array.from(keywords);
}
function doesSheetTitleMatchCenter(sheetTitle, centerName) {
  const titleClean = (sheetTitle || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const centerKeywords = getCenterKeywords(centerName);
  const primaryKeywords = ["pimpri", "pcmc", "viman", "hadapsar", "fcroad", "fergusson", "kothrud", "kothurd", "tuition"];
  for (const kw of primaryKeywords) {
    if (centerKeywords.includes(kw) && titleClean.includes(kw)) {
      return true;
    }
  }
  let matchCount = 0;
  for (const kw of centerKeywords) {
    if (kw !== "vp" && kw !== "vidyapeeth" && kw !== "pune" && titleClean.includes(kw)) {
      matchCount++;
    }
  }
  return matchCount > 0;
}
function normalizeDateStr(dateStr) {
  if (!dateStr) return "";
  let s = dateStr.trim().toUpperCase().replace(/[\/\.]/g, "-");
  s = s.replace(/\b0([1-9])\b/g, "$1");
  return s;
}
function isDateOrDayMatchingToday(rowDate, rowDay, todayDateStr, todayDayStr, nowIst) {
  const normRowDate = normalizeDateStr(rowDate);
  const normToday = normalizeDateStr(todayDateStr);
  const normRowDay = (rowDay || "").trim().toUpperCase().substring(0, 3);
  const normTodayDay = (todayDayStr || "").trim().toUpperCase().substring(0, 3);
  if (normRowDate && normToday) {
    if (normRowDate === normToday || normRowDate.includes(normToday) || normToday.includes(normRowDate)) {
      return true;
    }
    try {
      const parsed = new Date(rowDate);
      if (!isNaN(parsed.getTime())) {
        return parsed.getDate() === nowIst.getDate() && parsed.getMonth() === nowIst.getMonth() && parsed.getFullYear() === nowIst.getFullYear();
      }
    } catch {
    }
    return false;
  }
  if (normRowDay && normTodayDay) {
    return normRowDay === normTodayDay;
  }
  return false;
}
function cleanBatchKey(str) {
  return (str || "").toUpperCase().replace(/VIDYAPEETH/g, "").replace(/TUITION/g, "").replace(/SIP/g, "").replace(/\b20\d{2}\b/g, "").replace(/\(\d+\)/g, "").replace(/[^A-Z0-9]/g, "");
}
function extractCoreAlphanumeric(str) {
  const clean = cleanBatchKey(str);
  const match = clean.match(/[A-Z]{2,4}\d{2,3}[A-Z]{2}/);
  if (match) return match[0];
  const matchGeneral = clean.match(/[A-Z0-9]{5,8}/);
  if (matchGeneral) return matchGeneral[0];
  return clean;
}
function isBatchMatch(rowBatch, rowBatchFaculty, targetBatch) {
  if (!targetBatch) return false;
  const targetClean = cleanBatchKey(targetBatch);
  const rowBatchClean = cleanBatchKey(rowBatch);
  const rowFacultyClean = cleanBatchKey(rowBatchFaculty);
  if (targetClean && rowBatchClean && targetClean === rowBatchClean) return true;
  if (targetClean.length >= 4 && rowBatchClean && (rowBatchClean.includes(targetClean) || targetClean.includes(rowBatchClean))) {
    return true;
  }
  if (targetClean.length >= 4 && rowFacultyClean && rowFacultyClean.includes(targetClean)) {
    return true;
  }
  const targetCore = extractCoreAlphanumeric(targetBatch);
  if (targetCore && targetCore.length >= 4) {
    if (rowBatchClean.includes(targetCore) || rowFacultyClean.includes(targetCore)) {
      return true;
    }
  }
  const stripCenter = (s) => s.replace(/^(27|S98|\d{2})/, "");
  const targetNoCenter = stripCenter(targetClean);
  const rowNoCenter = stripCenter(rowBatchClean);
  if (targetNoCenter.length >= 4 && rowNoCenter.length >= 4) {
    if (targetNoCenter === rowNoCenter || rowNoCenter.includes(targetNoCenter) || targetNoCenter.includes(rowNoCenter)) {
      return true;
    }
  }
  return false;
}
function parseRawDbRows(rows) {
  if (!rows || rows.length < 2) return [];
  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const rCells = (rows[r] || []).map((c) => (c || "").toString().trim().toLowerCase());
    const hasDay = rCells.some((c) => c === "day");
    const hasDateOrBatch = rCells.some((c) => c.includes("date") || c.includes("batch") || c.includes("start") || c.includes("time"));
    if (hasDay && hasDateOrBatch) {
      headerRowIdx = r;
      break;
    }
  }
  const headerRow = rows[headerRowIdx] || [];
  let dayIdx = 0;
  let dateIdx = 1;
  let startIdx = 2;
  let endIdx = 3;
  let batchFacultyIdx = 4;
  let timeIdx = 7;
  let batchCodeIdx = 8;
  let facultyCodeIdx = 9;
  let subjectIdx = 34;
  let teacherEmailIdx = 36;
  for (let idx = 0; idx <= 11 && idx < headerRow.length; idx++) {
    const val = headerRow[idx];
    const h = (val || "").toString().trim().toLowerCase();
    if (h === "day") dayIdx = idx;
    else if (h.includes("date") || h.includes("lecture date")) dateIdx = idx;
    else if (h.includes("start time") || h === "start") startIdx = idx;
    else if (h.includes("end time") || h === "end") endIdx = idx;
    else if (h.includes("batch & faculty") || h.includes("faculty & batch") || h.includes("batch & fac")) batchFacultyIdx = idx;
    else if (h === "time" || h === "time range") timeIdx = idx;
    else if (h === "batch code" || h.includes("batch") && !h.includes("&") && !h.includes("faculty")) batchCodeIdx = idx;
    else if (h === "faculty code" || h.includes("faculty") && !h.includes("&") && !h.includes("batch")) facultyCodeIdx = idx;
  }
  for (let idx = 12; idx < headerRow.length; idx++) {
    const val = headerRow[idx];
    const h = (val || "").toString().trim().toLowerCase();
    if (h.includes("subject")) subjectIdx = idx;
    else if (h.includes("teacher email") || h.includes("faculty email") || h.includes("email") || h.includes("teacher")) teacherEmailIdx = idx;
  }
  const { dateStr: todayDate, dayStr: todayDay, now } = getIstDateInfo();
  const result = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const batchCode = (row[batchCodeIdx] || "").toString().trim();
    const batchFaculty = (row[batchFacultyIdx] || "").toString().trim();
    if (!batchCode && !batchFaculty) continue;
    let day = (row[dayIdx] || "").toString().trim();
    const lectureDate = (row[dateIdx] || "").toString().trim();
    if (!day && lectureDate) {
      try {
        const parsed = new Date(lectureDate);
        if (!isNaN(parsed.getTime())) {
          day = parsed.toLocaleDateString("en-US", { weekday: "short" });
        }
      } catch {
      }
    }
    const startTime = (row[startIdx] || "").toString().trim();
    const endTime = (row[endIdx] || "").toString().trim();
    const timeRange = (row[timeIdx] || (startTime && endTime ? `${startTime} - ${endTime}` : "")).toString().trim();
    const facultyCode = (row[facultyCodeIdx] || "").toString().trim();
    const subject = (row[subjectIdx] || "").toString().trim();
    const teacherEmail = (row[teacherEmailIdx] || "").toString().trim();
    const isToday = isDateOrDayMatchingToday(lectureDate, day, todayDate, todayDay, now);
    const status = computeLectureStatus(startTime, endTime, isToday, now);
    result.push({
      day,
      lectureDate,
      startTime,
      endTime,
      timeRange,
      batchFaculty,
      batchCode,
      facultyCode,
      subject,
      teacherEmail,
      isToday,
      status,
      rowIndex: i + 1
    });
  }
  return deduplicateLectures(result);
}
function deduplicateLectures(lectures) {
  const seen = /* @__PURE__ */ new Set();
  const unique = [];
  const normalizeTimeKey = (timeStr) => {
    if (!timeStr) return "";
    const standardized = timeStr.replace(/\b(\d):/g, "0$1:");
    return standardized.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  };
  const normalizeSubjectKey = (sub) => {
    const clean = (sub || "").trim().toUpperCase();
    if (clean.includes("PHY")) return "PHY";
    if (clean.includes("CHEM")) return "CHEM";
    if (clean.includes("MATH")) return "MATH";
    if (clean.includes("BOT")) return "BOT";
    if (clean.includes("ZOO")) return "ZOO";
    if (clean.includes("BIO")) return "BIO";
    return clean.replace(/[^A-Z0-9]/gi, "");
  };
  for (const lec of lectures) {
    const cleanDay = (lec.day || "").trim().toUpperCase().substring(0, 3);
    const cleanDate = (lec.lectureDate || "").trim().toUpperCase().replace(/[^A-Z0-9]/gi, "");
    const cleanTime = normalizeTimeKey(lec.timeRange || `${lec.startTime}-${lec.endTime}`);
    const cleanSubject = normalizeSubjectKey(lec.subject);
    const cleanFaculty = (lec.facultyCode || lec.teacherName || "").trim().toUpperCase().replace(/[^A-Z0-9]/gi, "");
    const key = `${cleanDay}_${cleanDate}_${cleanTime}_${cleanSubject}_${cleanFaculty}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(lec);
    }
  }
  return unique;
}
app.get("/api/batches", async (req, res) => {
  try {
    const auth = getGoogleAuth(req);
    const spreadsheetId = req.query.spreadsheetId || "1-OYeCl3SME14Jjk1CCxRAAho_jrvgji63fFunLZvKiM";
    const sheets = google.sheets({ version: "v4", auth });
    const bmMap = {};
    try {
      const refRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Ref!A:H"
      });
      const refRows = refRes.data.values || [];
      if (refRows.length > 0) {
        const refHeader = refRows[0] || [];
        let refBatchIdx = -1;
        let refBmIdx = -1;
        refHeader.forEach((h, idx) => {
          const head = (h || "").toString().toLowerCase();
          if (refBatchIdx === -1 && (head.includes("batch") || head.includes("name"))) {
            refBatchIdx = idx;
          }
          if (refBmIdx === -1 && (head.includes("bm") || head.includes("manager") || head.includes("assign") || head.includes("email"))) {
            refBmIdx = idx;
          }
        });
        if (refBatchIdx === -1) refBatchIdx = 1;
        if (refBmIdx === -1) refBmIdx = 3;
        for (let i = 1; i < refRows.length; i++) {
          const rawFullName = refRows[i][refBatchIdx] ? refRows[i][refBatchIdx].toString() : "";
          let bmVal = refRows[i][refBmIdx] ? refRows[i][refBmIdx].toString().trim() : "";
          if (!bmVal && refRows[i][2]) bmVal = refRows[i][2].toString().trim();
          if (!bmVal && refRows[i][4]) bmVal = refRows[i][4].toString().trim();
          if (rawFullName && bmVal) {
            const upperRaw = rawFullName.trim().toUpperCase().replace(/\s+/g, " ");
            const stripped = upperRaw.replace(/VIDYAPEETH/gi, "").replace(/TUITION/gi, "").replace(/SIP/gi, "").replace(/\(MERGED\)/gi, "").trim().replace(/\s+/g, " ");
            const core = extractCode(rawFullName);
            bmMap[upperRaw] = bmVal;
            if (stripped) {
              bmMap[stripped] = bmVal;
              bmMap[`TUITION ${stripped}`] = bmVal;
              bmMap[`VIDYAPEETH ${stripped}`] = bmVal;
              bmMap[`SIP ${stripped}`] = bmVal;
            }
            if (core) {
              bmMap[core] = bmVal;
            }
          }
        }
      }
    } catch (err) {
      console.warn("Could not read 'Ref' sheet or it is missing:", err.message);
    }
    const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetsList = metaRes.data.sheets || [];
    const targetTabs = [];
    sheetsList.forEach((sheet) => {
      const name = sheet.properties?.title || "";
      if (name && name.trim().toLowerCase() !== "ref") {
        targetTabs.push(name);
      }
    });
    const batchesData = {};
    const masterBms = /* @__PURE__ */ new Set();
    for (const tabName of targetTabs) {
      try {
        const rangeRes = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `'${tabName}'!A:Z`
        });
        const rows = rangeRes.data.values || [];
        const sheetData = [];
        const headerRow = rows[0] || [];
        let batchCodeIdx = 0;
        let batchIdIdx = 1;
        let adminUrlIdx = 2;
        let pwUrlIdx = 3;
        let driveUrlIdx = 9;
        let matchStatusIdx = 10;
        headerRow.forEach((val, index) => {
          const cleanHeader = (val || "").toString().trim().toLowerCase();
          if (cleanHeader.includes("batch id") || cleanHeader === "batchid" || cleanHeader === "id") {
            batchIdIdx = index;
          } else if (cleanHeader.includes("batch code") || cleanHeader.includes("batch name") || cleanHeader === "code" || cleanHeader === "batch") {
            batchCodeIdx = index;
          } else if (cleanHeader.includes("admin url") || cleanHeader.includes("admin link") || cleanHeader === "admin") {
            adminUrlIdx = index;
          } else if (cleanHeader.includes("pw url") || cleanHeader.includes("app url") || cleanHeader.includes("pw app") || cleanHeader === "app") {
            pwUrlIdx = index;
          } else if (cleanHeader.includes("drive link") || cleanHeader.includes("drive url") || cleanHeader.includes("google drive") || cleanHeader === "drive") {
            driveUrlIdx = index;
          } else if (cleanHeader.includes("match status") || cleanHeader.includes("drive status") || cleanHeader === "status") {
            matchStatusIdx = index;
          }
        });
        const batchMap = /* @__PURE__ */ new Map();
        const orderedKeys = [];
        for (let i = 1; i < rows.length; i++) {
          const batchCode = rows[i][batchCodeIdx] ? rows[i][batchCodeIdx].toString().trim() : "";
          if (!batchCode) continue;
          let rawBatchId = rows[i][batchIdIdx] ? rows[i][batchIdIdx].toString().trim() : "";
          const adminUrl = rows[i][adminUrlIdx] ? rows[i][adminUrlIdx].toString().trim() : "";
          const pwUrl = rows[i][pwUrlIdx] ? rows[i][pwUrlIdx].toString().trim() : "";
          const driveUrl = rows[i][driveUrlIdx] ? rows[i][driveUrlIdx].toString().trim() : "";
          const matchStatus = rows[i][matchStatusIdx] ? rows[i][matchStatusIdx].toString().trim() : "";
          if (!rawBatchId) {
            const urlMatch = (adminUrl + " " + pwUrl).match(/[0-9a-f]{24}/i);
            if (urlMatch) rawBatchId = urlMatch[0];
          }
          const cleanCode = batchCode.trim();
          let finalDisplayName = cleanCode;
          const upperCode = cleanCode.toUpperCase();
          if (upperCode.startsWith("T")) {
            finalDisplayName = `Tuition ${cleanCode}`;
          } else if (upperCode.startsWith("S")) {
            finalDisplayName = `SIP ${cleanCode}`;
          } else {
            finalDisplayName = `Vidyapeeth ${cleanCode}`;
          }
          const lookupKey = batchCode.replace(/\s+/g, " ").toUpperCase();
          const strippedKey = lookupKey.replace(/VIDYAPEETH/gi, "").replace(/TUITION/gi, "").replace(/SIP/gi, "").replace(/\(MERGED\)/gi, "").trim().replace(/\s+/g, " ");
          const coreKey = extractCode(batchCode);
          const bmEmail = bmMap[lookupKey] || bmMap[strippedKey] || bmMap[finalDisplayName.toUpperCase()] || bmMap[coreKey] || "";
          if (bmEmail) {
            masterBms.add(bmEmail);
          }
          const dedupeKey = rawBatchId ? `ID_${rawBatchId.toLowerCase()}` : `CODE_${extractCode(batchCode) || cleanCode.toUpperCase()}`;
          if (batchMap.has(dedupeKey)) {
            const existing = batchMap.get(dedupeKey);
            const prevNames = existing.previousNames || [];
            if (existing.fullName && existing.fullName !== batchCode && !prevNames.includes(existing.fullName)) {
              prevNames.push(existing.fullName);
            }
            const allRowIndices = existing.allRowIndices || [existing.rowIndex];
            if (!allRowIndices.includes(i + 1)) {
              allRowIndices.push(i + 1);
            }
            existing.fullName = batchCode;
            existing.displayName = finalDisplayName;
            existing.category = getCategory(batchCode);
            existing.phase = getPhase(batchCode);
            existing.timeSlot = getTimeSlot(batchCode);
            existing.rowIndex = i + 1;
            existing.allRowIndices = allRowIndices;
            existing.previousNames = prevNames;
            if (rawBatchId) existing.batchId = rawBatchId;
            if (adminUrl) existing.adminUrl = adminUrl;
            if (pwUrl) existing.pwUrl = pwUrl;
            if (driveUrl && driveUrl !== "Not Found") {
              existing.driveUrl = driveUrl;
            } else if (!existing.driveUrl && driveUrl) {
              existing.driveUrl = driveUrl;
            }
            if (matchStatus) existing.matchStatus = matchStatus;
            if (bmEmail) existing.bmEmail = bmEmail;
          } else {
            const newBatch = {
              fullName: batchCode,
              displayName: finalDisplayName,
              batchId: rawBatchId,
              previousNames: [],
              allRowIndices: [i + 1],
              bmEmail,
              adminUrl,
              pwUrl,
              driveUrl,
              matchStatus,
              category: getCategory(batchCode),
              phase: getPhase(batchCode),
              timeSlot: getTimeSlot(batchCode),
              tabName,
              rowIndex: i + 1
            };
            batchMap.set(dedupeKey, newBatch);
            orderedKeys.push(dedupeKey);
          }
        }
        sheetData.push(...orderedKeys.map((k) => batchMap.get(k)));
        batchesData[tabName] = sheetData;
      } catch (tabErr) {
        console.error(`Error reading tab ${tabName}:`, tabErr.message);
        batchesData[tabName] = [];
      }
    }
    res.json({
      batchesData,
      bms: Array.from(masterBms).sort()
    });
  } catch (error) {
    console.error("API Error (get-batches):", error);
    res.status(error.message.includes("Authorization") ? 401 : 500).json({
      error: error.message || "An error occurred while loading sheets data."
    });
  }
});
app.post("/api/scan/batch", async (req, res) => {
  try {
    const auth = getGoogleAuth(req);
    const { spreadsheetId, tabName, batchCode, rowIndex, allRowIndices } = req.body;
    if (!tabName || !batchCode || !rowIndex) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    const coreCode = batchCode.split("-").length > 1 ? batchCode.split("-")[1].split(" ")[0].replace(/[^A-Z0-9]/gi, "").toUpperCase() : batchCode.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const drive = google.drive({ version: "v3", auth });
    let matchedUrl = "";
    let matchedFolderName = "";
    const exactRes = await drive.files.list({
      q: `name contains '${coreCode}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name, webViewLink)",
      pageSize: 1
    });
    const files = exactRes.data.files || [];
    if (files.length > 0) {
      matchedUrl = files[0].webViewLink || "";
      matchedFolderName = files[0].name || "";
    }
    if (!matchedUrl && coreCode.length >= 5) {
      const looseCode = coreCode.slice(0, -2);
      const looseRes = await drive.files.list({
        q: `name contains '${looseCode}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: "files(id, name, webViewLink)",
        pageSize: 20
      });
      const looseFiles = looseRes.data.files || [];
      for (const lf of looseFiles) {
        const cleanLFName = (lf.name || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
        if (cleanLFName.includes(coreCode)) {
          matchedUrl = lf.webViewLink || "";
          matchedFolderName = lf.name || "";
          break;
        }
      }
    }
    const statusValue = matchedUrl ? `Found: ${matchedFolderName}` : `Missing: ${coreCode}`;
    const urlValue = matchedUrl || "Not Found";
    const sheets = google.sheets({ version: "v4", auth });
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${tabName}'!1:1`
    });
    const headerRow = headerRes.data.values?.[0] || [];
    let driveUrlIdx = 9;
    let matchStatusIdx = 10;
    headerRow.forEach((val, index) => {
      const cleanHeader = (val || "").toString().trim().toLowerCase();
      if (cleanHeader.includes("drive link") || cleanHeader.includes("drive url") || cleanHeader.includes("google drive") || cleanHeader === "drive") {
        driveUrlIdx = index;
      } else if (cleanHeader.includes("match status") || cleanHeader.includes("drive status") || cleanHeader === "status") {
        matchStatusIdx = index;
      }
    });
    const driveLetter = indexToColLetter(driveUrlIdx);
    const statusLetter = indexToColLetter(matchStatusIdx);
    const targetRows = Array.isArray(allRowIndices) && allRowIndices.length > 0 ? allRowIndices : [rowIndex];
    for (const rIdx of targetRows) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${tabName}'!${driveLetter}${rIdx}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[urlValue]]
        }
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${tabName}'!${statusLetter}${rIdx}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[statusValue]]
        }
      });
    }
    res.json({
      driveUrl: urlValue,
      matchStatus: statusValue
    });
  } catch (error) {
    console.error("API Error (scan-batch):", error);
    res.status(error.message.includes("Authorization") ? 401 : 500).json({
      error: error.message || "An error occurred during Google Drive search."
    });
  }
});
app.post("/api/update-batch-links", async (req, res) => {
  try {
    const auth = getGoogleAuth(req);
    const { spreadsheetId, tabName, rowIndex, adminUrl, pwUrl, driveUrl, matchStatus, allRowIndices } = req.body;
    if (!tabName || !rowIndex) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    const sheets = google.sheets({ version: "v4", auth });
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${tabName}'!1:1`
    });
    const headerRow = headerRes.data.values?.[0] || [];
    let adminUrlIdx = 2;
    let pwUrlIdx = 3;
    let driveUrlIdx = 9;
    let matchStatusIdx = 10;
    headerRow.forEach((val, index) => {
      const cleanHeader = (val || "").toString().trim().toLowerCase();
      if (cleanHeader.includes("admin url") || cleanHeader.includes("admin link") || cleanHeader === "admin") {
        adminUrlIdx = index;
      } else if (cleanHeader.includes("pw url") || cleanHeader.includes("app url") || cleanHeader.includes("pw app") || cleanHeader === "app") {
        pwUrlIdx = index;
      } else if (cleanHeader.includes("drive link") || cleanHeader.includes("drive url") || cleanHeader.includes("google drive") || cleanHeader === "drive") {
        driveUrlIdx = index;
      } else if (cleanHeader.includes("match status") || cleanHeader.includes("drive status") || cleanHeader === "status") {
        matchStatusIdx = index;
      }
    });
    const adminLetter = indexToColLetter(adminUrlIdx);
    const pwLetter = indexToColLetter(pwUrlIdx);
    const driveLetter = indexToColLetter(driveUrlIdx);
    const statusLetter = indexToColLetter(matchStatusIdx);
    const targetRows = Array.isArray(allRowIndices) && allRowIndices.length > 0 ? allRowIndices : [rowIndex];
    for (const rIdx of targetRows) {
      if (adminUrl !== void 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${tabName}'!${adminLetter}${rIdx}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[adminUrl || ""]]
          }
        });
      }
      if (pwUrl !== void 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${tabName}'!${pwLetter}${rIdx}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[pwUrl || ""]]
          }
        });
      }
      if (driveUrl !== void 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${tabName}'!${driveLetter}${rIdx}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[driveUrl || ""]]
          }
        });
      }
      if (matchStatus !== void 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${tabName}'!${statusLetter}${rIdx}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[matchStatus || ""]]
          }
        });
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error("API Error (update-batch-links):", error);
    res.status(error.message.includes("Authorization") ? 401 : 500).json({
      error: error.message || "An error occurred while updating the spreadsheet."
    });
  }
});
var extraClassCache = /* @__PURE__ */ new Map();
var EXTRA_CLASS_SPREADSHEET_ID = "1f5HNSsjR_08dDDVvFoqrG40SaKdxhgbRnhD8cp7gY_4";
function parseDateToIso(rawDate, currentYearStr) {
  if (!rawDate) return null;
  const str = String(rawDate).trim();
  if (!str) return null;
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, "0");
    const d = isoMatch[3].padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const monthMap = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    sept: "09",
    oct: "10",
    nov: "11",
    dec: "12"
  };
  const mmmMatch = str.match(/^(\d{1,2})[-/\s]+([a-zA-Z]{3,4})[-/\s]*(\d{2,4})?$/);
  if (mmmMatch) {
    const d = mmmMatch[1].padStart(2, "0");
    const monStr = mmmMatch[2].toLowerCase().substring(0, 3);
    const m = monthMap[monStr] || monthMap[mmmMatch[2].toLowerCase()];
    if (m) {
      let y = mmmMatch[3];
      if (!y) {
        y = currentYearStr;
      } else if (y.length === 2) {
        y = `20${y}`;
      }
      return `${y}-${m}-${d}`;
    }
  }
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, "0");
    const m = dmyMatch[2].padStart(2, "0");
    let y = dmyMatch[3];
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
  }
  const num = Number(str);
  if (!isNaN(num) && num > 4e4 && num < 6e4) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const target = new Date(epoch.getTime() + num * 864e5);
    const y = target.getUTCFullYear();
    const m = String(target.getUTCMonth() + 1).padStart(2, "0");
    const d = String(target.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return null;
}
async function fetchAllExtraClassLectures(sheets, forceRefresh = false) {
  const cacheKey = `extra-classes-${EXTRA_CLASS_SPREADSHEET_ID}`;
  const cached = extraClassCache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < 2 * 60 * 1e3) {
    return cached.data;
  }
  const metaRes = await sheets.spreadsheets.get({
    spreadsheetId: EXTRA_CLASS_SPREADSHEET_ID
  });
  const allSheets = metaRes.data.sheets || [];
  const IGNORED_TABS = ["reference", "sohel", "osmanabad", "instructions", "readme", "template"];
  const centerSheets = allSheets.filter((s) => {
    const title = (s.properties?.title || "").trim();
    if (!title) return false;
    const lower = title.toLowerCase();
    return !IGNORED_TABS.some((ign) => lower.includes(ign));
  });
  const sheetResults = await Promise.all(
    centerSheets.map(async (sheet) => {
      const sheetTitle = sheet.properties?.title || "";
      try {
        const valuesRes = await sheets.spreadsheets.values.get({
          spreadsheetId: EXTRA_CLASS_SPREADSHEET_ID,
          range: `'${sheetTitle}'!A1:N`
        });
        return {
          sheetTitle,
          rows: valuesRes.data.values || []
        };
      } catch (e) {
        console.warn(`[Extra Class] Failed to fetch tab '${sheetTitle}':`, e.message);
        return { sheetTitle, rows: [] };
      }
    })
  );
  const now = /* @__PURE__ */ new Date();
  const todayIstParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
  const tomorrowDateObj = new Date(now.getTime() + 24 * 60 * 60 * 1e3);
  const tomorrowIstParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(tomorrowDateObj);
  const currentYearStr = todayIstParts.split("-")[0];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formatIsoDisplay = (iso) => {
    const [y, m, d] = iso.split("-");
    return `${d}-${monthNames[parseInt(m, 10) - 1]}-${y}`;
  };
  const todayDisplay = formatIsoDisplay(todayIstParts);
  const tomorrowDisplay = formatIsoDisplay(tomorrowIstParts);
  const allLectures = [];
  const centersFound = /* @__PURE__ */ new Set();
  for (const { sheetTitle, rows } of sheetResults) {
    if (!rows || rows.length === 0) continue;
    centersFound.add(sheetTitle);
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const nonEmpty = (rows[i] || []).filter((c) => String(c || "").trim() !== "");
      if (nonEmpty.length >= 2) {
        headerRowIdx = i;
        break;
      }
    }
    const headerRow = (rows[headerRowIdx] || []).map((h) => String(h || "").trim().toLowerCase());
    let batchCol = 0;
    let dayCol = 1;
    let dateCol = 2;
    let facultyCol = 3;
    let inTimeCol = 4;
    let outTimeCol = 5;
    let classTypeCol = 6;
    let teacherCol = 7;
    let subjectCol = 8;
    let bmCol = 9;
    let announcementCol = 10;
    let roomCol = 11;
    let statusCol = 12;
    headerRow.forEach((h, idx) => {
      if (h.includes("batch")) batchCol = idx;
      else if (h.includes("day")) dayCol = idx;
      else if (h.includes("date")) dateCol = idx;
      else if (h.includes("faculty") && !h.includes("name")) facultyCol = idx;
      else if (h.includes("in time") || h.includes("start") || h === "in") inTimeCol = idx;
      else if (h.includes("out time") || h.includes("end") || h === "out") outTimeCol = idx;
      else if (h.includes("doubts") || h.includes("test") || h.includes("class type")) classTypeCol = idx;
      else if (h.includes("teacher") || h.includes("faculty") && h.includes("name")) teacherCol = idx;
      else if (h.includes("subject")) subjectCol = idx;
      else if (h.includes("bm") || h.includes("manager")) bmCol = idx;
      else if (h.includes("announcement") || h.includes("message")) announcementCol = idx;
      else if (h.includes("room")) roomCol = idx;
      else if (h.includes("status") || h.includes("done") || h.includes("announced") || h.includes("action")) statusCol = idx;
    });
    const statusColLetter = indexToColLetter(statusCol);
    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r] || [];
      const batchRaw = String(row[batchCol] || "").trim();
      if (!batchRaw) continue;
      if (batchRaw.toLowerCase().includes("batch") && batchRaw.toLowerCase().includes("code")) continue;
      let day = String(row[dayCol] || "").trim();
      const rawDate = String(row[dateCol] || "").trim();
      const facultyCode = String(row[facultyCol] || "").trim();
      const inTime = String(row[inTimeCol] || "").trim();
      const outTime = String(row[outTimeCol] || "").trim();
      const classType = String(row[classTypeCol] || "").trim();
      const teacherName = String(row[teacherCol] || "").trim();
      const subject = String(row[subjectCol] || "").trim();
      const bmName = String(row[bmCol] || "").trim();
      let announcement = String(row[announcementCol] || "").trim();
      const room = String(row[roomCol] || "").trim();
      const rawStatus = String(row[statusCol] || "").trim();
      const statusLower = rawStatus.toLowerCase();
      const isDone = ["done", "announced", "yes", "ok", "completed", "true", "checked", "sent"].some((s) => statusLower.includes(s));
      const isoDate = parseDateToIso(rawDate, currentYearStr);
      let displayDate = rawDate;
      let isToday = false;
      let isTomorrow = false;
      let isPast = false;
      let isUpcoming = false;
      if (isoDate) {
        displayDate = formatIsoDisplay(isoDate);
        if (isoDate === todayIstParts) {
          isToday = true;
        } else if (isoDate === tomorrowIstParts) {
          isTomorrow = true;
        } else if (isoDate < todayIstParts) {
          isPast = true;
        } else {
          isUpcoming = true;
        }
        if (!day) {
          try {
            const [y, m, d] = isoDate.split("-").map(Number);
            const dObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
            day = dObj.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
          } catch {
          }
        }
      } else {
        const lowerDate = rawDate.toLowerCase();
        if (lowerDate.includes("today")) isToday = true;
        else if (lowerDate.includes("tomorrow")) isTomorrow = true;
      }
      if (!announcement) {
        announcement = `\u{1F4E2} *Extra Lecture Announcement*

\u{1F4CC} *Batch:* ${batchRaw}
\u{1F4C5} *Date & Day:* ${displayDate || rawDate} (${day || "Scheduled"})
\u23F0 *Time:* ${inTime || "TBD"} - ${outTime || "TBD"}
\u{1F4DA} *Subject:* ${subject || "Special Lecture"}
\u{1F468}\u200D\u{1F3EB} *Faculty:* ${teacherName || facultyCode || "Assigned Faculty"}
\u{1F3E2} *Room / Venue:* ${room || "Assigned Room"}

\u26A0\uFE0F *Mandatory for all enrolled students. Please report on time.*`;
      }
      const category = getCategory(batchRaw);
      const phase = getPhase(batchRaw);
      const timeSlot = getTimeSlot(batchRaw);
      allLectures.push({
        id: `${sheetTitle}_${r + 1}`,
        spreadsheetId: EXTRA_CLASS_SPREADSHEET_ID,
        sheetTitle,
        center: sheetTitle,
        rowIndex: r + 1,
        statusColLetter,
        batchCode: batchRaw,
        formattedBatchName: batchRaw.toUpperCase().startsWith("VIDYAPEETH") || batchRaw.toUpperCase().startsWith("TUITION") || batchRaw.toUpperCase().startsWith("SIP") ? batchRaw : batchRaw.toUpperCase().startsWith("T") ? `Tuition ${batchRaw}` : batchRaw.toUpperCase().startsWith("S") ? `SIP ${batchRaw}` : `Vidyapeeth ${batchRaw}`,
        category,
        phase,
        timeSlot,
        day,
        rawDate,
        isoDate,
        displayDate,
        facultyCode,
        inTime,
        outTime,
        timeRange: inTime && outTime ? `${inTime} - ${outTime}` : inTime || outTime || "Time TBA",
        classType: classType || "Extra Lecture",
        teacherName,
        subject,
        bmName,
        announcement,
        room: room ? room.toLowerCase().startsWith("room") ? room : `Room ${room}` : "Room TBA",
        rawStatus,
        isDone,
        isToday,
        isTomorrow,
        isPast,
        isUpcoming
      });
    }
  }
  const todayCount = allLectures.filter((c) => c.isToday).length;
  const tomorrowCount = allLectures.filter((c) => c.isTomorrow).length;
  const upcomingCount = allLectures.filter((c) => c.isUpcoming).length;
  const pastCount = allLectures.filter((c) => c.isPast).length;
  const doneCount = allLectures.filter((c) => c.isDone).length;
  const pendingCount = allLectures.filter((c) => c.isToday && !c.isDone).length;
  const responsePayload = {
    todayDate: todayIstParts,
    tomorrowDate: tomorrowIstParts,
    todayDateDisplay: todayDisplay,
    tomorrowDateDisplay: tomorrowDisplay,
    centers: Array.from(centersFound),
    classes: allLectures,
    counts: {
      today: todayCount,
      tomorrow: tomorrowCount,
      upcoming: upcomingCount,
      past: pastCount,
      pending: pendingCount,
      done: doneCount,
      total: allLectures.length
    }
  };
  extraClassCache.set(cacheKey, {
    data: responsePayload,
    timestamp: Date.now()
  });
  return responsePayload;
}
app.get("/api/timetable/batch-schedule", async (req, res) => {
  try {
    const auth = getGoogleAuth(req);
    const center = req.query.center || "";
    const batchCode = req.query.batchCode || "";
    let spreadsheetId = req.query.spreadsheetId || "";
    const forceRefresh = req.query.forceRefresh === "true";
    const searchAll = req.query.searchAll === "true" || !center || center === "ALL";
    if (!batchCode) {
      return res.status(400).json({ error: "Missing required query parameter: batchCode" });
    }
    const sheets = google.sheets({ version: "v4", auth });
    let spreadsheetTitle = "";
    let foundLectures = [];
    let resolvedCenter = center || "";
    let candidateId = spreadsheetId;
    if (!searchAll) {
      if (!candidateId && center && centerTimetableMap[center]?.spreadsheetId) {
        candidateId = centerTimetableMap[center].spreadsheetId;
        spreadsheetTitle = centerTimetableMap[center].spreadsheetTitle || "";
      }
      if (candidateId) {
        try {
          const { title, rows } = await fetchRawDbWithCache(sheets, candidateId, forceRefresh);
          spreadsheetTitle = title;
          const parsed = parseRawDbRows(rows);
          const matches = parsed.filter((l) => isBatchMatch(l.batchCode, l.batchFaculty, batchCode));
          if (matches.length > 0) {
            foundLectures = matches;
            spreadsheetId = candidateId;
            resolvedCenter = center;
          }
        } catch (err) {
          console.warn(`Error querying candidate sheet ${candidateId}:`, err.message);
        }
      }
    }
    if (foundLectures.length === 0) {
      const sheetsToSearch = !searchAll && candidateId ? TIMETABLE_SHEET_IDS.filter((id) => id !== candidateId) : TIMETABLE_SHEET_IDS;
      const results = await Promise.all(
        sheetsToSearch.map(async (sId) => {
          try {
            const { title, rows } = await fetchRawDbWithCache(sheets, sId, forceRefresh);
            const parsed = parseRawDbRows(rows);
            const matches = parsed.filter((l) => isBatchMatch(l.batchCode, l.batchFaculty, batchCode));
            return { sId, title, matches, totalParsed: parsed.length };
          } catch (err) {
            return { sId, title: sId, matches: [], totalParsed: 0 };
          }
        })
      );
      const matchedResult = results.find((r) => r.matches.length > 0);
      if (matchedResult) {
        foundLectures = matchedResult.matches;
        spreadsheetId = matchedResult.sId;
        spreadsheetTitle = matchedResult.title;
        const knownCenters = ["PCMC VP", "HADAPSAR", "VIMAN NAGAR VP", "TC", "FC ROAD", "KOTHURD"];
        for (const [cName, cMap] of Object.entries(centerTimetableMap)) {
          if (cMap.spreadsheetId === matchedResult.sId) {
            resolvedCenter = cName;
            break;
          }
        }
        if (!resolvedCenter) {
          for (const kc of knownCenters) {
            if (doesSheetTitleMatchCenter(matchedResult.title, kc)) {
              resolvedCenter = kc;
              break;
            }
          }
        }
        if (!resolvedCenter) {
          resolvedCenter = matchedResult.title || "Pune Center";
        }
      } else {
        if (!spreadsheetId) {
          for (const r of results) {
            if (center && doesSheetTitleMatchCenter(r.title, center)) {
              spreadsheetId = r.sId;
              spreadsheetTitle = r.title;
              break;
            }
          }
          if (!spreadsheetId) {
            spreadsheetId = candidateId || TIMETABLE_SHEET_IDS[0];
          }
        }
      }
    }
    try {
      const extraPayload = await fetchAllExtraClassLectures(sheets, forceRefresh);
      const matchingExtra = (extraPayload.classes || []).filter(
        (ec) => isBatchMatch(ec.batchCode, ec.facultyCode, batchCode) && (!ec.isPast || ec.isToday)
      );
      if (matchingExtra.length > 0) {
        const { now } = getIstDateInfo();
        for (const ec of matchingExtra) {
          const extraLecture = {
            day: ec.day || "Scheduled",
            lectureDate: ec.displayDate || ec.rawDate || "",
            startTime: ec.inTime || "",
            endTime: ec.outTime || "",
            timeRange: ec.timeRange || (ec.inTime && ec.outTime ? `${ec.inTime} - ${ec.outTime}` : "Extra Class"),
            batchFaculty: `${ec.batchCode} -/- ${ec.facultyCode || ec.teacherName || "Faculty"}`,
            batchCode: ec.batchCode,
            facultyCode: ec.facultyCode || "",
            subject: ec.subject || "Special Lecture",
            teacherEmail: ec.bmName || "",
            teacherName: ec.teacherName || "",
            room: ec.room || "",
            announcement: ec.announcement || "",
            isToday: !!ec.isToday,
            isExtraClass: true,
            status: computeLectureStatus(ec.inTime, ec.outTime, !!ec.isToday, now),
            rowIndex: ec.rowIndex
          };
          foundLectures.push(extraLecture);
        }
        if (!resolvedCenter && matchingExtra[0]?.center) {
          resolvedCenter = matchingExtra[0].center;
        }
        if (!spreadsheetTitle) {
          spreadsheetTitle = "Raw_DB & Extra Class Sheet";
        }
      }
    } catch (extraErr) {
      console.warn("Could not query extra class sheet for batch-schedule:", extraErr.message);
    }
    foundLectures = deduplicateLectures(foundLectures);
    const dayWeight = {
      MON: 1,
      TUE: 2,
      WED: 3,
      THU: 4,
      FRI: 5,
      SAT: 6,
      SUN: 7
    };
    foundLectures.sort((a, b) => {
      const aD = (a.day || "").trim().substring(0, 3).toUpperCase();
      const bD = (b.day || "").trim().substring(0, 3).toUpperCase();
      const wA = dayWeight[aD] || 99;
      const wB = dayWeight[bD] || 99;
      if (wA !== wB) return wA - wB;
      return (a.startTime || "").localeCompare(b.startTime || "");
    });
    const { dateStr: todayDate, dayStr: todayDay } = getIstDateInfo();
    const todayLectures = foundLectures.filter((l) => l.isToday);
    const daysSet = /* @__PURE__ */ new Set();
    foundLectures.forEach((l) => {
      if (l.day) daysSet.add(l.day);
    });
    res.json({
      center: resolvedCenter || center || "Pune Center",
      batchCode,
      spreadsheetId,
      spreadsheetTitle,
      todayDate,
      todayDay,
      todayLectures,
      allLectures: foundLectures,
      daysAvailable: Array.from(daysSet),
      totalWeeklyLectures: foundLectures.length
    });
  } catch (error) {
    console.error("API Error (batch-schedule):", error);
    res.status(error.message.includes("Authorization") ? 401 : 500).json({
      error: error.message || "Failed to fetch batch schedule from Raw_DB."
    });
  }
});
app.get("/api/timetable/mappings", async (req, res) => {
  try {
    const auth = getGoogleAuth(req);
    const sheets = google.sheets({ version: "v4", auth });
    const centers = req.query.centers?.split(",").filter(Boolean) || [];
    const sheetsMeta = await Promise.all(
      TIMETABLE_SHEET_IDS.map(async (sId) => {
        try {
          const { title } = await fetchRawDbWithCache(sheets, sId, false);
          return { sId, title };
        } catch {
          return { sId, title: sId };
        }
      })
    );
    for (const c of centers) {
      if (!centerTimetableMap[c] || centerTimetableMap[c].matchedConfidence === "unassigned") {
        const match = sheetsMeta.find((meta) => doesSheetTitleMatchCenter(meta.title, c));
        if (match) {
          centerTimetableMap[c] = {
            centerName: c,
            spreadsheetId: match.sId,
            spreadsheetTitle: match.title,
            hasRawDb: true,
            matchedConfidence: "high"
          };
        }
      }
    }
    res.json({
      mappings: centerTimetableMap,
      availableSheets: sheetsMeta
    });
  } catch (error) {
    console.error("API Error (timetable-mappings):", error);
    res.status(500).json({ error: error.message || "Failed to load timetable mappings." });
  }
});
app.post("/api/timetable/mappings", async (req, res) => {
  try {
    const { centerName, spreadsheetId, spreadsheetTitle } = req.body;
    if (!centerName || !spreadsheetId) {
      return res.status(400).json({ error: "centerName and spreadsheetId are required." });
    }
    centerTimetableMap[centerName] = {
      centerName,
      spreadsheetId,
      spreadsheetTitle: spreadsheetTitle || centerName,
      hasRawDb: true,
      matchedConfidence: "manual"
    };
    res.json({ success: true, mapping: centerTimetableMap[centerName] });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to update timetable mapping." });
  }
});
var customModuleCache = /* @__PURE__ */ new Map();
var CUSTOM_MODULE_MAP = {
  "extra-class": {
    id: "extra-class",
    title: "Extra Class",
    shortTitle: "Extra Class",
    spreadsheetId: "1f5HNSsjR_08dDDVvFoqrG40SaKdxhgbRnhD8cp7gY_4",
    gid: "15540423",
    badge: "Extra Class",
    description: "Special & Extra Lecture Schedules for Pune Batches"
  },
  "test-announcement": {
    id: "test-announcement",
    title: "Test Announcement",
    shortTitle: "Test Announcement",
    spreadsheetId: "1vDmONGVnul5yt-zHMdVBXkzP-FllP1KHXahpEw484TQ",
    gid: "1002186338",
    badge: "Announcements",
    description: "Upcoming Test Schedules, Dates & Syllabus for Pune Center"
  },
  "city-test": {
    id: "city-test",
    title: "City Test",
    shortTitle: "City Test",
    spreadsheetId: "14JW6teDhy6p4ToEMf053VGYBdDC8sWO7JV54uM8m9Kg",
    gid: "844497176",
    badge: "City Test",
    description: "City-Level Mock Tests, Venues & Batch Allocations"
  },
  "batch-overlook": {
    id: "batch-overlook",
    title: "Batch Overlook",
    shortTitle: "Batch Overlook",
    spreadsheetId: "1Z5Bt6ObwLO3rleW-NYOMvYXMwhrl4Gy7Nk3b-DhRPfY",
    targetSheetTitle: "Batch level - Overlook Sheet 2 ( Vidyapeeth )",
    gid: "1684539633",
    badge: "Overlook",
    description: "Batch Performance, Tracking, and High-Level Status Overview"
  },
  "mip-batches": {
    id: "mip-batches",
    title: "MIP Batches",
    shortTitle: "MIP Batches",
    spreadsheetId: "1W6u_PJSFcs5KjzfW05FCI2aOU2Xc9j_EhyEwIczpXek",
    gid: "529627573",
    badge: "MIP",
    description: "Most Important Program (MIP) Batches, Mentors & Allocations"
  },
  "audit-sheet": {
    id: "audit-sheet",
    title: "Audit Sheet",
    shortTitle: "Audit Sheet",
    spreadsheetId: "1ZXz1LySgzYL06gNbM7N8jCbnTOyVGiHQ0I596F-Sq_k",
    gid: "1232755258",
    badge: "Audit",
    description: "Academic & Content Audit for Pune Batches"
  }
};
app.get("/api/custom-modules/data", async (req, res) => {
  try {
    const moduleId = req.query.moduleId || "extra-class";
    const config = CUSTOM_MODULE_MAP[moduleId];
    if (!config) {
      return res.status(400).json({ error: `Invalid moduleId: ${moduleId}` });
    }
    const forceRefresh = req.query.refresh === "true";
    const cacheKey = `${moduleId}-${config.spreadsheetId}-${config.gid}`;
    const cached = customModuleCache.get(cacheKey);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < 3 * 60 * 1e3) {
      return res.json(cached.data);
    }
    const auth = getGoogleAuth(req);
    const sheets = google.sheets({ version: "v4", auth });
    const metaRes = await sheets.spreadsheets.get({
      spreadsheetId: config.spreadsheetId
    });
    const sheetsList = metaRes.data.sheets || [];
    let matchedSheet = null;
    if (config.targetSheetTitle) {
      const targetTitleLower = config.targetSheetTitle.toLowerCase().trim();
      matchedSheet = sheetsList.find((s) => {
        const t = (s.properties?.title || "").toLowerCase().trim();
        return t === targetTitleLower || t.includes(targetTitleLower) || targetTitleLower.includes(t);
      });
    }
    if (!matchedSheet && config.gid) {
      const targetGidNum = Number(config.gid);
      matchedSheet = sheetsList.find((s) => s.properties?.sheetId === targetGidNum);
    }
    if (!matchedSheet) {
      matchedSheet = sheetsList[0];
    }
    const sheetTitle = matchedSheet?.properties?.title || "Sheet1";
    const spreadsheetTitle = metaRes.data.properties?.title || config.title;
    const valuesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: `'${sheetTitle}'!A1:ZZ`
    });
    const rawRows = valuesRes.data.values || [];
    if (rawRows.length === 0) {
      return res.json({
        moduleId: config.id,
        title: config.title,
        spreadsheetId: config.spreadsheetId,
        gid: config.gid,
        sheetTitle,
        spreadsheetTitle,
        headers: [],
        rows: [],
        totalCount: 0
      });
    }
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const nonEmpty = rawRows[i].filter((c) => c !== void 0 && c !== null && String(c).trim() !== "");
      if (nonEmpty.length >= 2) {
        headerRowIndex = i;
        break;
      }
    }
    const rawHeaderRow = rawRows[headerRowIndex] || [];
    let lastHeaderCol = rawHeaderRow.length - 1;
    while (lastHeaderCol > 0 && !String(rawHeaderRow[lastHeaderCol] || "").trim()) {
      lastHeaderCol--;
    }
    const trimmedRawHeaders = rawHeaderRow.slice(0, Math.min(lastHeaderCol + 1, 50));
    const rawHeaders = trimmedRawHeaders.map((h, i) => {
      const val = String(h || "").trim();
      return val || `Col_${i + 1}`;
    });
    const seenHeaders = /* @__PURE__ */ new Set();
    const headers = rawHeaders.map((h) => {
      let uniqueH = h;
      let counter = 1;
      while (seenHeaders.has(uniqueH)) {
        uniqueH = `${h}_${counter++}`;
      }
      seenHeaders.add(uniqueH);
      return uniqueH;
    });
    const dataRows = [];
    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const rowArr = rawRows[r] || [];
      const isAllEmpty = rowArr.every((c) => c === void 0 || c === null || String(c).trim() === "");
      if (isAllEmpty) continue;
      const rowObj = {
        _rowIndex: String(r + 1)
      };
      headers.forEach((h, colIdx) => {
        rowObj[h] = String(rowArr[colIdx] ?? "").trim();
      });
      rowObj._rawText = Object.values(rowObj).slice(0, 10).join(" ");
      dataRows.push(rowObj);
    }
    const responsePayload = {
      moduleId: config.id,
      title: config.title,
      spreadsheetId: config.spreadsheetId,
      gid: config.gid,
      sheetTitle,
      spreadsheetTitle,
      headers,
      rows: dataRows,
      totalCount: dataRows.length
    };
    customModuleCache.set(cacheKey, {
      data: responsePayload,
      timestamp: Date.now()
    });
    res.json(responsePayload);
  } catch (err) {
    console.error("API Error (/api/custom-modules/data):", err);
    res.status(500).json({ error: err.message || "Failed to fetch custom module sheet data." });
  }
});
app.get("/api/extra-classes/schedule", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const auth = getGoogleAuth(req);
    const sheets = google.sheets({ version: "v4", auth });
    const payload = await fetchAllExtraClassLectures(sheets, forceRefresh);
    res.json(payload);
  } catch (err) {
    console.error("API Error (/api/extra-classes/schedule):", err);
    res.status(500).json({ error: err.message || "Failed to aggregate extra classes." });
  }
});
app.post("/api/extra-classes/mark-done", async (req, res) => {
  try {
    const { spreadsheetId, sheetTitle, rowIndex, statusColLetter, status } = req.body || {};
    if (!sheetTitle || !rowIndex) {
      return res.status(400).json({ error: "Missing sheetTitle or rowIndex" });
    }
    const auth = getGoogleAuth(req);
    const sheets = google.sheets({ version: "v4", auth });
    const targetSheetId = spreadsheetId || EXTRA_CLASS_SPREADSHEET_ID;
    const col = statusColLetter || "M";
    const range = `'${sheetTitle}'!${col}${rowIndex}`;
    const newStatus = status !== void 0 ? String(status) : "Done";
    await sheets.spreadsheets.values.update({
      spreadsheetId: targetSheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[newStatus]]
      }
    });
    extraClassCache.clear();
    res.json({
      success: true,
      updatedRange: range,
      sheetTitle,
      rowIndex,
      status: newStatus
    });
  } catch (err) {
    console.error("API Error (/api/extra-classes/mark-done):", err);
    res.status(500).json({ error: err.message || "Failed to mark extra class status in Google Sheets." });
  }
});
var AUDIT_SPREADSHEET_ID = "1ZXz1LySgzYL06gNbM7N8jCbnTOyVGiHQ0I596F-Sq_k";
var auditSheetCache = /* @__PURE__ */ new Map();
function isPuneBranch(branch) {
  if (!branch) return false;
  const b = branch.toLowerCase().trim().replace(/[^a-z0-9]/g, " ");
  const puneKeywords = [
    "pcmc",
    "pimpri",
    "hadapsar",
    "viman",
    "vimannagar",
    "fc",
    "fcroad",
    "fergusson",
    "kothrud",
    "kothurd",
    "tc",
    "tuition",
    "pune"
  ];
  const tokens = b.split(/\s+/).filter(Boolean);
  return puneKeywords.some((kw) => b.includes(kw) || tokens.includes(kw));
}
function normalizePuneBranchName(branch) {
  const b = (branch || "").trim();
  const lower = b.toLowerCase();
  if (lower.includes("pcmc") || lower.includes("pimpri")) return "PCMC VP";
  if (lower.includes("hadapsar")) return "HADAPSAR";
  if (lower.includes("viman")) return "VIMAN NAGAR VP";
  if (lower.includes("fc") || lower.includes("fergusson")) return "FC ROAD";
  if (lower.includes("kothrud") || lower.includes("kothurd")) return "KOTHRUD";
  if (lower.includes("tc") || lower.includes("tuition")) return "TC";
  return b || "Pune Center";
}
app.get("/api/audit-sheet", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const cacheKey = `audit-sheet-${AUDIT_SPREADSHEET_ID}`;
    const cached = auditSheetCache.get(cacheKey);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < 3 * 60 * 1e3) {
      return res.json(cached.data);
    }
    const auth = getGoogleAuth(req);
    const sheets = google.sheets({ version: "v4", auth });
    const metaRes = await sheets.spreadsheets.get({
      spreadsheetId: AUDIT_SPREADSHEET_ID
    });
    const allSheets = metaRes.data.sheets || [];
    const spreadsheetTitle = metaRes.data.properties?.title || "Audit Sheet";
    const TARGET_SUBSHEETS = ["pendency", "topic", "video", "notes", "content", "teacher"];
    const matchedSheets = allSheets.filter((s) => {
      const title = (s.properties?.title || "").trim().toLowerCase();
      return TARGET_SUBSHEETS.some((target) => title.includes(target));
    });
    const sheetsToQuery = matchedSheets.length > 0 ? matchedSheets : allSheets.slice(0, 8);
    const sheetDataResults = await Promise.all(
      sheetsToQuery.map(async (sheet) => {
        const sheetTitle = sheet.properties?.title || "Sheet1";
        try {
          const valRes = await sheets.spreadsheets.values.get({
            spreadsheetId: AUDIT_SPREADSHEET_ID,
            range: `'${sheetTitle}'!A1:ZZ`
          });
          return {
            sheetTitle,
            rows: valRes.data.values || []
          };
        } catch (err) {
          console.warn(`[Audit Sheet] Error fetching sheet '${sheetTitle}':`, err.message);
          return { sheetTitle, rows: [] };
        }
      })
    );
    const allPuneRecords = [];
    const branchesSet = /* @__PURE__ */ new Set();
    const subsheetsFound = [];
    for (const { sheetTitle, rows } of sheetDataResults) {
      if (!rows || rows.length < 2) continue;
      subsheetsFound.push(sheetTitle);
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const nonEmpty = (rows[i] || []).filter((c) => String(c || "").trim() !== "");
        if (nonEmpty.length >= 2) {
          headerRowIndex = i;
          break;
        }
      }
      const headerRow = (rows[headerRowIndex] || []).map((h) => String(h || "").trim());
      const headersLower = headerRow.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, " "));
      let branchIdx = -1;
      let batchIdx = -1;
      let subjectIdx = -1;
      let timeIdx = -1;
      let bmIdx = -1;
      let errorIdx = -1;
      headersLower.forEach((h, idx) => {
        if (branchIdx === -1 && (h.includes("branch") || h.includes("center") || h.includes("centre") || h.includes("location"))) {
          branchIdx = idx;
        } else if (batchIdx === -1 && (h.includes("batch name") || h.includes("batch_name") || h.includes("batch code") || h.includes("batch") && !h.includes("manager"))) {
          batchIdx = idx;
        } else if (subjectIdx === -1 && (h.includes("subject name") || h.includes("subject_name") || h.includes("subject") || h === "sub")) {
          subjectIdx = idx;
        } else if (timeIdx === -1 && (h.includes("lec start time") || h.includes("lec_start") || h.includes("start time") || h.includes("lecture time") || h.includes("in time") || h === "time" || h.includes("slot"))) {
          timeIdx = idx;
        } else if (bmIdx === -1 && (h.includes("final bm") || h.includes("final_bm") || h.includes("batch manager") || h === "bm" || h.includes("bm name") || h.includes("manager"))) {
          bmIdx = idx;
        } else if (errorIdx === -1 && (h.includes("error") || h.includes("errors") || h.includes("remarks") || h.includes("issue") || h.includes("pendency") || h.includes("status"))) {
          errorIdx = idx;
        }
      });
      if (branchIdx === -1) branchIdx = 0;
      if (batchIdx === -1) batchIdx = 1;
      if (subjectIdx === -1) subjectIdx = 2;
      for (let r = headerRowIndex + 1; r < rows.length; r++) {
        const row = rows[r] || [];
        if (row.length === 0) continue;
        const rawBranch = String(row[branchIdx] || "").trim();
        const rawBatch = String(row[batchIdx] || "").trim();
        if (!rawBranch && !rawBatch) continue;
        if (rawBranch.toLowerCase().includes("branch") && rawBatch.toLowerCase().includes("batch")) continue;
        if (!isPuneBranch(rawBranch)) {
          continue;
        }
        const normalizedBranch = normalizePuneBranchName(rawBranch);
        branchesSet.add(normalizedBranch);
        const rawSubject = subjectIdx >= 0 ? String(row[subjectIdx] || "").trim() : "";
        const rawTime = timeIdx >= 0 ? String(row[timeIdx] || "").trim() : "";
        const rawBm = bmIdx >= 0 ? String(row[bmIdx] || "").trim() : "";
        const rawError = errorIdx >= 0 ? String(row[errorIdx] || "").trim() : "";
        const hasError = !!rawError && !["no", "none", "nil", "ok", "clean", "done", "na", "n/a", "-", "false", "true"].includes(rawError.toLowerCase());
        const rawRowObj = {};
        headerRow.forEach((colHeader, colIdx) => {
          const key = colHeader || `Column_${colIdx + 1}`;
          rawRowObj[key] = String(row[colIdx] || "").trim();
        });
        allPuneRecords.push({
          id: `${sheetTitle}_${r + 1}`,
          subsheet: sheetTitle,
          branch: normalizedBranch,
          batchName: rawBatch,
          subjectName: rawSubject,
          lecStartTime: rawTime,
          finalBm: rawBm,
          errors: rawError,
          hasError,
          rowIndex: r + 1,
          rawRow: rawRowObj
        });
      }
    }
    const totalPuneCount = allPuneRecords.length;
    const errorCount = allPuneRecords.filter((r) => r.hasError).length;
    const payload = {
      spreadsheetId: AUDIT_SPREADSHEET_ID,
      spreadsheetTitle,
      subsheets: subsheetsFound,
      totalPuneCount,
      errorCount,
      branches: Array.from(branchesSet).sort(),
      records: allPuneRecords
    };
    auditSheetCache.set(cacheKey, {
      data: payload,
      timestamp: Date.now()
    });
    res.json(payload);
  } catch (err) {
    console.error("API Error (/api/audit-sheet):", err);
    res.status(500).json({ error: err.message || "Failed to fetch audit sheet data." });
  }
});
app.post("/api/ai/explain", async (req, res) => {
  const { batchCode, tabName, category, phase, timeSlot, bmEmail, todayLectures, allLectures } = req.body || {};
  if (!batchCode) {
    return res.status(400).json({ error: "Batch Code is required" });
  }
  const { dateStr: todayDate, dayStr: todayDay } = getIstDateInfo();
  let scheduleContext = "";
  if (Array.isArray(todayLectures) && todayLectures.length > 0) {
    scheduleContext = `
### \u{1F4C5} TODAY'S LECTURES (${todayDay}, ${todayDate} from ${tabName || "Center"} 'Raw_DB'):
` + todayLectures.map(
      (l, i) => `- **Lecture ${i + 1} (${l.timeRange || `${l.startTime} - ${l.endTime}`})**: Subject: **${l.subject || "Subject TBD"}** | Faculty: **${l.facultyCode || "TBD"}** | Teacher Email: **${l.teacherEmail || "Not Listed"}**`
    ).join("\n");
  } else if (Array.isArray(allLectures) && allLectures.length > 0) {
    scheduleContext = `
### \u{1F4C5} WEEKLY TIMETABLE OVERVIEW (from ${tabName || "Center"} 'Raw_DB'):
No lectures scheduled for today (${todayDay}, ${todayDate}). Total lectures scheduled this week: ${allLectures.length}.
Upcoming scheduled classes:
` + allLectures.slice(0, 4).map(
      (l, i) => `- ${l.day} (${l.timeRange || `${l.startTime} - ${l.endTime}`}): Subject: **${l.subject || "General"}** | Faculty: **${l.facultyCode || "TBD"}** | Email: **${l.teacherEmail || "N/A"}**`
    ).join("\n");
  } else {
    scheduleContext = `
*(Note: No live timetable rows found for ${batchCode} in ${tabName || "Center"} 'Raw_DB' subsheet.)*`;
  }
  const fallbackText = `### \u{1F4CB} Batch Details: **${batchCode}**
      
*   **Active Center / Tab:** ${tabName || "General Center"}
*   **Target Stream:** ${category || "General Studies"}
*   **Phase:** ${phase || "Standard Phase"}
*   **Timing Shift:** ${timeSlot || "Not specified"}
*   **Manager Assigned:** ${bmEmail || "No Manager Assigned"}

${scheduleContext}

#### \u{1F50D} Academic Breakdown:
- **Class / Level:** ${batchCode.includes("LJ") || batchCode.includes("LN") ? "Lakshya Series (Grade 12 / Board + Competitive Prep)" : batchCode.includes("AJ") || batchCode.includes("AN") ? "Arjuna Series (Grade 11 / Advanced Foundation)" : batchCode.includes("Y") ? "Yakeen Series (Dropper / Dedicated Repeater)" : "Specialized Program"}
- **Shifts & Timings:** ${timeSlot === "Morning" ? "Morning Shift (MA/MP)" : timeSlot === "Afternoon" ? "Afternoon Shift (NA/NP)" : timeSlot === "Evening" ? "Evening Shift (EA/EP)" : timeSlot === "Weekend" ? "Weekend Batch (WA)" : "Standard Schedule"}

#### \u{1F4C5} Timetable Summary:
- Live classes, subjects, and teacher emails are extracted directly from Raw_DB above.`;
  const openRouterKey = (process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || "").trim();
  if (!openRouterKey) {
    return res.json({ explanation: fallbackText });
  }
  try {
    const prompt = `You are "Batch Finder Pro AI Copilot" - an expert assistant for Physics Wallah (PW) offline centers in India.
Your task is to decode this specific batch code: "${batchCode}".

CRITICAL LANGUAGE REQUIREMENT: All responses, briefings, action checklists, and WhatsApp messages MUST be strictly in 100% professional English. Never output Hindi, Hinglish, or Devanagari script under any circumstances, regardless of the language used by the user in their prompt.

Context details provided:
- Active Center / Tab: "${tabName || "Unknown"}"
- Stream Category: "${category || "Unknown"}"
- Phase Match: "${phase || "Unknown"}"
- Shift Timing: "${timeSlot || "Unknown"}"
- Assigned Batch Manager (BM): "${bmEmail || "None"}"
- Today's Date & Day: "${todayDay}, ${todayDate}"

LIVE TIMETABLE DATA FROM 'Raw_DB' (Column AI = Subject, Column AK = Teacher Email):
${scheduleContext}

Please provide a highly polished, professional, and actionable academic briefing in Markdown (STRICTLY IN ENGLISH ONLY):

1. **\u{1F4C5} Today's Live Academic Schedule & Subject Flow**:
   - Clearly detail today's classes: subject (from Column AI), lecture timing, faculty code, and teacher's email (from Column AK).
   - If no lectures are scheduled today, highlight when the next class is and summarize the weekly schedule.
2. **\u{1F4A1} Batch Academic Level & Phase**:
   - Identify grade/class (e.g., Arjuna = 11th, Lakshya = 12th, Yakeen = Droppers, Foundation = 9th/10th), target exam (JEE / NEET / Boards), and phase milestone.
3. **\u{1F4CB} Batch Manager Action Checklist for Today**:
   - Provide 2-3 specific, tactical steps for ${bmEmail || "the BM"} for today's classes (e.g. verifying attendance, confirming room prep with faculty, ensuring DPP distribution).
4. **\u{1F4AC} Student Daily Reminder Draft (WhatsApp format)**:
   - Provide a concise, ready-to-copy WhatsApp message for students mentioning today's lecture times and subjects in clear English.

Keep the output clean, encouraging, professional, strictly in English, and under 400 words.`;
    if (openRouterKey.startsWith("sk-or-v1-")) {
      const candidateModels = [
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwen-2.5-72b-instruct:free",
        "mistralai/mistral-7b-instruct:free"
      ];
      for (const candidateModel of candidateModels) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Authorization": `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://pune-batches.vercel.app",
              "X-Title": "Pune Batches Copilot"
            },
            body: JSON.stringify({
              model: candidateModel,
              messages: [{ role: "user", content: prompt }]
            })
          });
          clearTimeout(timeoutId);
          if (orRes.ok) {
            const data = await orRes.json();
            const text = data.choices?.[0]?.message?.content;
            if (text) return res.json({ explanation: text });
          }
        } catch {
        }
      }
      return res.json({ explanation: fallbackText });
    }
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    res.json({ explanation: response.text || fallbackText });
  } catch (error) {
    console.warn("AI Copilot fallback applied:", error.message);
    res.json({ explanation: fallbackText });
  }
});
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history, contextBatch, todayLectures } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    let scheduleText = "";
    if (Array.isArray(todayLectures) && todayLectures.length > 0) {
      scheduleText = " Today's Scheduled Lectures (from Raw_DB): " + todayLectures.map((l) => `${l.timeRange || l.startTime}: Subject: ${l.subject || "General"} | Faculty: ${l.facultyCode} | Email: ${l.teacherEmail}`).join("; ");
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        reply: `I am currently running in Offline mode. Please configure your \`GEMINI_API_KEY\` in **Settings > Secrets** to enable full conversation reasoning and tactical batch planning!

${scheduleText ? `\u{1F4C5} **Live Schedule Context:**
${scheduleText}

` : ""}Here is a quick static tip: Keep your Google Drive folders organized by subject (Physics, Chemistry, Math/Biology) and create a separate folder for "DPP Solutions" to minimize student queries!`
      });
    }
    const openRouterKey = (process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || "").trim();
    if (openRouterKey.startsWith("sk-or-v1-")) {
      const systemPrompt = `You are "Batch Finder Pro AI Copilot", a brilliant academic coordinator and counselor for Physics Wallah (PW) centers. Help the Batch Manager with operational issues, student messaging, organizing Drive files, and answering center-related questions. You have live access to the center timetable from Raw_DB. Keep answers clear, tactical, and brief (under 200 words).
CRITICAL LANGUAGE POLICY: All responses, briefings, action checklists, recommendations, and messages MUST be strictly in 100% professional English. Under no circumstances should you output Hindi, Hinglish, or Devanagari script, even if the user prompts you in Hindi or Hinglish.${contextBatch ? `

Context: The user is currently viewing batch "${contextBatch.displayName}" (Category: ${contextBatch.category}, Phase: ${contextBatch.phase}, Shift: ${contextBatch.timeSlot}, Manager Assigned: ${contextBatch.bmEmail || "None"}).${scheduleText}` : ""}`;
      const openRouterMessages = [
        { role: "system", content: systemPrompt }
      ];
      if (Array.isArray(history)) {
        history.forEach((turn) => {
          if (turn.role && turn.text) {
            openRouterMessages.push({
              role: turn.role === "user" ? "user" : "assistant",
              content: turn.text
            });
          }
        });
      }
      openRouterMessages.push({
        role: "user",
        content: message
      });
      const candidateModels = [
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwen-2.5-72b-instruct:free",
        "mistralai/mistral-7b-instruct:free"
      ];
      let openRouterReply = "";
      for (const candidateModel of candidateModels) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Authorization": `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://pune-batches.vercel.app",
              "X-Title": "Pune Batches Copilot"
            },
            body: JSON.stringify({
              model: candidateModel,
              messages: openRouterMessages
            })
          });
          clearTimeout(timeoutId);
          if (orRes.ok) {
            const data = await orRes.json();
            openRouterReply = data.choices?.[0]?.message?.content || "";
            if (openRouterReply) break;
          }
        } catch (mErr) {
          console.warn(`OpenRouter model ${candidateModel} failed:`, mErr);
        }
      }
      if (openRouterReply) {
        return res.json({ reply: openRouterReply });
      } else {
        return res.json({
          reply: `(Offline AI Copilot) Here is a quick academic tip for **${contextBatch?.displayName || "this batch"}**:

${scheduleText ? `\u{1F4C5} **Schedule Context:** ${scheduleText}

` : ""}Ensure all lecture study materials, handouts, and DPP keys are uploaded to the corresponding subject drive folder to keep students aligned.`
        });
      }
    }
    const formattedContents = [];
    formattedContents.push({
      role: "user",
      parts: [{ text: `System Command: You are "Batch Finder Pro AI Copilot", a brilliant academic coordinator and counselor for Physics Wallah (PW) centers. Help the Batch Manager with operational issues, student messaging, organizing Drive files, and answering center-related questions. You have live access to the center timetable from Raw_DB. Keep answers clear, tactical, and brief (under 200 words). CRITICAL LANGUAGE POLICY: All responses, briefings, action checklists, recommendations, and messages MUST be strictly in 100% professional English. Never output Hindi, Hinglish, or Devanagari script under any circumstances, even if asked in Hindi or Hinglish.` }]
    });
    formattedContents.push({
      role: "model",
      parts: [{ text: "Understood. I will strictly provide all answers, briefings, and communications exclusively in 100% professional English." }]
    });
    if (contextBatch) {
      formattedContents.push({
        role: "user",
        parts: [{ text: `Context: The user is currently viewing batch "${contextBatch.displayName}" (Category: ${contextBatch.category}, Phase: ${contextBatch.phase}, Shift: ${contextBatch.timeSlot}, Manager Assigned: ${contextBatch.bmEmail || "None"}).${scheduleText}` }]
      });
      formattedContents.push({
        role: "model",
        parts: [{ text: `Acknowledged. I have cached the details and timetable for ${contextBatch.displayName} and will answer with this batch and schedule context in mind.` }]
      });
    }
    if (Array.isArray(history)) {
      history.forEach((turn) => {
        if (turn.role && turn.text) {
          formattedContents.push({
            role: turn.role === "user" ? "user" : "model",
            parts: [{ text: turn.text }]
          });
        }
      });
    }
    formattedContents.push({
      role: "user",
      parts: [{ text: message }]
    });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedContents
    });
    res.json({ reply: response.text || "I am here to help, but couldn't generate a reply. Please try again." });
  } catch (error) {
    console.warn("AI Chat fallback applied:", error.message);
    res.json({
      reply: `I am currently operating in offline mode. Please verify the batch timetable schedule above, and feel free to copy lecture details or draft messages!`
    });
  }
});
async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vitePkg = "vite";
    const { createServer: createViteServer } = await import(vitePkg);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  if (!process.env.VERCEL) {
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE" && !process.env.PORT) {
        const fallbackPort = PORT + 1;
        console.warn(`Port ${PORT} is in use, falling back to port ${fallbackPort}...`);
        app.listen(fallbackPort, "0.0.0.0", () => {
          console.log(`Server running on port ${fallbackPort}`);
        });
      } else {
        console.error("Server error:", err);
      }
    });
  }
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
export {
  app,
  server_default as default
};
