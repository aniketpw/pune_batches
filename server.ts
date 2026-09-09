import express from "express";
import path from "path";
import { google } from "googleapis";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { SEED_BM_MAP } from "./src/seedBmMap.ts";

dotenv.config({ path: [".env.local", ".env"] });

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export const app = express();

app.use(express.json());

// Handle Vercel serverless URL rewrites so Express routes match req.originalUrl
app.use((req, _res, next) => {
  if (req.originalUrl && req.url !== req.originalUrl) {
    req.url = req.originalUrl;
  }
  next();
});

  // API Route Helper: Extract and validate Google OAuth token
  const getGoogleAuth = (req: express.Request) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Missing or invalid Authorization header");
    }
    const token = authHeader.split(" ")[1];
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });
    return oauth2Client;
  };

  // Helper functions for batch parsing
  function indexToColLetter(index: number): string {
    let temp = index;
    let letter = "";
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  }

  function extractCode(batchName: string): string {
    let raw = (batchName || "").toString().trim().toUpperCase();
    const parts = raw.split("-");
    if (parts.length > 1) raw = parts[1].trim();

    raw = raw.replace(/\s*20\d{2}\s*$/i, "");
    raw = raw.replace(/[^A-Z0-9]/g, "");
    return raw;
  }

  function getCategory(batchName: string): "JEE" | "NEET" | "Foundation" | "Other" {
    const code = extractCode(batchName);
    const prefix = code.substring(0, 2);

    if (["LJ", "AJ", "PJ"].includes(prefix)) return "JEE";
    if (["LN", "AN", "YN", "YA"].includes(prefix)) return "NEET";
    if (["UF", "NF", "UP"].includes(prefix)) return "Foundation";
    return "Other";
  }

  function getPhase(batchName: string): string {
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

  function getTimeSlot(batchName: string): string {
    const code = extractCode(batchName);
    if (code.length < 2) return "";

    const suffix = code.substring(code.length - 2);
    if (["MA", "MP"].includes(suffix)) return "Morning";
    if (["NA", "NP"].includes(suffix)) return "Afternoon";
    if (["EA", "EP"].includes(suffix)) return "Evening";
    if (suffix === "WA") return "Weekend";
    return "";
  }

  // 9 Center Timetable Google Spreadsheets provided by the user
  const TIMETABLE_SHEET_IDS = [
    "1U5BGET6T_6vzFdEj1BrktFyeKAUNM3le-d6_QXX3IdE",
    "1YRDNMMvsCO8zBzfWP2JA__ewJZqyb8oIUBG8n3evps8",
    "1aUGmqbnCdVIXrmRXwHTItUN6kKTmk0UFuFi5D172NC4",
    "1qsgnhF3JTHPJKYSf19uSj5xtivxIDib1CnwSj-kSioE",
    "1PnpJ7N0VGyn093T3DGxg5DY7RgcEw1sjvJh7ZWhRw20",
    "103nQ5mxTrQFu8fQgppgzQIkOhbIrrY4VN5s3WpFx4p4",
    "1JtBcMmkNwnt2hqNgIEBGwNlcdEN4YziQYAN4j6q3GE0",
    "1KbI77PEFsxFqFB1ElUQlqSxz9ixTBevxt7wJPNI8FFU",
    "1po8VrTl5DXXwxcJN_evxQRn_5S4oNcxnbObQ5rd2K0w",
  ];

  interface CenterTimetableInfo {
    centerName: string;
    spreadsheetId: string;
    spreadsheetTitle?: string;
    hasRawDb?: boolean;
    sampleBatches?: string[];
    matchedConfidence?: "exact" | "high" | "manual" | "unassigned";
  }

  // In-memory mapping of Center Workspaces to Timetable Spreadsheets
  const centerTimetableMap: Record<string, CenterTimetableInfo> = {};

  function colLetterToIndex(col: string): number {
    let result = 0;
    for (let i = 0; i < col.length; i++) {
      result = result * 26 + (col.charCodeAt(i) - 64);
    }
    return result - 1;
  }

  function getIstDateInfo() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      weekday: "short",
    }).formatToParts(now);

    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";
    const day = getPart("day");
    const month = getPart("month");
    const year = getPart("year");
    const weekday = getPart("weekday");

    const dateStr = `${day}-${month}-${year}`; // e.g. "08-Sep-2026"
    return { dateStr, dayStr: weekday, now };
  }

  function parseTimeString(timeStr: string, baseDate: Date): Date | null {
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

  function computeLectureStatus(startTimeStr: string, endTimeStr: string, isToday: boolean, now: Date): "upcoming" | "ongoing" | "completed" {
    if (!isToday) return "upcoming";
    try {
      const start = parseTimeString(startTimeStr, now);
      const end = parseTimeString(endTimeStr, now);
      if (!start || !end) return "upcoming";
      if (now < start) return "upcoming";
      if (now >= start && now <= end) return "ongoing";
      if (now > end) return "completed";
    } catch {}
    return "upcoming";
  }

  // Cache for Raw_DB rows & titles (5-minute TTL)
  interface CachedRawDb {
    spreadsheetId: string;
    title: string;
    rows: any[][];
    timestamp: number;
  }
  const rawDbCache = new Map<string, CachedRawDb>();
  const RAW_DB_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL
  const spreadsheetTitleCache = new Map<string, string>();

  async function fetchRawDbWithCache(
    sheets: any,
    spreadsheetId: string,
    forceRefresh = false
  ): Promise<{ title: string; rows: any[][] }> {
    const cached = rawDbCache.get(spreadsheetId);
    if (!forceRefresh && cached && cached.rows && cached.rows.length > 0 && Date.now() - cached.timestamp < RAW_DB_CACHE_TTL_MS) {
      return { title: cached.title, rows: cached.rows };
    }

    const knownTitle = cached?.title || spreadsheetTitleCache.get(spreadsheetId);
    let spreadsheetTitle = knownTitle || spreadsheetId;
    let targetSheetTitle = "Raw_DB";

    // Fetch spreadsheet metadata to dynamically find the exact Raw_DB tab name
    try {
      const metaRes = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: "properties.title,sheets.properties(sheetId,title)",
      });
      if (metaRes.data?.properties?.title) {
        spreadsheetTitle = metaRes.data.properties.title;
        spreadsheetTitleCache.set(spreadsheetId, spreadsheetTitle);
      }
      const sheetsList = metaRes.data?.sheets || [];
      if (sheetsList.length > 0) {
        // Priority 1: Match tab explicitly named Raw_DB (case-insensitive, with underscore or space)
        const matchTab = sheetsList.find((s: any) => {
          const t = (s.properties?.title || "").trim().toLowerCase();
          return t === "raw_db" || t === "raw db" || t.includes("raw_db") || t.includes("raw db") || t.includes("raw-db");
        });
        if (matchTab?.properties?.title) {
          targetSheetTitle = matchTab.properties.title;
        } else {
          // Priority 2: Match tab named Current Week Time Table, Time Table, or Schedule
          const ttTab = sheetsList.find((s: any) => {
            const t = (s.properties?.title || "").trim().toLowerCase();
            return (
              t.includes("current week") ||
              (t.includes("time") && t.includes("table")) ||
              t.includes("timetable") ||
              t.includes("schedule")
            );
          });
          if (ttTab?.properties?.title) {
            targetSheetTitle = ttTab.properties.title;
          } else if (sheetsList[0]?.properties?.title) {
            targetSheetTitle = sheetsList[0].properties.title;
          }
        }
      }
    } catch (metaErr: any) {
      console.warn(`Could not get metadata for ${spreadsheetId}:`, metaErr.message);
    }

    // Fetch all rows in columns A to AZ (ensures Subject and Teacher Email in Col AI/AK are never truncated)
    let rows: any[][] = [];
    try {
      const valuesRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${targetSheetTitle}'!A:AZ`,
      });
      rows = valuesRes.data?.values || [];
    } catch (valErr: any) {
      console.warn(`Failed to fetch '${targetSheetTitle}'!A:AZ for ${spreadsheetId}:`, valErr.message);
      try {
        const fallbackRes = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `'${targetSheetTitle}'!A1:AZ5000`,
        });
        rows = fallbackRes.data?.values || [];
      } catch (fbErr: any) {
        console.warn(`Fallback range also failed for ${spreadsheetId}:`, fbErr.message);
        if (cached && cached.rows && cached.rows.length > 0) {
          console.log(`[Raw_DB] Returning cached rows for ${spreadsheetId} due to API error.`);
          return { title: cached.title, rows: cached.rows };
        }
      }
    }

    // ONLY cache if rows were actually retrieved (so errors never poison cache)
    if (rows && rows.length > 0) {
      rawDbCache.set(spreadsheetId, {
        spreadsheetId,
        title: spreadsheetTitle,
        rows,
        timestamp: Date.now(),
      });
    }

    return { title: spreadsheetTitle, rows };
  }

  function getCenterKeywords(name: string): string[] {
    const clean = (name || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ");
    const tokens = clean.split(/\s+/).filter((t) => t.length > 1);
    const keywords = new Set<string>(tokens);

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

  function doesSheetTitleMatchCenter(sheetTitle: string, centerName: string): boolean {
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

  function normalizeDateStr(dateStr: string): string {
    if (!dateStr) return "";
    let s = dateStr.trim().toUpperCase().replace(/[\/\.]/g, "-");
    s = s.replace(/\b0([1-9])\b/g, "$1");
    return s;
  }

  function isDateOrDayMatchingToday(
    rowDate: string,
    rowDay: string,
    todayDateStr: string,
    todayDayStr: string,
    nowIst: Date
  ): boolean {
    const normRowDate = normalizeDateStr(rowDate);
    const normToday = normalizeDateStr(todayDateStr);
    const normRowDay = (rowDay || "").trim().toUpperCase().substring(0, 3);
    const normTodayDay = (todayDayStr || "").trim().toUpperCase().substring(0, 3);

    // 1. If row has an explicit date, compare against today's date
    if (normRowDate && normToday) {
      if (normRowDate === normToday || normRowDate.includes(normToday) || normToday.includes(normRowDate)) {
        return true;
      }
      try {
        const parsed = new Date(rowDate);
        if (!isNaN(parsed.getTime())) {
          if (
            parsed.getDate() === nowIst.getDate() &&
            parsed.getMonth() === nowIst.getMonth() &&
            parsed.getFullYear() === nowIst.getFullYear()
          ) {
            return true;
          }
        }
      } catch {}
      // Explicit date is present and does NOT match today -> It is an old past or future date!
      return false;
    }

    // 2. Only if NO date is given in the row, match by recurring Day-of-Week (e.g. WED matches WED)
    if (normRowDay && normTodayDay && normRowDay === normTodayDay) {
      return true;
    }

    return false;
  }

  function cleanBatchKey(str: string): string {
    return (str || "")
      .toUpperCase()
      .replace(/VIDYAPEETH/g, "")
      .replace(/TUITION/g, "")
      .replace(/SIP/g, "")
      .replace(/\b20\d{2}\b/g, "")
      .replace(/\(\d+\)/g, "")
      .replace(/[^A-Z0-9]/g, "");
  }

  function extractCoreAlphanumeric(str: string): string {
    const clean = cleanBatchKey(str);
    const match = clean.match(/[A-Z]{2,4}\d{2,3}[A-Z]{2}/);
    if (match) return match[0];
    const matchGeneral = clean.match(/[A-Z0-9]{5,8}/);
    if (matchGeneral) return matchGeneral[0];
    return clean;
  }

  function extractCoreBatchCode(str: string): string {
    if (!str) return "";
    const clean = (str || "").toUpperCase();
    const m = clean.match(/\b(?:27-|S98-)?([A-Z]{2,4}\d{2,3}[A-Z0-9]{2,4})\b/);
    if (m) return m[1];
    const m2 = clean.match(/([A-Z]{2}\d{3}[A-Z]{2})/);
    if (m2) return m2[1];
    return clean.replace(/[^A-Z0-9]/g, "");
  }

  function isBatchMatch(rowBatch: string, rowBatchFaculty: string, targetBatch: string): boolean {
    if (!targetBatch) return false;

    const targetCore = extractCoreBatchCode(targetBatch);
    const rowBatchCore = extractCoreBatchCode(rowBatch);
    const rowFacultyCore = extractCoreBatchCode(rowBatchFaculty);

    // Exact core match (e.g. LJE51MP === LJE51MP, AJ253MA === AJ253MA)
    if (targetCore && rowBatchCore && targetCore === rowBatchCore) return true;
    if (targetCore && rowFacultyCore && targetCore === rowFacultyCore) return true;

    // Exact cleaned string match (no loose endsWith substring leakage)
    const targetClean = cleanBatchKey(targetBatch);
    const rowBatchClean = cleanBatchKey(rowBatch);
    if (targetClean && rowBatchClean && targetClean === rowBatchClean) return true;

    return false;
  }

  function getTeacherNameFromEmail(email: string): string {
    if (!email || !email.includes("@")) return "";
    const prefix = email.split("@")[0].replace(/\d+$/, "");
    const parts = prefix.split(/[._-]/).filter(Boolean);
    if (parts.length === 0) return "";
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
  }

  function parseRawDbRows(rows: any[][]): any[] {
    if (!rows || rows.length < 2) return [];

    let headerRowIdx = 0;
    for (let r = 0; r < Math.min(rows.length, 5); r++) {
      const rCells = (rows[r] || []).map((c: any) => (c || "").toString().trim().toLowerCase());
      const hasDay = rCells.some((c: string) => c === "day" || c.includes("day"));
      const hasDateOrBatch = rCells.some((c: string) => c.includes("date") || c.includes("batch") || c.includes("start") || c.includes("time"));
      if (hasDay && hasDateOrBatch) {
        headerRowIdx = r;
        break;
      }
    }

    const headerRow = rows[headerRowIdx] || [];

    let dayIdx = 0;           // Col A
    let dateIdx = 1;          // Col B
    let startIdx = 2;         // Col C
    let endIdx = 3;           // Col D
    let batchFacultyIdx = 4;  // Col E
    let timeIdx = 7;          // Col H
    let batchCodeIdx = 8;     // Col I
    let facultyCodeIdx = 9;   // Col J
    let subjectIdx = 34;      // Col AI (0-indexed 34 is 35th column)
    let teacherEmailIdx = 36;  // Col AK (0-indexed 36 is 37th column)

    // Current Week headers: check columns 0 to 15
    for (let idx = 0; idx <= 15 && idx < headerRow.length; idx++) {
      const val = headerRow[idx];
      const h = (val || "").toString().trim().toLowerCase();
      if (h === "day" || h.includes("day of week")) dayIdx = idx;
      else if (h.includes("date") || h.includes("lecture date")) dateIdx = idx;
      else if (h.includes("start time") || h === "start" || h.includes("in time")) startIdx = idx;
      else if (h.includes("end time") || h === "end" || h.includes("out time")) endIdx = idx;
      else if (h.includes("batch & faculty") || h.includes("faculty & batch") || h.includes("batch & fac") || h.includes("batch/fac")) batchFacultyIdx = idx;
      else if (h === "time" || h === "time range") timeIdx = idx;
      else if (h === "batch code" || h === "batch" || h === "batch name" || (h.includes("batch") && !h.includes("&") && !h.includes("faculty"))) batchCodeIdx = idx;
      else if (h === "faculty code" || (h.includes("faculty") && !h.includes("&") && !h.includes("batch"))) facultyCodeIdx = idx;
    }

    // Subject and Teacher Email can be in Columns Y to AL (defaults: Col AI = 34, Col AK = 36)
    for (let idx = 12; idx < headerRow.length; idx++) {
      const val = headerRow[idx];
      const h = (val || "").toString().trim().toLowerCase();
      if (h.includes("subject")) subjectIdx = idx;
      else if (h.includes("teacher email") || h.includes("faculty email") || h.includes("email") || h.includes("teacher")) teacherEmailIdx = idx;
    }

    const { dateStr: todayDate, dayStr: todayDay, now } = getIstDateInfo();
    const result: any[] = [];

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i] || [];
      let batchCode = (row[batchCodeIdx] || "").toString().trim();
      let batchFaculty = (row[batchFacultyIdx] || "").toString().trim();

      // Fallback: if both batchCode and batchFaculty are empty, inspect cells in columns 0 to 11
      if (!batchCode && !batchFaculty) {
        for (let c = 0; c <= 11 && c < row.length; c++) {
          const val = (row[c] || "").toString().trim();
          if (val.match(/(?:27-|S98-|\b)[A-Z]{2,4}\d{2,3}[A-Z0-9]{2,4}/i)) {
            batchCode = val;
            break;
          }
        }
      }
      if (!batchCode && !batchFaculty) continue;

      let day = (row[dayIdx] || "").toString().trim();
      const lectureDate = (row[dateIdx] || "").toString().trim();
      if (!day && lectureDate) {
        try {
          const parsed = new Date(lectureDate);
          if (!isNaN(parsed.getTime())) {
            day = parsed.toLocaleDateString("en-US", { weekday: "short" });
          }
        } catch {}
      }
      const startTime = (row[startIdx] || "").toString().trim();
      const endTime = (row[endIdx] || "").toString().trim();
      const timeRange = (row[timeIdx] || (startTime && endTime ? `${startTime} - ${endTime}` : "")).toString().trim();
      const facultyCode = (row[facultyCodeIdx] || "").toString().trim();
      let subject = (row[subjectIdx] || "").toString().trim();
      if (!subject || subject.toLowerCase() === "general" || subject.toLowerCase() === "lecture") {
        const derived = getSubjectFromFacultyCode(facultyCode);
        if (derived) subject = derived;
      }
      let teacherEmail = (row[teacherEmailIdx] || "").toString().trim();
      if (!teacherEmail || !teacherEmail.includes("@")) {
        for (let c = 10; c < Math.min(row.length, 45); c++) {
          const val = (row[c] || "").toString().trim();
          if (val.includes("@") && val.includes(".")) {
            teacherEmail = val;
            break;
          }
        }
      }

      const isToday = isDateOrDayMatchingToday(lectureDate, day, todayDate, todayDay, now);
      const status = computeLectureStatus(startTime, endTime, isToday, now);
      const teacherName = getTeacherNameFromEmail(teacherEmail);

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
        teacherName,
        isToday,
        status,
        rowIndex: i + 1,
      });
    }

    return deduplicateLectures(result);
  }

  function getSubjectFromFacultyCode(fCode: string): string {
    if (!fCode) return "";
    const first = fCode.trim().toUpperCase()[0];
    if (first === "P") return "Physics";
    if (first === "C") return "Chemistry";
    if (first === "M") return "Maths";
    if (first === "B") return "Botany";
    if (first === "Z") return "Zoology";
    if (first === "E") return "English";
    return "";
  }

  function filterCurrentOrLatestWeekLectures(lectures: any[], todayIso: string): any[] {
    if (!lectures || lectures.length === 0) return [];

    const currentYear = todayIso.substring(0, 4);
    const dateMap = new Map<any, string>();
    const isoDates: string[] = [];

    for (const lec of lectures) {
      if (lec.lectureDate) {
        const iso = parseDateToIso(lec.lectureDate, currentYear);
        if (iso) {
          dateMap.set(lec, iso);
          if (!isoDates.includes(iso)) isoDates.push(iso);
        }
      }
    }

    if (isoDates.length === 0) return lectures;

    isoDates.sort();

    const [ty, tm, td] = todayIso.split("-").map(Number);
    const todayObj = new Date(Date.UTC(ty, tm - 1, td, 12, 0, 0));
    const dayOfWeek = todayObj.getUTCDay();
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monObj = new Date(todayObj.getTime() + diffToMon * 86400000);
    const sunObj = new Date(monObj.getTime() + 6 * 86400000);

    const monIso = monObj.toISOString().substring(0, 10);
    const sunIso = sunObj.toISOString().substring(0, 10);

    // 1. If any lectures belong to current week (Monday to Sunday around today), return ONLY current week lectures
    const currentWeekLectures = lectures.filter((lec) => {
      const iso = dateMap.get(lec);
      if (!iso) return true; // keep recurring classes without explicit dates
      return iso >= monIso && iso <= sunIso;
    });

    const hasCurrentWeekDates = currentWeekLectures.some((l) => dateMap.has(l));
    if (hasCurrentWeekDates) {
      return currentWeekLectures;
    }

    // 2. Otherwise pick the latest week available in the sheet
    const latestIso = isoDates[isoDates.length - 1];
    const [ly, lm, ld] = latestIso.split("-").map(Number);
    const latestObj = new Date(Date.UTC(ly, lm - 1, ld, 12, 0, 0));
    const lDay = latestObj.getUTCDay();
    const lDiffToMon = lDay === 0 ? -6 : 1 - lDay;
    const latestMon = new Date(latestObj.getTime() + lDiffToMon * 86400000);
    const latestSun = new Date(latestMon.getTime() + 6 * 86400000);

    const lMonIso = latestMon.toISOString().substring(0, 10);
    const lSunIso = latestSun.toISOString().substring(0, 10);

    return lectures.filter((lec) => {
      const iso = dateMap.get(lec);
      if (!iso) return true;
      return iso >= lMonIso && iso <= lSunIso;
    });
  }

  function deduplicateLectures(lectures: any[]): any[] {
    const seen = new Map<string, any>();

    const normalizeTimeKey = (timeStr: string) => {
      if (!timeStr) return "";
      // Standardize single digit hours: '8:00' -> '08:00'
      const standardized = timeStr.replace(/\b(\d):/g, "0$1:");
      return standardized.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    };

    for (const lec of lectures) {
      const cleanBatch = extractCoreBatchCode(lec.batchCode || lec.batchFaculty || "");
      const cleanDay = (lec.day || "").trim().toUpperCase().substring(0, 3);
      const cleanTime = normalizeTimeKey(lec.timeRange || `${lec.startTime}-${lec.endTime}`);
      
      // Each batch can only have ONE lecture in a specific day and time slot!
      const slotKey = `${cleanBatch}_${cleanDay}_${cleanTime}`;

      if (!seen.has(slotKey)) {
        seen.set(slotKey, lec);
      } else {
        const existing = seen.get(slotKey);
        // Prefer today's confirmed class, or row with teacher email / faculty info
        if (lec.isToday && !existing.isToday) {
          seen.set(slotKey, lec);
        } else if (lec.teacherEmail && !existing.teacherEmail) {
          seen.set(slotKey, lec);
        }
      }
    }

    return Array.from(seen.values());
  }

  let cachedBmMap: Record<string, string> = { ...SEED_BM_MAP };
  let cachedBmMapTimestamp = Date.now();
  const BM_MAP_CACHE_TTL = 15 * 60 * 1000; // 15 minutes TTL

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === "," && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  }

  async function resolveBmMap(sheets: any, spreadsheetId: string, authToken?: string, forceRefresh = false): Promise<Record<string, string>> {
    const bmMap: Record<string, string> = { ...SEED_BM_MAP, ...(cachedBmMap || {}) };

    const registerBm = (batchName: string, bmVal: string) => {
      if (!batchName || !bmVal) return;
      const cleanBm = bmVal.replace(/^["'\s]+|["'\s]+$/g, "").trim();
      if (!cleanBm.includes("@")) return;

      const upperRaw = batchName.trim().toUpperCase().replace(/\s+/g, " ");
      const stripped = upperRaw
        .replace(/VIDYAPEETH/gi, "")
        .replace(/TUITION/gi, "")
        .replace(/SIP/gi, "")
        .replace(/\(MERGED\)/gi, "")
        .trim()
        .replace(/\s+/g, " ");
      const core = extractCode(batchName);
      const coreBatch = extractCoreBatchCode(batchName);

      bmMap[upperRaw] = cleanBm;
      if (stripped) {
        bmMap[stripped] = cleanBm;
        bmMap[`TUITION ${stripped}`] = cleanBm;
        bmMap[`VIDYAPEETH ${stripped}`] = cleanBm;
        bmMap[`SIP ${stripped}`] = cleanBm;
      }
      if (core) {
        bmMap[core] = cleanBm;
      }
      if (coreBatch) {
        bmMap[coreBatch] = cleanBm;
      }
    };

    // 1. Direct CSV export of 'Ref' tab (GID 1006259505) - 100% reliable, zero quota, instant
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=1006259505`;
      const fetchHeaders: Record<string, string> = {};
      if (authToken) {
        fetchHeaders["Authorization"] = `Bearer ${authToken}`;
      }
      const resp = await fetch(csvUrl, { headers: fetchHeaders });
      if (resp.ok) {
        const text = await resp.text();
        const lines = text.split("\n");
        if (lines.length > 0) {
          const header = parseCSVLine(lines[0]);
          let bIdx = -1;
          let bmIdx = -1;
          header.forEach((h: string, idx: number) => {
            const head = (h || "").toLowerCase().trim();
            if (bIdx === -1 && (head.includes("batch name") || head.includes("batch code") || (head.includes("batch") && !head.includes("status")))) {
              bIdx = idx;
            }
            if (bmIdx === -1 && (head.includes("bm") || head.includes("manager") || head.includes("email"))) {
              bmIdx = idx;
            }
          });
          if (bIdx === -1) bIdx = 1;
          if (bmIdx === -1) bmIdx = 3;

          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const cols = parseCSVLine(lines[i]);
            const rawBatch = (cols[bIdx] || "").trim();
            const bmVal = (cols[bmIdx] || "").trim();
            if (rawBatch && bmVal && bmVal.includes("@")) {
              registerBm(rawBatch, bmVal);
            }
          }
        }
      }
    } catch (csvErr: any) {
      console.warn("[BM Resolver] Direct CSV export failed:", csvErr.message);
    }

    // 2. Fallback to Google Sheets API if CSV was empty
    if (Object.keys(bmMap).length === 0 && sheets) {
      try {
        const refRes = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: "Ref!A:H",
        });
        const refRows = refRes.data.values || [];
        if (refRows.length > 0) {
          const refHeader = refRows[0] || [];
          let refBatchIdx = -1;
          let refBmIdx = -1;

          refHeader.forEach((h: any, idx: number) => {
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
            const rawFullName = refRows[i][refBatchIdx] ? refRows[i][refBatchIdx].toString().trim() : "";
            let bmVal = refRows[i][refBmIdx] ? refRows[i][refBmIdx].toString().trim() : "";
            if (!bmVal && refRows[i][2]) bmVal = refRows[i][2].toString().trim();
            if (!bmVal && refRows[i][4]) bmVal = refRows[i][4].toString().trim();

            if (rawFullName && bmVal && bmVal.includes("@")) {
              registerBm(rawFullName, bmVal);
            }
          }
        }
      } catch (err: any) {
        console.warn("[BM Resolver] API 'Ref' sheet reading failed:", err.message);
      }
    }

    // 3. Supplement with BM Names from Extra Class Sheet Cache
    try {
      const extraPayload = await fetchAllExtraClassLectures(sheets, false);
      if (extraPayload && Array.isArray(extraPayload.classes)) {
        for (const ec of extraPayload.classes) {
          if (ec.batchCode && ec.bmName && ec.bmName.includes("@")) {
            registerBm(ec.batchCode, ec.bmName);
          }
        }
      }
    } catch {}

    if (Object.keys(bmMap).length > 0) {
      cachedBmMap = bmMap;
      cachedBmMapTimestamp = Date.now();
    }

    return bmMap;
  }

  // API: Get Batches and BMs
  app.get("/api/batches", async (req, res) => {
    try {
      const auth = getGoogleAuth(req);
      const spreadsheetId = (req.query.spreadsheetId as string) || "1-OYeCl3SME14Jjk1CCxRAAho_jrvgji63fFunLZvKiM";
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");

      const sheets = google.sheets({ version: "v4", auth });

      // Step 1: Resolve Manager (BM) Map (Cached & Resilient with Infallible Seed Baseline)
      const bmMap = await resolveBmMap(sheets, spreadsheetId, token);

      // Step 2: Read all tabs to identify target workspaces
      const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetsList = metaRes.data.sheets || [];
      const targetTabs: string[] = [];

      sheetsList.forEach((sheet) => {
        const name = sheet.properties?.title || "";
        // Include all sheets except the 'Ref'/reference sheet
        if (name && name.trim().toLowerCase() !== "ref") {
          targetTabs.push(name);
        }
      });

      const batchesData: Record<string, any[]> = {};
      const masterBms = new Set<string>();

      // Step 3: Fetch batches from target workspaces
      for (const tabName of targetTabs) {
        try {
          const rangeRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${tabName}'!A:Z`,
          });
          const rows = rangeRes.data.values || [];
          const sheetData: any[] = [];

          // Dynamic column index lookup
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

          // Deduplicate and combine batches having the same Batch ID
          const batchMap = new Map<string, any>();
          const orderedKeys: string[] = [];

          // Skip header row
          for (let i = 1; i < rows.length; i++) {
            const batchCode = rows[i][batchCodeIdx] ? rows[i][batchCodeIdx].toString().trim() : "";
            if (!batchCode) continue;

            let rawBatchId = rows[i][batchIdIdx] ? rows[i][batchIdIdx].toString().trim() : "";
            const adminUrl = rows[i][adminUrlIdx] ? rows[i][adminUrlIdx].toString().trim() : "";
            const pwUrl = rows[i][pwUrlIdx] ? rows[i][pwUrlIdx].toString().trim() : "";
            const driveUrl = rows[i][driveUrlIdx] ? rows[i][driveUrlIdx].toString().trim() : "";
            const matchStatus = rows[i][matchStatusIdx] ? rows[i][matchStatusIdx].toString().trim() : "";

            // If rawBatchId is missing from the column, extract 24-char hex mongo ObjectId from URLs
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
            const strippedKey = lookupKey
              .replace(/VIDYAPEETH/gi, "")
              .replace(/TUITION/gi, "")
              .replace(/SIP/gi, "")
              .replace(/\(MERGED\)/gi, "")
              .trim()
              .replace(/\s+/g, " ");
            const coreKey = extractCode(batchCode);
            const coreBatch = extractCoreBatchCode(batchCode);

            let bmEmail = 
              bmMap[lookupKey] || 
              bmMap[strippedKey] || 
              bmMap[finalDisplayName.toUpperCase()] || 
              bmMap[cleanCode.toUpperCase()] ||
              bmMap[coreKey] || 
              (coreBatch ? bmMap[coreBatch] : "") || 
              "";

            // Fallback: check if any cell in this row contains a @pw.live email address
            if (!bmEmail && Array.isArray(rows[i])) {
              for (let col = 0; col < rows[i].length; col++) {
                const cellVal = (rows[i][col] || "").toString().trim();
                if (cellVal.includes("@pw.live")) {
                  bmEmail = cellVal;
                  break;
                }
              }
            }

            if (bmEmail) {
              masterBms.add(bmEmail);
            }

            // Key by Batch ID (if available) or by cleaned core code
            const dedupeKey = rawBatchId 
              ? `ID_${rawBatchId.toLowerCase()}` 
              : `CODE_${extractCode(batchCode) || cleanCode.toUpperCase()}`;

            if (batchMap.has(dedupeKey)) {
              const existing = batchMap.get(dedupeKey);
              const prevNames: string[] = existing.previousNames || [];
              if (existing.fullName && existing.fullName !== batchCode && !prevNames.includes(existing.fullName)) {
                prevNames.push(existing.fullName);
              }

              const allRowIndices: number[] = existing.allRowIndices || [existing.rowIndex];
              if (!allRowIndices.includes(i + 1)) {
                allRowIndices.push(i + 1);
              }

              // Update with latest row's batch name/code and metadata (later row in sheet takes precedence)
              existing.fullName = batchCode;
              existing.displayName = finalDisplayName;
              existing.category = getCategory(batchCode);
              existing.phase = getPhase(batchCode);
              existing.timeSlot = getTimeSlot(batchCode);
              existing.rowIndex = i + 1; // latest row index
              existing.allRowIndices = allRowIndices;
              existing.previousNames = prevNames;
              if (rawBatchId) existing.batchId = rawBatchId;

              // Preserve best URLs and details across both versions
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
                rowIndex: i + 1,
              };
              batchMap.set(dedupeKey, newBatch);
              orderedKeys.push(dedupeKey);
            }
          }

          sheetData.push(...orderedKeys.map(k => batchMap.get(k)));
          batchesData[tabName] = sheetData;
        } catch (tabErr: any) {
          console.error(`Error reading tab ${tabName}:`, tabErr.message);
          // Still assign an empty array so the user knows the tab exists in the spreadsheet
          batchesData[tabName] = [];
        }
      }

      res.json({
        batchesData,
        bms: Array.from(masterBms).sort(),
      });
    } catch (error: any) {
      console.error("API Error (get-batches):", error);
      res.status(error.message.includes("Authorization") ? 401 : 500).json({
        error: error.message || "An error occurred while loading sheets data.",
      });
    }
  });

  // API: Scan Google Drive for a single batch
  app.post("/api/scan/batch", async (req, res) => {
    try {
      const auth = getGoogleAuth(req);
      const { spreadsheetId, tabName, batchCode, rowIndex, allRowIndices } = req.body;

      if (!tabName || !batchCode || !rowIndex) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const coreCode =
        batchCode.split("-").length > 1
          ? batchCode.split("-")[1].split(" ")[0].replace(/[^A-Z0-9]/gi, "").toUpperCase()
          : batchCode.replace(/[^A-Z0-9]/gi, "").toUpperCase();

      const drive = google.drive({ version: "v3", auth });
      let matchedUrl = "";
      let matchedFolderName = "";

      // Engine 1: Exact Match Search
      const exactRes = await drive.files.list({
        q: `name contains '${coreCode}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: "files(id, name, webViewLink)",
        pageSize: 1,
      });
      const files = exactRes.data.files || [];
      if (files.length > 0) {
        matchedUrl = files[0].webViewLink || "";
        matchedFolderName = files[0].name || "";
      }

      // Engine 2: Loose Match Search (bypass spaces/missing chars)
      if (!matchedUrl && coreCode.length >= 5) {
        const looseCode = coreCode.slice(0, -2);
        const looseRes = await drive.files.list({
          q: `name contains '${looseCode}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
          fields: "files(id, name, webViewLink)",
          pageSize: 20,
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

      // Construct values to write back to spreadsheet
      const statusValue = matchedUrl ? `Found: ${matchedFolderName}` : `Missing: ${coreCode}`;
      const urlValue = matchedUrl || "Not Found";

      const sheets = google.sheets({ version: "v4", auth });

      // Fetch first row to map column indexes dynamically
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${tabName}'!1:1`,
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

      const targetRows: number[] = Array.isArray(allRowIndices) && allRowIndices.length > 0 ? allRowIndices : [rowIndex];
      for (const rIdx of targetRows) {
        // Update Drive URL cell
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${tabName}'!${driveLetter}${rIdx}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[urlValue]],
          },
        });

        // Update Match Status cell
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${tabName}'!${statusLetter}${rIdx}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[statusValue]],
          },
        });
      }

      res.json({
        driveUrl: urlValue,
        matchStatus: statusValue,
      });
    } catch (error: any) {
      console.error("API Error (scan-batch):", error);
      res.status(error.message.includes("Authorization") ? 401 : 500).json({
        error: error.message || "An error occurred during Google Drive search.",
      });
    }
  });

  // API: Update batch links manually
  app.post("/api/update-batch-links", async (req, res) => {
    try {
      const auth = getGoogleAuth(req);
      const { spreadsheetId, tabName, rowIndex, adminUrl, pwUrl, driveUrl, matchStatus, allRowIndices } = req.body;

      if (!tabName || !rowIndex) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const sheets = google.sheets({ version: "v4", auth });

      // Fetch first row to map column indexes dynamically
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${tabName}'!1:1`,
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

      const targetRows: number[] = Array.isArray(allRowIndices) && allRowIndices.length > 0 ? allRowIndices : [rowIndex];
      for (const rIdx of targetRows) {
        // Update Admin URL
        if (adminUrl !== undefined) {
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${tabName}'!${adminLetter}${rIdx}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [[adminUrl || ""]],
            },
          });
        }

        // Update App / PW URL
        if (pwUrl !== undefined) {
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${tabName}'!${pwLetter}${rIdx}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [[pwUrl || ""]],
            },
          });
        }

        // Update Drive Link
        if (driveUrl !== undefined) {
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${tabName}'!${driveLetter}${rIdx}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [[driveUrl || ""]],
            },
          });
        }

        // Update Match Status
        if (matchStatus !== undefined) {
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${tabName}'!${statusLetter}${rIdx}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [[matchStatus || ""]],
            },
          });
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("API Error (update-batch-links):", error);
      res.status(error.message.includes("Authorization") ? 401 : 500).json({
        error: error.message || "An error occurred while updating the spreadsheet.",
      });
    }
  });

  // ==========================================
  // Extra Classes Aggregator & Live Cache
  // ==========================================
  const extraClassCache = new Map<string, { data: any; timestamp: number }>();
  const EXTRA_CLASS_SPREADSHEET_ID = '1f5HNSsjR_08dDDVvFoqrG40SaKdxhgbRnhD8cp7gY_4';
  const EXTRA_CLASS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

  const EXTRA_CLASS_CENTERS = [
    { rawSheetTitle: 'Hadapsar ', centerName: 'Hadapsar', gid: '498958040' },
    { rawSheetTitle: 'Viman Nagar', centerName: 'Viman Nagar', gid: '917736581' },
    { rawSheetTitle: 'Kothrud ', centerName: 'Kothrud', gid: '2015026809' },
    { rawSheetTitle: 'PCMC ', centerName: 'PCMC', gid: '15540423' },
    { rawSheetTitle: 'FC Road ', centerName: 'FC Road', gid: '398485996' },
    { rawSheetTitle: 'Osmanabad (Dharashiv - S-SIP)', centerName: 'Osmanabad (Dharashiv - S-SIP)', gid: '1691470459' },
    { rawSheetTitle: 'Pimple Saudagar', centerName: 'Pimple Saudagar', gid: '4891040' },
  ];

  function parseCsvRows(csvText: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];
      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== '')) rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c !== '')) rows.push(currentRow);
    }
    return rows;
  }

  function parseDateToIso(rawDate: string, currentYearStr: string): string | null {
    if (!rawDate) return null;
    const str = String(rawDate).trim();
    if (!str) return null;

    // Check YYYY-MM-DD or YYYY/MM/DD
    const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (isoMatch) {
      const y = isoMatch[1];
      const m = isoMatch[2].padStart(2, '0');
      const d = isoMatch[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Check DD-MMM-YYYY or DD-MMM (e.g. 9-Sep-2026, 09-Sep-2026, 9-Sep, 10-Sept-2026)
    const monthMap: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', sept: '09', oct: '10', nov: '11', dec: '12'
    };
    const mmmMatch = str.match(/^(\d{1,2})[-/\s]+([a-zA-Z]{3,4})[-/\s]*(\d{2,4})?$/);
    if (mmmMatch) {
      const d = mmmMatch[1].padStart(2, '0');
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

    // Check DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (dmyMatch) {
      const d = dmyMatch[1].padStart(2, '0');
      const m = dmyMatch[2].padStart(2, '0');
      let y = dmyMatch[3];
      if (y.length === 2) y = `20${y}`;
      return `${y}-${m}-${d}`;
    }

    // Check Excel serial number (e.g. 46274)
    const num = Number(str);
    if (!isNaN(num) && num > 40000 && num < 60000) {
      const epoch = new Date(Date.UTC(1899, 11, 30));
      const target = new Date(epoch.getTime() + num * 86400000);
      const y = target.getUTCFullYear();
      const m = String(target.getUTCMonth() + 1).padStart(2, '0');
      const d = String(target.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    return null;
  }

  async function fetchAllExtraClassLectures(sheets: any = null, forceRefresh = false): Promise<any> {
    const cacheKey = `extra-classes-${EXTRA_CLASS_SPREADSHEET_ID}`;
    const cached = extraClassCache.get(cacheKey);

    if (!forceRefresh && cached && Date.now() - cached.timestamp < EXTRA_CLASS_CACHE_TTL) {
      return cached.data;
    }

    const ALLOWED_EXTRA_CLASS_CENTERS = [
      'Hadapsar',
      'Viman Nagar',
      'Kothrud',
      'PCMC',
      'FC Road',
      'Osmanabad (Dharashiv - S-SIP)',
      'Pimple Saudagar',
    ];

    let sheetResults: { sheetTitle: string; centerName: string; rows: any[][] }[] = [];
    let fetchSuccess = false;

    // 1. PRIMARY ENGINE: Direct Google Docs CSV Export (USES ZERO GOOGLE SHEETS API QUOTA!)
    try {
      const csvPromises = EXTRA_CLASS_CENTERS.map(async (c) => {
        const exportUrl = `https://docs.google.com/spreadsheets/d/${EXTRA_CLASS_SPREADSHEET_ID}/export?format=csv&gid=${c.gid}`;
        const resp = await fetch(exportUrl);
        if (!resp.ok) {
          throw new Error(`Failed to fetch CSV for ${c.centerName}: HTTP ${resp.status}`);
        }
        const text = await resp.text();
        const rows = parseCsvRows(text);
        return {
          sheetTitle: c.rawSheetTitle,
          centerName: c.centerName,
          rows,
        };
      });

      sheetResults = await Promise.all(csvPromises);
      fetchSuccess = sheetResults.some((s) => s.rows && s.rows.length > 0);
    } catch (csvErr: any) {
      console.warn('[Extra Class] Direct CSV export failed, falling back to Google Sheets API:', csvErr.message);
    }

    // 2. FALLBACK ENGINE: Google Sheets API batchGet (if CSV fails)
    if (!fetchSuccess && sheets) {
      try {
        const ranges = EXTRA_CLASS_CENTERS.map((s) => `'${s.rawSheetTitle}'!A1:P`);
        const batchRes = await sheets.spreadsheets.values.batchGet({
          spreadsheetId: EXTRA_CLASS_SPREADSHEET_ID,
          ranges,
        });
        const valueRanges = batchRes.data?.valueRanges || [];
        sheetResults = EXTRA_CLASS_CENTERS.map((s, idx) => ({
          sheetTitle: s.rawSheetTitle,
          centerName: s.centerName,
          rows: valueRanges[idx]?.values || [],
        }));
        fetchSuccess = true;
      } catch (batchErr: any) {
        console.warn('[Extra Class] batchGet error:', batchErr.message);
        if (cached && cached.data) {
          console.log('[Extra Class] Serving stale cached data due to API limit.');
          return cached.data;
        }
      }
    }

    if (!fetchSuccess) {
      if (cached && cached.data) {
        console.log('[Extra Class] Serving cached data.');
        return cached.data;
      }
      throw new Error('Could not load extra class schedule.');
    }

    // 3. Compute IST reference dates
    const now = new Date();
    const todayIstParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const tomorrowDateObj = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowIstParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(tomorrowDateObj);

    const yesterdayDateObj = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayIstParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(yesterdayDateObj);

    const currentYearStr = todayIstParts.split('-')[0];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const formatIsoDisplay = (iso: string) => {
      const [y, m, d] = iso.split('-');
      return `${d}-${monthNames[parseInt(m, 10) - 1]}-${y}`;
    };

    const todayDisplay = formatIsoDisplay(todayIstParts);
    const tomorrowDisplay = formatIsoDisplay(tomorrowIstParts);
    const yesterdayDisplay = formatIsoDisplay(yesterdayIstParts);

    const allLectures: any[] = [];
    const centersFound = new Set<string>();

    for (const { sheetTitle, centerName, rows } of sheetResults) {
      if (!rows || rows.length === 0) continue;
      centersFound.add(centerName);

      let headerRowIdx = 0;
      for (let i = 0; i < Math.min(rows.length, 5); i++) {
        const nonEmpty = (rows[i] || []).filter((c: any) => String(c || '').trim() !== '');
        if (nonEmpty.length >= 2) {
          headerRowIdx = i;
          break;
        }
      }

      const headerRow = (rows[headerRowIdx] || []).map((h: any) => String(h || '').trim().toLowerCase());

      // Column Mappings (Google Sheet layout):
      // Col A (0): Batch code
      // Col B (1): Day
      // Col C (2): Date
      // Col D (3): Faculty Code
      // Col E (4): In Time
      // Col F (5): Out Time
      // Col G (6): Class Test / Doubts
      // Col H (7): Teacher name
      // Col I (8): Subject
      // Col J (9): BM Name
      // Col K (10): Extra class Announcement
      // Col L (11): Room
      // Col M (12): PDF/Video Uploaded
      // Col N (13): Class Cancel Status
      // Col O (14): Announcement Status
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
      let statusCol = 14; // Default to Column O (Announcement Status)

      headerRow.forEach((h: string, idx: number) => {
        if (h.includes('batch')) batchCol = idx;
        else if (h.includes('day')) dayCol = idx;
        else if (h.includes('date')) dateCol = idx;
        else if (h.includes('faculty') && !h.includes('name')) facultyCol = idx;
        else if (h.includes('in time') || h.includes('start') || h === 'in') inTimeCol = idx;
        else if (h.includes('out time') || h.includes('end') || h === 'out') outTimeCol = idx;
        else if (h.includes('doubts') || h.includes('test') || h.includes('class type')) classTypeCol = idx;
        else if (h.includes('teacher') || (h.includes('faculty') && h.includes('name'))) teacherCol = idx;
        else if (h.includes('subject')) subjectCol = idx;
        else if (h.includes('bm') || h.includes('manager')) bmCol = idx;
        else if (h.includes('room')) roomCol = idx;

        // Distinct check for Column K (Announcement message) vs Column O (Announcement Status):
        if (h.includes('announcement') && h.includes('status')) {
          statusCol = idx;
        } else if (h.includes('announcement') || h.includes('message')) {
          announcementCol = idx;
        } else if (h.includes('status') && !h.includes('cancel')) {
          statusCol = idx;
        }
      });

      const statusColLetter = indexToColLetter(statusCol);

      for (let r = headerRowIdx + 1; r < rows.length; r++) {
        const row = rows[r] || [];
        const batchRaw = String(row[batchCol] || '').trim();
        if (!batchRaw) continue;

        if (batchRaw.toLowerCase().includes('batch') && batchRaw.toLowerCase().includes('code')) continue;

        let day = String(row[dayCol] || '').trim();
        const rawDate = String(row[dateCol] || '').trim();
        const facultyCode = String(row[facultyCol] || '').trim();
        const inTime = String(row[inTimeCol] || '').trim();
        const outTime = String(row[outTimeCol] || '').trim();
        const classType = String(row[classTypeCol] || '').trim();
        const teacherName = String(row[teacherCol] || '').trim();
        const subject = String(row[subjectCol] || '').trim();
        const bmName = String(row[bmCol] || '').trim();
        let announcement = String(row[announcementCol] || '').trim();
        const room = String(row[roomCol] || '').trim();
        const rawStatus = String(row[statusCol] || '').trim();

        // Column O: If rawStatus does NOT say "done", it is PENDING!
        const statusLower = rawStatus.toLowerCase();
        const isDone = statusLower === 'done' || statusLower.startsWith('done') || statusLower.includes('done');

        const isoDate = parseDateToIso(rawDate, currentYearStr);
        let displayDate = rawDate;
        let isToday = false;
        let isTomorrow = false;
        let isYesterday = false;
        let isPast = false;
        let isUpcoming = false;

        if (isoDate) {
          displayDate = formatIsoDisplay(isoDate);
          if (isoDate === todayIstParts) {
            isToday = true;
          } else if (isoDate === tomorrowIstParts) {
            isTomorrow = true;
          } else if (isoDate === yesterdayIstParts) {
            isYesterday = true;
            isPast = true;
          } else if (isoDate < todayIstParts) {
            isPast = true;
          } else {
            isUpcoming = true;
          }

          // Compute day of week if Day column is empty in sheet
          if (!day) {
            try {
              const [y, m, d] = isoDate.split('-').map(Number);
              const dObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
              day = dObj.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
            } catch {}
          }
        } else {
          const lowerDate = rawDate.toLowerCase();
          if (lowerDate.includes('today')) isToday = true;
          else if (lowerDate.includes('tomorrow')) isTomorrow = true;
          else if (lowerDate.includes('yesterday')) {
            isYesterday = true;
            isPast = true;
          }
        }

        // Exact Announcement message from Column K, or clean standard format if empty
        if (!announcement) {
          announcement = `Dear Vidyapeeth Students, ${teacherName || facultyCode || 'Faculty'} Sir/Ma'am will take ${classType || 'Extra Class'} of ${subject || 'Special Subject'} at (${displayDate || rawDate}) at (${inTime || 'TBD'} to ${outTime || 'TBD'}). Don't forget to join! Keep studying! Physics Wallah is for you, by you, from you!`;
        }

        const category = getCategory(batchRaw);
        const phase = getPhase(batchRaw);
        const timeSlot = getTimeSlot(batchRaw);

        allLectures.push({
          id: `${sheetTitle}_${r + 1}`,
          spreadsheetId: EXTRA_CLASS_SPREADSHEET_ID,
          sheetTitle,
          center: centerName,
          rowIndex: r + 1,
          statusColLetter,
          batchCode: batchRaw,
          formattedBatchName: batchRaw.toUpperCase().startsWith("VIDYAPEETH") || batchRaw.toUpperCase().startsWith("TUITION") || batchRaw.toUpperCase().startsWith("SIP")
            ? batchRaw
            : (batchRaw.toUpperCase().startsWith("T") ? `Tuition ${batchRaw}` : batchRaw.toUpperCase().startsWith("S") ? `SIP ${batchRaw}` : `Vidyapeeth ${batchRaw}`),
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
          timeRange: inTime && outTime ? `${inTime} - ${outTime}` : inTime || outTime || 'Time TBA',
          classType: classType || 'Extra Lecture',
          teacherName,
          subject,
          bmName,
          announcement,
          room: room ? (room.toLowerCase().startsWith('room') ? room : `Room ${room}`) : 'Room TBA',
          rawStatus,
          isDone,
          isToday,
          isTomorrow,
          isYesterday,
          isPast,
          isUpcoming,
        });
      }
    }

    const yesterdayCount = allLectures.filter((c) => c.isYesterday).length;
    const todayCount = allLectures.filter((c) => c.isToday).length;
    const tomorrowCount = allLectures.filter((c) => c.isTomorrow).length;
    const upcomingCount = allLectures.filter((c) => c.isUpcoming).length;
    const pastCount = allLectures.filter((c) => c.isPast).length;
    const doneCount = allLectures.filter((c) => c.isDone).length;
    // Pending: any lecture where Column O is NOT done!
    const pendingCount = allLectures.filter((c) => !c.isDone).length;

    const responsePayload = {
      todayDate: todayIstParts,
      tomorrowDate: tomorrowIstParts,
      yesterdayDate: yesterdayIstParts,
      todayDateDisplay: todayDisplay,
      tomorrowDateDisplay: tomorrowDisplay,
      yesterdayDateDisplay: yesterdayDisplay,
      centers: ALLOWED_EXTRA_CLASS_CENTERS,
      classes: allLectures,
      counts: {
        yesterday: yesterdayCount,
        today: todayCount,
        tomorrow: tomorrowCount,
        upcoming: upcomingCount,
        past: pastCount,
        pending: pendingCount,
        done: doneCount,
        total: allLectures.length,
      }
    };

    extraClassCache.set(cacheKey, {
      data: responsePayload,
      timestamp: Date.now(),
    });

    return responsePayload;
  }

  // ==========================================
  // Audit Sheet Aggregator for Pune Centers
  // Spreadsheet ID: 1ZXz1LySgzYL06gNbM7N8jCbnTOyVGiHQ0I596F-Sq_k
  // Subsheets: Pendency, Topic, Video, Notes, Content, Teacher
  // ==========================================
  const AUDIT_SPREADSHEET_ID = "1ZXz1LySgzYL06gNbM7N8jCbnTOyVGiHQ0I596F-Sq_k";
  const auditSheetCache = new Map<string, { data: any; timestamp: number }>();

  function isPuneBatchCode(str: string): boolean {
    if (!str) return false;
    const clean = str.trim().toUpperCase();
    return (
      clean.startsWith("27-") ||
      clean.startsWith("T27") ||
      clean.startsWith("T-27") ||
      clean.startsWith("27 -") ||
      clean.includes("27-") ||
      clean.includes("T27") ||
      clean.includes("T-27") ||
      clean.includes("27 -") ||
      /\b(27-|T27)/i.test(clean)
    );
  }

  function isPuneBranch(branch: string): boolean {
    if (!branch) return false;
    const b = branch.toLowerCase().trim().replace(/[^a-z0-9]/g, " ");
    const puneKeywords = [
      "pcmc", "pimpri", "hadapsar", "viman", "vimannagar", 
      "fc", "fcroad", "fergusson", "kothrud", "kothurd", "tc", "tuition", "pune"
    ];
    const tokens = b.split(/\s+/).filter(Boolean);
    return puneKeywords.some((kw) => b.includes(kw) || tokens.includes(kw));
  }

  function normalizePuneBranchName(branch: string): string {
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

  function formatAuditDateTime(val: string): string {
    if (!val) return "";
    const s = String(val).trim();
    if (!s) return "";

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const isoMatch = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (isoMatch) {
      const year = isoMatch[1];
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      const monthStr = monthNames[month] || String(month + 1);
      const dayStr = day < 10 ? `0${day}` : `${day}`;

      if (isoMatch[4] !== undefined && isoMatch[5] !== undefined) {
        let hour = parseInt(isoMatch[4], 10);
        const min = isoMatch[5];
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12;
        if (hour === 0) hour = 12;
        const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
        return `${dayStr}-${monthStr}-${year} • ${hourStr}:${min} ${ampm}`;
      }
      return `${dayStr}-${monthStr}-${year}`;
    }

    const ddmmyyyyMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
      const year = ddmmyyyyMatch[3];
      const monthStr = monthNames[month] || String(month + 1);
      const dayStr = day < 10 ? `0${day}` : `${day}`;

      if (ddmmyyyyMatch[4] !== undefined && ddmmyyyyMatch[5] !== undefined) {
        let hour = parseInt(ddmmyyyyMatch[4], 10);
        const min = ddmmyyyyMatch[5];
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12;
        if (hour === 0) hour = 12;
        const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
        return `${dayStr}-${monthStr}-${year} • ${hourStr}:${min} ${ampm}`;
      }
      return `${dayStr}-${monthStr}-${year}`;
    }

    const timeMatch = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const min = timeMatch[2];
      const ampm = hour >= 12 ? "PM" : "AM";
      hour = hour % 12;
      if (hour === 0) hour = 12;
      const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
      return `${hourStr}:${min} ${ampm}`;
    }

    return s;
  }

  function isTrivialAuditClean(val: string): boolean {
    if (!val) return true;
    const lower = val.toLowerCase().trim();
    const cleanKeywords = [
      "no", "none", "nil", "ok", "clean", "done", "na", "n/a", "-", "--", "false", "true",
      "no issue", "no issues", "no error", "no errors", "all ok", "good", "resolved", "completed", "yes", "none reported"
    ];
    return cleanKeywords.includes(lower);
  }

  function isExplicitAuditIssue(val: string): boolean {
    if (!val || isTrivialAuditClean(val)) return false;
    const lower = val.toLowerCase();
    const problemKeywords = [
      "wrong", "issue", "error", "not uploaded", "missing", "delay", "fault",
      "problem", "incorrect", "pendency", "pending", "failed", "reschedule", "cancel", "mismatch", "defect", "quiz"
    ];
    return problemKeywords.some((kw) => lower.includes(kw));
  }

  async function fetchAuditSheetWithCache(sheets: any, forceRefresh = false): Promise<any> {
    const cacheKey = `audit-sheet-${AUDIT_SPREADSHEET_ID}`;
    const cached = auditSheetCache.get(cacheKey);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < 3 * 60 * 1000) {
      return cached.data;
    }

    if (!sheets) {
      if (cached && cached.data) return cached.data;
      return { records: [], totalPuneCount: 0, errorCount: 0, branches: [], subsheets: [] };
    }

    const metaRes = await sheets.spreadsheets.get({
      spreadsheetId: AUDIT_SPREADSHEET_ID,
    });

    const allSheets = metaRes.data.sheets || [];
    const spreadsheetTitle = metaRes.data.properties?.title || "Audit Sheet";

    const TARGET_SUBSHEETS = ["pendency", "topic", "video", "notes", "content", "teacher"];

    const matchedSheets = allSheets.filter((s: any) => {
      const title = (s.properties?.title || "").trim().toLowerCase();
      return TARGET_SUBSHEETS.some((target) => title.includes(target));
    });

    const sheetsToQuery = matchedSheets.length > 0 ? matchedSheets : allSheets.slice(0, 8);

    const sheetDataResults = await Promise.all(
      sheetsToQuery.map(async (sheet: any) => {
        const sheetTitle = sheet.properties?.title || "Sheet1";
        try {
          const valRes = await sheets.spreadsheets.values.get({
            spreadsheetId: AUDIT_SPREADSHEET_ID,
            range: `'${sheetTitle}'!A1:ZZ`,
          });
          return {
            sheetTitle,
            rows: valRes.data.values || [],
          };
        } catch (err: any) {
          console.warn(`[Audit Sheet] Error fetching sheet '${sheetTitle}':`, err.message);
          return { sheetTitle, rows: [] };
        }
      })
    );

    const allPuneRecords: any[] = [];
    const branchesSet = new Set<string>();
    const subsheetsFound: string[] = [];

    for (const { sheetTitle, rows } of sheetDataResults) {
      if (!rows || rows.length < 2) continue;
      subsheetsFound.push(sheetTitle);

      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const nonEmpty = (rows[i] || []).filter((c: any) => String(c || "").trim() !== "");
        if (nonEmpty.length >= 2) {
          headerRowIndex = i;
          break;
        }
      }

      const headerRow = (rows[headerRowIndex] || []).map((h: any) => String(h || "").trim());

      let branchIdx = -1;
      let batchIdx = -1;
      let subjectIdx = -1;
      let timeIdx = -1;
      let bmIdx = -1;
      const issueColIndices: number[] = [];
      const statusColIndices: number[] = [];

      headerRow.forEach((colHeader: string, idx: number) => {
        const rawH = colHeader.toLowerCase().trim();
        const hAlpha = rawH.replace(/[^a-z0-9]/g, "");
        const hSpaced = rawH.replace(/[^a-z0-9]/g, " ");

        if (branchIdx === -1 && (hAlpha.includes("branch") || hAlpha.includes("center") || hAlpha.includes("centre") || hAlpha.includes("location"))) {
          branchIdx = idx;
        } else if (batchIdx === -1 && (hAlpha.includes("batchname") || hAlpha.includes("batchcode") || (hAlpha.includes("batch") && !hAlpha.includes("manager") && !hAlpha.includes("bm")))) {
          batchIdx = idx;
        } else if (subjectIdx === -1 && (hAlpha.includes("subjectname") || hAlpha.includes("subject") || hAlpha === "sub")) {
          subjectIdx = idx;
        } else if (timeIdx === -1 && (
          hAlpha.includes("lecstart") ||
          hAlpha.includes("starttime") ||
          hAlpha.includes("lectime") ||
          hAlpha.includes("startdate") ||
          hAlpha.includes("lecdate") ||
          hSpaced.includes("lec start") ||
          hSpaced.includes("start time") ||
          hSpaced.includes("lecture time") ||
          hSpaced.includes("in time") ||
          hAlpha === "time" ||
          hAlpha === "timing" ||
          hAlpha.includes("slot")
        )) {
          timeIdx = idx;
        } else if (bmIdx === -1 && (
          hAlpha.includes("finalbm") ||
          hAlpha.includes("batchmanager") ||
          hAlpha === "bm" ||
          hAlpha.includes("bmname") ||
          (hAlpha.includes("manager") && !hAlpha.includes("batch"))
        )) {
          bmIdx = idx;
        }

        if (
          hAlpha.includes("issue") ||
          hAlpha.includes("error") ||
          hAlpha.includes("remark") ||
          hAlpha.includes("problem") ||
          hAlpha.includes("pendency") ||
          hAlpha.includes("defect")
        ) {
          issueColIndices.push(idx);
        } else if (
          hAlpha.includes("status") ||
          hAlpha.includes("verification") ||
          hAlpha.includes("audit") ||
          hAlpha.includes("uploaded") ||
          hAlpha.includes("notes") ||
          hAlpha.includes("video")
        ) {
          statusColIndices.push(idx);
        }
      });

      for (let r = headerRowIndex + 1; r < rows.length; r++) {
        const row = rows[r] || [];
        if (!row || row.length === 0) continue;

        const rawBranch = branchIdx >= 0 ? String(row[branchIdx] || "").trim() : "";
        let rawBatch = batchIdx >= 0 ? String(row[batchIdx] || "").trim() : "";

        let finalBatchName = "";
        if (isPuneBatchCode(rawBatch)) {
          finalBatchName = rawBatch;
        } else {
          for (let c = 0; c < row.length; c++) {
            const cellStr = String(row[c] || "").trim();
            if (isPuneBatchCode(cellStr)) {
              finalBatchName = cellStr;
              break;
            }
          }
        }

        if (!finalBatchName) continue;

        let normalizedBranch = "";
        const batchUpper = finalBatchName.toUpperCase();
        if (batchUpper.startsWith("T27") || batchUpper.includes("T27")) {
          normalizedBranch = "TC";
        } else if (rawBranch && rawBranch.toLowerCase() !== "pune") {
          normalizedBranch = normalizePuneBranchName(rawBranch);
        } else {
          normalizedBranch = "Pune Center";
        }
        branchesSet.add(normalizedBranch);

        const rawSubject = subjectIdx >= 0 ? String(row[subjectIdx] || "").trim() : "";
        const rawTime = timeIdx >= 0 ? String(row[timeIdx] || "").trim() : "";
        const formattedLecTime = formatAuditDateTime(rawTime);
        const rawBm = bmIdx >= 0 ? String(row[bmIdx] || "").trim() : "";

        const gatheredIssues: string[] = [];
        for (const idx of issueColIndices) {
          const val = String(row[idx] || "").trim();
          if (val && !isTrivialAuditClean(val)) {
            if (!gatheredIssues.some((g) => g.toLowerCase() === val.toLowerCase())) {
              gatheredIssues.push(val);
            }
          }
        }

        if (gatheredIssues.length === 0) {
          for (const idx of statusColIndices) {
            const val = String(row[idx] || "").trim();
            if (val && !isTrivialAuditClean(val)) {
              if (!gatheredIssues.some((g) => g.toLowerCase() === val.toLowerCase())) {
                gatheredIssues.push(val);
              }
            }
          }
        }

        if (gatheredIssues.length === 0) {
          for (let c = 0; c < row.length; c++) {
            if (c === branchIdx || c === batchIdx || c === subjectIdx || c === timeIdx || c === bmIdx) continue;
            const cellVal = String(row[c] || "").trim();
            if (cellVal && isExplicitAuditIssue(cellVal)) {
              gatheredIssues.push(cellVal);
              break;
            }
          }
        }

        const rawError = gatheredIssues.join(" • ");
        const hasError = gatheredIssues.length > 0;

        const rawRowObj: Record<string, string> = {};
        headerRow.forEach((colHeader: string, colIdx: number) => {
          const key = colHeader || `Column_${colIdx + 1}`;
          rawRowObj[key] = String(row[colIdx] || "").trim();
        });

        allPuneRecords.push({
          id: `${sheetTitle}_${r + 1}`,
          subsheet: sheetTitle,
          branch: normalizedBranch,
          batchName: finalBatchName,
          subjectName: rawSubject,
          lecStartTime: formattedLecTime || rawTime,
          finalBm: rawBm,
          errors: rawError,
          hasError,
          rowIndex: r + 1,
          rawRow: rawRowObj,
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
      records: allPuneRecords,
    };

    auditSheetCache.set(cacheKey, {
      data: payload,
      timestamp: Date.now(),
    });

    return payload;
  }

  // API: Get Batch Timetable Schedule from Raw_DB + Extra Class Sheet
  app.get("/api/timetable/batch-schedule", async (req, res) => {
    try {
      const auth = getGoogleAuth(req);
      const center = (req.query.center as string) || "";
      const batchCode = (req.query.batchCode as string) || "";
      let spreadsheetId = (req.query.spreadsheetId as string) || "";
      const forceRefresh = req.query.forceRefresh === "true";
      const searchAll = req.query.searchAll === "true" || !center || center === "ALL";

      if (!batchCode) {
        return res.status(400).json({ error: "Missing required query parameter: batchCode" });
      }

      const sheets = google.sheets({ version: "v4", auth });

      let spreadsheetTitle = "";
      let foundLectures: any[] = [];
      let resolvedCenter = center || "";

      // Step 1: If center is specified and searchAll is false, check candidate sheet first
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
          } catch (err: any) {
            console.warn(`Error querying candidate sheet ${candidateId}:`, err.message);
          }
        }
      }

      // Step 2: If searching all workspaces OR no matches found in candidate sheet, search ALL 9 timetable sheets in parallel
      if (foundLectures.length === 0) {
        const sheetsToSearch = (!searchAll && candidateId)
          ? TIMETABLE_SHEET_IDS.filter((id) => id !== candidateId)
          : TIMETABLE_SHEET_IDS;

        const results = await Promise.all(
          sheetsToSearch.map(async (sId) => {
            try {
              const { title, rows } = await fetchRawDbWithCache(sheets, sId, forceRefresh);
              const parsed = parseRawDbRows(rows);
              const matches = parsed.filter((l) => isBatchMatch(l.batchCode, l.batchFaculty, batchCode));
              return { sId, title, matches, totalParsed: parsed.length };
            } catch (err: any) {
              return { sId, title: sId, matches: [], totalParsed: 0 };
            }
          })
        );

        // Select the single best matching sheet for this batch (avoid cross-center / multi-sheet duplication)
        let bestResult = results.find(
          (r) => r.matches.length > 0 && center && doesSheetTitleMatchCenter(r.title, center)
        );
        if (!bestResult) {
          const candidates = results
            .filter((r) => r.matches.length > 0)
            .sort((a, b) => b.matches.length - a.matches.length);
          bestResult = candidates[0];
        }

        if (bestResult && bestResult.matches.length > 0) {
          foundLectures = bestResult.matches;
          spreadsheetId = bestResult.sId;
          spreadsheetTitle = bestResult.title;

          // Determine which center this sheet belongs to
          const knownCenters = ["PCMC VP", "HADAPSAR", "VIMAN NAGAR VP", "TC", "FC ROAD", "KOTHURD"];
          for (const [cName, cMap] of Object.entries(centerTimetableMap)) {
            if (cMap.spreadsheetId === bestResult.sId) {
              resolvedCenter = cName;
              break;
            }
          }
          if (!resolvedCenter) {
            for (const kc of knownCenters) {
              if (doesSheetTitleMatchCenter(bestResult.title, kc)) {
                resolvedCenter = kc;
                break;
              }
            }
          }
          if (!resolvedCenter) {
            resolvedCenter = bestResult.title || "Pune Center";
          }
        } else {
          // If no sheet contains this batch, select the best matched sheet for this center
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

      // Step 3: Concurrently check Extra Class Sheet for all extra lectures for this batch
      let matchingExtraClasses: any[] = [];
      try {
        const extraPayload = await fetchAllExtraClassLectures(sheets, forceRefresh);
        const allMatchingExtra = (extraPayload.classes || []).filter((ec: any) =>
          isBatchMatch(ec.batchCode, "", batchCode)
        );

        // Filter strictly to Yesterday, Today, and Tomorrow (discarding all old historical classes like August 2025)
        const relevantExtra = allMatchingExtra.filter(
          (ec: any) => ec.isYesterday || ec.isToday || ec.isTomorrow
        );

        // Chronological sort: Yesterday -> Today -> Tomorrow, then by start time
        const dateOrder = (item: any) => {
          if (item.isYesterday) return 1;
          if (item.isToday) return 2;
          if (item.isTomorrow) return 3;
          return 4;
        };

        relevantExtra.sort((a: any, b: any) => {
          const orderDiff = dateOrder(a) - dateOrder(b);
          if (orderDiff !== 0) return orderDiff;
          return (a.inTime || "").localeCompare(b.inTime || "");
        });

        matchingExtraClasses = relevantExtra.map((ec: any) => {
          let dateTag: 'YESTERDAY' | 'TODAY' | 'TOMORROW' = 'TODAY';
          if (ec.isYesterday) dateTag = 'YESTERDAY';
          else if (ec.isTomorrow) dateTag = 'TOMORROW';

          return {
            id: ec.id,
            center: ec.center,
            batchCode: ec.batchCode,
            day: ec.day,
            date: ec.displayDate || ec.rawDate,
            timeRange: ec.timeRange,
            teacherName: ec.teacherName || ec.facultyCode || "Faculty",
            subject: ec.subject || "Extra Lecture",
            room: ec.room || "Room TBA",
            announcement: ec.announcement || "",
            announcementStatus: ec.rawStatus || (ec.isDone ? "Done" : "Pending"),
            isDone: !!ec.isDone,
            isToday: !!ec.isToday,
            isTomorrow: !!ec.isTomorrow,
            isYesterday: !!ec.isYesterday,
            isUpcoming: !!ec.isUpcoming,
            isPast: !!ec.isPast,
            dateTag,
          };
        });
      } catch (extraErr: any) {
        console.warn("Could not query extra class sheet for batch-schedule:", extraErr.message);
      }

      // Step 4: Check Audit Sheet for any issues/pendency for this batch
      let matchingAuditIssues: any[] = [];
      try {
        if (sheets) {
          const auditPayload = await fetchAuditSheetWithCache(sheets, forceRefresh);
          if (auditPayload && Array.isArray(auditPayload.records)) {
            matchingAuditIssues = auditPayload.records
              .filter((r: any) => isBatchMatch(r.batchName, "", batchCode))
              .map((r: any) => ({
                id: r.id,
                subsheet: r.subsheet,
                branch: r.branch,
                batchName: r.batchName,
                subjectName: r.subjectName,
                lecStartTime: r.lecStartTime,
                finalBm: r.finalBm,
                errors: r.errors || "Issue pending verification",
                hasError: !!r.hasError,
              }));
          }
        }
      } catch (auditErr: any) {
        console.warn("Could not query audit sheet for batch-schedule:", auditErr.message);
      }

      const { now, dateStr: todayDate, dayStr: todayDay } = getIstDateInfo();
      const currentYearStr = String(now.getFullYear());
      const todayIso = parseDateToIso(todayDate, currentYearStr) || now.toISOString().substring(0, 10);
      foundLectures = filterCurrentOrLatestWeekLectures(foundLectures, todayIso);

      // Deduplicate foundLectures across Raw_DB and Extra Class sheet
      foundLectures = deduplicateLectures(foundLectures);

      // Sort foundLectures by Day of Week (Mon -> Sun), then by start time
      const dayWeight: Record<string, number> = {
        MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6, SUN: 7
      };
      foundLectures.sort((a, b) => {
        const aD = (a.day || "").trim().substring(0, 3).toUpperCase();
        const bD = (b.day || "").trim().substring(0, 3).toUpperCase();
        const wA = dayWeight[aD] || 99;
        const wB = dayWeight[bD] || 99;
        if (wA !== wB) return wA - wB;
        return (a.startTime || "").localeCompare(b.startTime || "");
      });

      const todayLectures = foundLectures.filter((l) => l.isToday);

      const daysSet = new Set<string>();
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
        totalWeeklyLectures: foundLectures.length,
        extraClasses: matchingExtraClasses,
        auditIssues: matchingAuditIssues,
      });
    } catch (error: any) {
      console.error("API Error (batch-schedule):", error);
      res.status(error.message.includes("Authorization") ? 401 : 500).json({
        error: error.message || "Failed to fetch batch schedule from Raw_DB.",
      });
    }
  });

  // API: Get and update center timetable mappings
  app.get("/api/timetable/mappings", async (req, res) => {
    try {
      const auth = getGoogleAuth(req);
      const sheets = google.sheets({ version: "v4", auth });
      const centers = (req.query.centers as string)?.split(",").filter(Boolean) || [];

      // Fetch titles for all 9 sheets in parallel
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

      // Attempt smart title matching for centers that don't have an exact match yet
      for (const c of centers) {
        if (!centerTimetableMap[c] || centerTimetableMap[c].matchedConfidence === "unassigned") {
          const match = sheetsMeta.find((meta) => doesSheetTitleMatchCenter(meta.title, c));
          if (match) {
            centerTimetableMap[c] = {
              centerName: c,
              spreadsheetId: match.sId,
              spreadsheetTitle: match.title,
              hasRawDb: true,
              matchedConfidence: "high",
            };
          }
        }
      }

      res.json({
        mappings: centerTimetableMap,
        availableSheets: sheetsMeta,
      });
    } catch (error: any) {
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
        matchedConfidence: "manual",
      };
      res.json({ success: true, mapping: centerTimetableMap[centerName] });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update timetable mapping." });
    }
  });

  // Custom Module Configurations & Endpoint (Extra Class, Test Announcement, City Test, Batch Overlook, MIP Batches)
  const customModuleCache = new Map<string, { data: any; timestamp: number }>();

  const CUSTOM_MODULE_MAP: Record<string, {
    id: string;
    title: string;
    shortTitle: string;
    spreadsheetId: string;
    gid: string;
    targetSheetTitle?: string;
    badge: string;
    description: string;
  }> = {
    'extra-class': {
      id: 'extra-class',
      title: 'Extra Class',
      shortTitle: 'Extra Class',
      spreadsheetId: '1f5HNSsjR_08dDDVvFoqrG40SaKdxhgbRnhD8cp7gY_4',
      gid: '15540423',
      badge: 'Extra Class',
      description: 'Special & Extra Lecture Schedules for Pune Batches'
    },
    'test-announcement': {
      id: 'test-announcement',
      title: 'Test Announcement',
      shortTitle: 'Test Announcement',
      spreadsheetId: '1vDmONGVnul5yt-zHMdVBXkzP-FllP1KHXahpEw484TQ',
      gid: '1002186338',
      badge: 'Announcements',
      description: 'Upcoming Test Schedules, Dates & Syllabus for Pune Center'
    },
    'city-test': {
      id: 'city-test',
      title: 'City Test',
      shortTitle: 'City Test',
      spreadsheetId: '14JW6teDhy6p4ToEMf053VGYBdDC8sWO7JV54uM8m9Kg',
      gid: '844497176',
      badge: 'City Test',
      description: 'City-Level Mock Tests, Venues & Batch Allocations'
    },
    'batch-overlook': {
      id: 'batch-overlook',
      title: 'Batch Overlook',
      shortTitle: 'Batch Overlook',
      spreadsheetId: '1Z5Bt6ObwLO3rleW-NYOMvYXMwhrl4Gy7Nk3b-DhRPfY',
      targetSheetTitle: 'Batch level - Overlook Sheet 2 ( Vidyapeeth )',
      gid: '1684539633',
      badge: 'Overlook',
      description: 'Batch Performance, Tracking, and High-Level Status Overview'
    },
    'mip-batches': {
      id: 'mip-batches',
      title: 'MIP Batches',
      shortTitle: 'MIP Batches',
      spreadsheetId: '1W6u_PJSFcs5KjzfW05FCI2aOU2Xc9j_EhyEwIczpXek',
      gid: '529627573',
      badge: 'MIP',
      description: 'Most Important Program (MIP) Batches, Mentors & Allocations'
    },
    'audit-sheet': {
      id: 'audit-sheet',
      title: 'Audit Sheet',
      shortTitle: 'Audit Sheet',
      spreadsheetId: '1ZXz1LySgzYL06gNbM7N8jCbnTOyVGiHQ0I596F-Sq_k',
      gid: '1232755258',
      badge: 'Audit',
      description: 'Academic & Content Audit for Pune Batches'
    }
  };

  app.get("/api/custom-modules/data", async (req, res) => {
    try {
      const moduleId = (req.query.moduleId as string) || 'extra-class';
      const config = CUSTOM_MODULE_MAP[moduleId];
      if (!config) {
        return res.status(400).json({ error: `Invalid moduleId: ${moduleId}` });
      }

      const forceRefresh = req.query.refresh === 'true';
      const cacheKey = `${moduleId}-${config.spreadsheetId}-${config.gid}`;
      const cached = customModuleCache.get(cacheKey);
      if (!forceRefresh && cached && Date.now() - cached.timestamp < 3 * 60 * 1000) {
        return res.json(cached.data);
      }

      const auth = getGoogleAuth(req);
      const sheets = google.sheets({ version: "v4", auth });

      // 1. Get metadata to locate sheet name by targetSheetTitle or gid
      const metaRes = await sheets.spreadsheets.get({
        spreadsheetId: config.spreadsheetId,
      });

      const sheetsList = metaRes.data.sheets || [];
      let matchedSheet: any = null;

      if ((config as any).targetSheetTitle) {
        const targetTitleLower = (config as any).targetSheetTitle.toLowerCase().trim();
        matchedSheet = sheetsList.find(s => {
          const t = (s.properties?.title || '').toLowerCase().trim();
          return t === targetTitleLower || t.includes(targetTitleLower) || targetTitleLower.includes(t);
        });
      }

      if (!matchedSheet && config.gid) {
        const targetGidNum = Number(config.gid);
        matchedSheet = sheetsList.find(s => s.properties?.sheetId === targetGidNum);
      }

      if (!matchedSheet) {
        matchedSheet = sheetsList[0];
      }

      const sheetTitle = matchedSheet?.properties?.title || "Sheet1";
      const spreadsheetTitle = metaRes.data.properties?.title || config.title;

      // 2. Fetch sheet values
      const valuesRes = await sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId,
        range: `'${sheetTitle}'!A1:ZZ`,
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

      // 3. Detect header row (first row with >= 2 non-empty cells)
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
        const nonEmpty = rawRows[i].filter(c => c !== undefined && c !== null && String(c).trim() !== "");
        if (nonEmpty.length >= 2) {
          headerRowIndex = i;
          break;
        }
      }

      // Trim trailing empty header columns
      const rawHeaderRow = rawRows[headerRowIndex] || [];
      let lastHeaderCol = rawHeaderRow.length - 1;
      while (lastHeaderCol > 0 && !String(rawHeaderRow[lastHeaderCol] || '').trim()) {
        lastHeaderCol--;
      }
      const trimmedRawHeaders = rawHeaderRow.slice(0, Math.min(lastHeaderCol + 1, 50));

      const rawHeaders = trimmedRawHeaders.map((h: any, i: number) => {
        const val = String(h || "").trim();
        return val || `Col_${i + 1}`;
      });

      // De-duplicate headers
      const seenHeaders = new Set<string>();
      const headers = rawHeaders.map((h: string) => {
        let uniqueH = h;
        let counter = 1;
        while (seenHeaders.has(uniqueH)) {
          uniqueH = `${h}_${counter++}`;
        }
        seenHeaders.add(uniqueH);
        return uniqueH;
      });

      // 4. Map data rows
      const dataRows: Record<string, string>[] = [];
      for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
        const rowArr = rawRows[r] || [];
        const isAllEmpty = rowArr.every((c: any) => c === undefined || c === null || String(c).trim() === "");
        if (isAllEmpty) continue;

        const rowObj: Record<string, string> = {
          _rowIndex: String(r + 1),
        };
        headers.forEach((h: string, colIdx: number) => {
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
    } catch (err: any) {
      console.error("API Error (/api/custom-modules/data):", err);
      res.status(500).json({ error: err.message || "Failed to fetch custom module sheet data." });
    }
  });

  // ==========================================
  // Extra Classes Aggregator & Live Update APIs
  // ==========================================
  app.get("/api/extra-classes/schedule", async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      let sheets: any = null;
      try {
        const auth = getGoogleAuth(req);
        sheets = google.sheets({ version: "v4", auth });
      } catch {
        // Viewing uses direct Google Docs CSV export (0 API quota), auth is optional
      }
      const payload = await fetchAllExtraClassLectures(sheets, forceRefresh);
      res.json(payload);
    } catch (err: any) {
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
      const col = statusColLetter || "O";
      const range = `'${sheetTitle}'!${col}${rowIndex}`;

      const newStatus = status !== undefined ? String(status) : "Done";

      await sheets.spreadsheets.values.update({
        spreadsheetId: targetSheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[newStatus]],
        },
      });

      // Update extra class in-memory cache directly without clearing, avoiding rate-limit hits
      const cacheKey = `extra-classes-${targetSheetId}`;
      const cached = extraClassCache.get(cacheKey);
      if (cached && cached.data && Array.isArray(cached.data.classes)) {
        const isDone = newStatus.toLowerCase().includes("done");
        for (const cls of cached.data.classes) {
          if (cls.sheetTitle === sheetTitle && Number(cls.rowIndex) === Number(rowIndex)) {
            cls.rawStatus = newStatus;
            cls.isDone = isDone;
            break;
          }
        }
        cached.data.counts = {
          ...cached.data.counts,
          done: cached.data.classes.filter((c: any) => c.isDone).length,
          pending: cached.data.classes.filter((c: any) => !c.isDone).length,
        };
        cached.timestamp = Date.now();
      }

      res.json({
        success: true,
        updatedRange: range,
        sheetTitle,
        rowIndex,
        status: newStatus,
      });
    } catch (err: any) {
      console.error("API Error (/api/extra-classes/mark-done):", err);
res.status(500).json({ error: err.message || "Failed to mark extra class status in Google Sheets." });
    }
  });

  // ==========================================
  // Audit Sheet API (calls shared fetchAuditSheetWithCache)
  // ==========================================
  app.get("/api/audit-sheet", async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === "true";
      const auth = getGoogleAuth(req);
      const sheets = google.sheets({ version: "v4", auth });
      const payload = await fetchAuditSheetWithCache(sheets, forceRefresh);
      res.json(payload);
    } catch (err: any) {
      console.error("API Error (/api/audit-sheet):", err);
      res.status(500).json({ error: err.message || "Failed to fetch audit sheet data." });
    }
  });

  // API: AI Decode Batch Code Helper
  app.post("/api/ai/explain", async (req, res) => {
    const { batchCode, tabName, category, phase, timeSlot, bmEmail, todayLectures, allLectures, auditIssues, extraClasses } = req.body || {};
    if (!batchCode) {
      return res.status(400).json({ error: "Batch Code is required" });
    }

    const { dateStr: todayDate, dayStr: todayDay } = getIstDateInfo();

    let scheduleContext = "";
    if (Array.isArray(todayLectures) && todayLectures.length > 0) {
      scheduleContext = `\n### 📅 TODAY'S LECTURES (${todayDay}, ${todayDate} from ${tabName || "Center"} 'Raw_DB'):\n` +
        todayLectures.map((l: any, i: number) =>
          `- **Lecture ${i + 1} (${l.timeRange || `${l.startTime} - ${l.endTime}`})**: Subject: **${l.subject || "Subject TBD"}** | Faculty: **${l.facultyCode || "TBD"}** | Teacher Email: **${l.teacherEmail || "Not Listed"}**`
        ).join("\n");
    } else if (Array.isArray(allLectures) && allLectures.length > 0) {
      scheduleContext = `\n### 📅 WEEKLY TIMETABLE OVERVIEW (from ${tabName || "Center"} 'Raw_DB'):\n` +
        `No lectures scheduled for today (${todayDay}, ${todayDate}). Total lectures scheduled this week: ${allLectures.length}.\nUpcoming scheduled classes:\n` +
        allLectures.slice(0, 4).map((l: any, i: number) =>
          `- ${l.day} (${l.timeRange || `${l.startTime} - ${l.endTime}`}): Subject: **${l.subject || "General"}** | Faculty: **${l.facultyCode || "TBD"}** | Email: **${l.teacherEmail || "N/A"}**`
        ).join("\n");
    } else {
      scheduleContext = `\n*(Note: No live timetable rows found for ${batchCode} in ${tabName || "Center"} 'Raw_DB' subsheet.)*`;
    }

    let auditContext = "";
    if (Array.isArray(auditIssues) && auditIssues.length > 0) {
      auditContext = `\n### ⚠️ AUDIT ISSUES & PENDENCY RECORDED (${auditIssues.length}):\n` +
        auditIssues.map((iss: any, i: number) =>
          `- **Issue ${i + 1} [${iss.subsheet || "Audit"}]**: Date/Time: **${iss.lecStartTime || "Recent"}** | Subject: **${iss.subjectName || "N/A"}** | Issue: **${iss.errors}** | Assigned BM: **${iss.finalBm || "N/A"}**`
        ).join("\n");
    } else {
      auditContext = `\n### ✅ AUDIT STATUS: No audit errors or pendency recorded for this batch.`;
    }

    let extraClassContext = "";
    if (Array.isArray(extraClasses) && extraClasses.length > 0) {
      extraClassContext = `\n### 📌 RECENT EXTRA CLASSES (YESTERDAY / TODAY / TOMORROW) & ANNOUNCEMENT STATUS (${extraClasses.length}):\n` +
        extraClasses.map((ec: any, i: number) =>
          `- **Extra Lecture ${i + 1} (${ec.dateTag || (ec.isToday ? "TODAY" : ec.isTomorrow ? "TOMORROW" : "YESTERDAY")} • ${ec.date} • ${ec.timeRange})**: Subject: **${ec.subject}** | Faculty: **${ec.teacherName}** | Room: **${ec.room}** | Announcement Status: **${ec.isDone ? "✓ ANNOUNCEMENT DONE (Column O)" : "⚠️ ANNOUNCEMENT PENDING (Column O)"}**`
        ).join("\n");
    } else {
      extraClassContext = `\n### 📌 EXTRA CLASSES: No extra classes scheduled for yesterday, today, or tomorrow for this batch.`;
    }

    const fallbackText = `### 📋 Batch Details: **${batchCode}**
      
*   **Active Center / Tab:** ${tabName || "General Center"}
*   **Target Stream:** ${category || "General Studies"}
*   **Phase:** ${phase || "Standard Phase"}
*   **Timing Shift:** ${timeSlot || "Not specified"}
*   **Manager Assigned:** ${bmEmail || "No Manager Assigned"}

${scheduleContext}

${auditContext}

${extraClassContext}

#### 🔍 Academic Breakdown:
- **Class / Level:** ${batchCode.includes("LJ") || batchCode.includes("LN") ? "Lakshya Series (Grade 12 / Board + Competitive Prep)" : batchCode.includes("AJ") || batchCode.includes("AN") ? "Arjuna Series (Grade 11 / Advanced Foundation)" : batchCode.includes("Y") ? "Yakeen Series (Dropper / Dedicated Repeater)" : "Specialized Program"}
- **Shifts & Timings:** ${timeSlot === "Morning" ? "Morning Shift (MA/MP)" : timeSlot === "Afternoon" ? "Afternoon Shift (NA/NP)" : timeSlot === "Evening" ? "Evening Shift (EA/EP)" : timeSlot === "Weekend" ? "Weekend Batch (WA)" : "Standard Schedule"}

#### 📅 Timetable Summary:
- Live classes, subjects, extra lectures, and teacher emails are extracted directly from Raw_DB and Extra Class sheets above.`;

    const openRouterKey = (process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || "").trim();

    // If API key is missing, provide rich rule-based fallback response
    if (!openRouterKey) {
      return res.json({ explanation: fallbackText });
    }

    try {
      // Construct prompt for AI
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

${auditContext}

${extraClassContext}

Please provide a highly polished, professional, and actionable academic briefing in Markdown (STRICTLY IN ENGLISH ONLY):

1. **📅 Today's Live Academic Schedule & Subject Flow**:
   - Clearly detail today's classes: subject (from Column AI), lecture timing, faculty code, and teacher's email (from Column AK).
   - If no lectures are scheduled today, highlight when the next class is and summarize the weekly schedule.
2. **💡 Batch Academic Level & Phase**:
   - Identify grade/class (e.g., Arjuna = 11th, Lakshya = 12th, Yakeen = Droppers, Foundation = 9th/10th), target exam (JEE / NEET / Boards), and phase milestone.
3. **⚠️ Audit Issues & Extra Class Announcements Alert**:
   - Explicitly highlight any audit issues or pendency recorded above (with subsheet, date, and error). If clean, state that no audit issues are pending.
   - Mention any extra class scheduled and whether its announcement is DONE or PENDING.
4. **📋 Batch Manager Action Checklist for Today**:
   - Provide 2-3 specific, tactical steps for ${bmEmail || "the BM"} for today's classes (e.g. verifying attendance, confirming room prep with faculty, ensuring DPP distribution).
5. **💬 Student Daily Reminder Draft (WhatsApp format)**:
   - Provide a concise, ready-to-copy WhatsApp message for students mentioning today's lecture times and subjects in clear English.

Keep the output clean, encouraging, professional, strictly in English, and under 400 words.`;

      if (openRouterKey.startsWith("sk-or-v1-")) {
        const candidateModels = [
          "meta-llama/llama-3.3-70b-instruct:free",
          "qwen/qwen-2.5-72b-instruct:free",
          "mistralai/mistral-7b-instruct:free",
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
                "X-Title": "Pune Batches Copilot",
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
          } catch {}
        }
        // If OpenRouter calls timed out or failed, return fallback immediately!
        // DO NOT call Google SDK with OpenRouter key!
        return res.json({ explanation: fallbackText });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ explanation: response.text || fallbackText });
    } catch (error: any) {
      console.warn("AI Copilot fallback applied:", error.message);
      res.json({ explanation: fallbackText });
    }
  });

  // API: AI Assistant Chat Interface
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history, contextBatch, todayLectures } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      let scheduleText = "";
      if (Array.isArray(todayLectures) && todayLectures.length > 0) {
        scheduleText = " Today's Scheduled Lectures (from Raw_DB): " +
          todayLectures.map((l: any) => `${l.timeRange || l.startTime}: Subject: ${l.subject || "General"} | Faculty: ${l.facultyCode} | Email: ${l.teacherEmail}`).join("; ");
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          reply: `I am currently running in Offline mode. Please configure your \`GEMINI_API_KEY\` in **Settings > Secrets** to enable full conversation reasoning and tactical batch planning!

${scheduleText ? `📅 **Live Schedule Context:**\n${scheduleText}\n\n` : ""}Here is a quick static tip: Keep your Google Drive folders organized by subject (Physics, Chemistry, Math/Biology) and create a separate folder for "DPP Solutions" to minimize student queries!`
        });
      }

      const openRouterKey = (process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || "").trim();

      // Check if key is an OpenRouter key
      if (openRouterKey.startsWith("sk-or-v1-")) {
        const systemPrompt = `You are "Batch Finder Pro AI Copilot", a brilliant academic coordinator and counselor for Physics Wallah (PW) centers. Help the Batch Manager with operational issues, student messaging, organizing Drive files, and answering center-related questions. You have live access to the center timetable from Raw_DB. Keep answers clear, tactical, and brief (under 200 words).
CRITICAL LANGUAGE POLICY: All responses, briefings, action checklists, recommendations, and messages MUST be strictly in 100% professional English. Under no circumstances should you output Hindi, Hinglish, or Devanagari script, even if the user prompts you in Hindi or Hinglish.${
          contextBatch
            ? `\n\nContext: The user is currently viewing batch "${contextBatch.displayName}" (Category: ${contextBatch.category}, Phase: ${contextBatch.phase}, Shift: ${contextBatch.timeSlot}, Manager Assigned: ${contextBatch.bmEmail || "None"}).${scheduleText}`
            : ""
        }`;

        const openRouterMessages: any[] = [
          { role: "system", content: systemPrompt }
        ];

        if (Array.isArray(history)) {
          history.forEach((turn: any) => {
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

        // Try free fast OpenRouter models
        const candidateModels = [
          "meta-llama/llama-3.3-70b-instruct:free",
          "qwen/qwen-2.5-72b-instruct:free",
          "mistralai/mistral-7b-instruct:free",
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
                "X-Title": "Pune Batches Copilot",
              },
              body: JSON.stringify({
                model: candidateModel,
                messages: openRouterMessages,
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
            reply: `(Offline AI Copilot) Here is a quick academic tip for **${contextBatch?.displayName || "this batch"}**:\n\n${scheduleText ? `📅 **Schedule Context:** ${scheduleText}\n\n` : ""}Ensure all lecture study materials, handouts, and DPP keys are uploaded to the corresponding subject drive folder to keep students aligned.`
          });
        }
      }

      // Format conversation history for Gemini
      const formattedContents: any[] = [];
      
      // Inject system instruction in content
      formattedContents.push({
        role: "user",
        parts: [{ text: `System Command: You are "Batch Finder Pro AI Copilot", a brilliant academic coordinator and counselor for Physics Wallah (PW) centers. Help the Batch Manager with operational issues, student messaging, organizing Drive files, and answering center-related questions. You have live access to the center timetable from Raw_DB. Keep answers clear, tactical, and brief (under 200 words). CRITICAL LANGUAGE POLICY: All responses, briefings, action checklists, recommendations, and messages MUST be strictly in 100% professional English. Never output Hindi, Hinglish, or Devanagari script under any circumstances, even if asked in Hindi or Hinglish.` }]
      });
      formattedContents.push({
        role: "model",
        parts: [{ text: "Understood. I will strictly provide all answers, briefings, and communications exclusively in 100% professional English." }]
      });

      // Inject active batch context if available
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

      // Add previous chat history
      if (Array.isArray(history)) {
        history.forEach((turn: any) => {
          if (turn.role && turn.text) {
            formattedContents.push({
              role: turn.role === "user" ? "user" : "model",
              parts: [{ text: turn.text }]
            });
          }
        });
      }

      // Add the final user message
      formattedContents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: formattedContents,
      });

      res.json({ reply: response.text || "I am here to help, but couldn't generate a reply. Please try again." });
    } catch (error: any) {
      console.warn("AI Chat fallback applied:", error.message);
      res.json({
        reply: `I am currently operating in offline mode. Please verify the batch timetable schedule above, and feel free to copy lecture details or draft messages!`
      });
    }
  });

async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vitePkg = "vite";
    const { createServer: createViteServer } = await import(vitePkg);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
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

    server.on("error", (err: any) => {
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

export default app;
