export interface Batch {
  fullName: string;
  displayName: string;
  bmEmail: string;
  adminUrl: string;
  pwUrl: string;
  driveUrl: string;
  matchStatus: string;
  category: 'JEE' | 'NEET' | 'Foundation' | 'Other';
  phase: string;
  timeSlot: string;
  tabName: string;
  rowIndex: number; // 0-based array index or 1-based sheet row number (we will use sheet row index, i.e. array_index + 2)
  batchId?: string;
  previousNames?: string[];
  allRowIndices?: number[];
}

export interface SheetsDataResponse {
  batchesData: Record<string, Batch[]>;
  bms: string[];
}

export type CategoryFilter = 'ALL' | 'JEE' | 'NEET' | 'Foundation' | 'Other';
export type PhaseFilter = 'ALL' | 'Phase 1' | 'Phase 2' | 'Phase 3' | 'Phase 4+';
export type TimeSlotFilter = 'ALL' | 'Morning' | 'Afternoon' | 'Evening' | 'Weekend';

export function getBatchFormattedTitle(batch: { displayName?: string; fullName?: string }): string {
  const raw = (batch.displayName || batch.fullName || "").trim();
  const up = raw.toUpperCase();
  if (up.startsWith("VIDYAPEETH") || up.startsWith("TUITION") || up.startsWith("SIP")) {
    return raw;
  }
  if (up.startsWith("T")) {
    return `Tuition ${raw}`;
  } else if (up.startsWith("S")) {
    return `SIP ${raw}`;
  } else {
    return `Vidyapeeth ${raw}`;
  }
}

export interface LectureSchedule {
  day: string;             // e.g. "Mon", "Tue"
  lectureDate: string;     // e.g. "08-Sep-2026"
  startTime: string;       // e.g. "9:30 AM"
  endTime: string;         // e.g. "10:40 AM"
  timeRange: string;       // e.g. "09:30 AM-/-10:40 AM"
  batchFaculty: string;    // e.g. "S98-AJ31MA 2026-/-PPM"
  batchCode: string;       // e.g. "S98-AJ31MA 2026"
  facultyCode: string;     // e.g. "PPM"
  subject: string;         // Column AI (e.g. "Physics", "Chemistry")
  teacherEmail: string;    // Column AK (e.g. "ppm.faculty@pw.live")
  teacherName?: string;
  room?: string;
  isExtraClass?: boolean;
  announcement?: string;
  isToday: boolean;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface BatchScheduleResponse {
  center: string;
  batchCode: string;
  spreadsheetId: string;
  spreadsheetTitle?: string;
  todayDate: string;
  todayDay: string;
  todayLectures: LectureSchedule[];
  allLectures: LectureSchedule[];
  daysAvailable: string[];
  totalWeeklyLectures: number;
}

export interface CenterTimetableMapping {
  centerName: string;
  spreadsheetId: string;
  spreadsheetTitle?: string;
  hasRawDb?: boolean;
  sampleBatches?: string[];
  matchedConfidence?: 'exact' | 'high' | 'manual' | 'unassigned';
}

export type AppView = 
  | 'batches'
  | 'extra-class'
  | 'test-announcement'
  | 'city-test'
  | 'batch-overlook'
  | 'mip-batches'
  | 'audit-sheet';

export interface CustomModuleConfig {
  id: AppView;
  title: string;
  shortTitle: string;
  spreadsheetId: string;
  gid: string;
  badge: string;
  description: string;
}

export interface CustomModuleDataResponse {
  moduleId: string;
  title: string;
  spreadsheetId: string;
  gid: string;
  sheetTitle: string;
  spreadsheetTitle: string;
  headers: string[];
  rows: Record<string, string>[];
  totalCount: number;
}

export interface ExtraLectureItem {
  id: string;
  spreadsheetId: string;
  sheetTitle: string;
  center: string;
  rowIndex: number;
  statusColLetter: string;
  batchCode: string;
  formattedBatchName: string;
  category: 'JEE' | 'NEET' | 'Foundation' | 'Other';
  phase: string;
  timeSlot: string;
  day: string;
  rawDate: string;
  isoDate: string | null;
  displayDate: string;
  facultyCode: string;
  inTime: string;
  outTime: string;
  timeRange: string;
  classType: string;
  teacherName: string;
  subject: string;
  bmName: string;
  announcement: string;
  room: string;
  rawStatus: string;
  isDone: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  isPast: boolean;
  isUpcoming: boolean;
}

export interface ExtraClassScheduleResponse {
  spreadsheetId: string;
  todayDate: string;
  tomorrowDate: string;
  todayDateDisplay: string;
  tomorrowDateDisplay: string;
  centers: string[];
  classes: ExtraLectureItem[];
  counts: {
    today: number;
    tomorrow: number;
    upcoming: number;
    past: number;
    pending: number;
    done: number;
    total: number;
  };
}

export interface AuditRecord {
  id: string;
  subsheet: string;
  branch: string;
  batchName: string;
  subjectName: string;
  lecStartTime: string;
  finalBm: string;
  errors: string;
  hasError: boolean;
  rowIndex: number;
  rawRow: Record<string, string>;
}

export interface AuditSheetResponse {
  spreadsheetId: string;
  spreadsheetTitle: string;
  subsheets: string[];
  totalPuneCount: number;
  errorCount: number;
  branches: string[];
  records: AuditRecord[];
}


