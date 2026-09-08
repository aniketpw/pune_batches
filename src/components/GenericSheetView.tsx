import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  Copy, 
  CheckCheck, 
  Loader2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Database, 
  MapPin, 
  Calendar, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2,
  CalendarCheck2
} from 'lucide-react';
import { AppView, Batch, CustomModuleDataResponse } from '../types';

interface GenericSheetViewProps {
  moduleId: AppView;
  title: string;
  subtitle: string;
  badge: string;
  authToken?: string | null;
  allBatches?: Batch[];
  onBackToBatches: () => void;
}

type TestScopeFilter = 'ACTIVE_CYCLE' | 'UPCOMING_ONLY' | 'PREVIOUS_ONLY' | 'ALL';

// Robust date string to ISO YYYY-MM-DD
function parseDateToIso(str: string): string | null {
  if (!str) return null;
  let s = String(str).trim();
  if (!s) return null;

  // Remove weekday prefix if present (e.g. "Sun, 06-Sep-2026", "Saturday 12/09/2026")
  s = s.replace(/^(mon|tue|wed|thu|fri|sat|sun)[a-z]*[,.\s-]+/i, '').trim();
  // Remove parenthetical notes (e.g. "06-Sep-2026 (Sunday)")
  s = s.replace(/\s*\([^)]*\)/g, '').trim();

  // Excel serial number (e.g. 45000 - 55000)
  const num = Number(s);
  if (!isNaN(num) && num > 40000 && num < 60000) {
    const excelDate = new Date((num - 25569) * 86400 * 1000);
    const y = excelDate.getUTCFullYear();
    const m = String(excelDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(excelDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  // DD-MMM-YYYY or DD-MMM (e.g. 6-Sep-2026, 13-Sep-2026, 6-Sep)
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', sept: '09', oct: '10', nov: '11', dec: '12'
  };
  const mmmMatch = s.match(/^(\d{1,2})[-/\s]+([a-zA-Z]{3,4})[-/\s]*(\d{2,4})?$/);
  if (mmmMatch) {
    const d = mmmMatch[1].padStart(2, '0');
    const monStr = mmmMatch[2].toLowerCase().substring(0, 3);
    const m = monthMap[monStr] || monthMap[mmmMatch[2].toLowerCase()];
    if (m) {
      let y = mmmMatch[3];
      if (!y) y = '2026';
      else if (y.length === 2) y = `20${y}`;
      return `${y}-${m}-${d}`;
    }
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    let y = dmyMatch[3];
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
  }

  // Embedded DD-MMM-YYYY or DD/MM/YYYY in substring
  const embedMmm = s.match(/\b(\d{1,2})[-/\s]+([a-zA-Z]{3,4})[-/\s]*(\d{2,4})?\b/);
  if (embedMmm) {
    const d = embedMmm[1].padStart(2, '0');
    const monStr = embedMmm[2].toLowerCase().substring(0, 3);
    const m = monthMap[monStr];
    if (m) {
      let y = embedMmm[3] || '2026';
      if (y.length === 2) y = `20${y}`;
      return `${y}-${m}-${d}`;
    }
  }

  const embedDmy = s.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b/);
  if (embedDmy) {
    const d = embedDmy[1].padStart(2, '0');
    const m = embedDmy[2].padStart(2, '0');
    let y = embedDmy[3];
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
  }

  return null;
}

// Compute dynamic weekend cycle:
// Returns exact ISOs for 1 Old Saturday/Sunday and 1 Upcoming Saturday/Sunday
function getWeekendWindowIso() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const parts = formatter.formatToParts(now);
  const getPart = (t: string) => parts.find((p) => p.type === t)?.value || '';
  const dayName = getPart('weekday').toLowerCase().substring(0, 3); // "wed"

  const dayIndexMap: Record<string, number> = {
    sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
  };
  const currentDayIdx = dayIndexMap[dayName] ?? 3;

  // Days since last Saturday:
  // If today is Wed (3): (3 - 6 + 7) % 7 = 4 days ago
  const daysSinceOldSat = (currentDayIdx - 6 + 7) % 7;
  const oldSatDate = new Date(now.getTime() - daysSinceOldSat * 24 * 60 * 60 * 1000);
  const oldSunDate = new Date(oldSatDate.getTime() + 1 * 24 * 60 * 60 * 1000);

  // Next Saturday & Sunday (7 days after previous Saturday):
  const upcomingSatDate = new Date(oldSatDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingSunDate = new Date(oldSatDate.getTime() + 8 * 24 * 60 * 60 * 1000);

  const formatIso = (d: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);

  const formatDisplay = (d: Date) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
    }).format(d);

  return {
    oldSatIso: formatIso(oldSatDate),          // e.g. "2026-09-05"
    oldSunIso: formatIso(oldSunDate),          // e.g. "2026-09-06"
    upcomingSatIso: formatIso(upcomingSatDate),  // e.g. "2026-09-12"
    upcomingSunIso: formatIso(upcomingSunDate),  // e.g. "2026-09-13"
    oldWeekendDisplay: `${formatDisplay(oldSatDate)} - ${formatDisplay(oldSunDate)}`,
    upcomingWeekendDisplay: `${formatDisplay(upcomingSatDate)} - ${formatDisplay(upcomingSunDate)}`,
  };
}

export default function GenericSheetView({
  moduleId,
  title,
  subtitle,
  badge,
  authToken,
  allBatches = [],
  onBackToBatches,
}: GenericSheetViewProps) {
  const [data, setData] = useState<CustomModuleDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [puneFilterOnly, setPuneFilterOnly] = useState<boolean>(true);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [copied, setCopied] = useState<boolean>(false);

  // Pagination states to prevent DOM freeze / app hang
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Module-specific filter toggles
  // 1. Batch Overlook: 3 days filter
  const [last3DaysFilter, setLast3DaysFilter] = useState<boolean>(moduleId === 'batch-overlook');
  
  // 2. Weekend Schedule Modules (test-announcement, city-test, mip-batches):
  // User: "Upcoming wala bhi dikhao like ek old saturday sunday or ek new aane wala"
  // User: "MIP batches me bhi same kro like old or new dikhe ek ek saturady and sunday ka"
  const isWeekendScheduleModule = moduleId === 'test-announcement' || moduleId === 'city-test' || moduleId === 'mip-batches';
  const isTestNameTrimModule = moduleId === 'test-announcement' || moduleId === 'city-test';
  const [testScope, setTestScope] = useState<TestScopeFilter>('ACTIVE_CYCLE');

  // Dynamic weekend window calculation
  const weekendWindow = useMemo(() => getWeekendWindowIso(), []);

  // Reset defaults on module change
  useEffect(() => {
    setLast3DaysFilter(moduleId === 'batch-overlook');
    setTestScope('ACTIVE_CYCLE');
    setCurrentPage(1);
    setSearchQuery('');
    setSortColumn(null);
  }, [moduleId]);

  // Exact Pune batch lookup built from user's loaded workspace batches
  const puneBatchLookup = useMemo(() => {
    const exactCodes = new Set<string>();
    const coreCodes = new Set<string>();
    const fullNormalizedNames = new Set<string>();

    allBatches.forEach((b) => {
      const candidates = [b.displayName, b.fullName, b.batchId].filter(Boolean);
      candidates.forEach((raw) => {
        const s = String(raw).toUpperCase().trim();
        if (!s) return;

        // 1. Match standard full Pune batch code: 27-XXXX, T27-XXXX, S41-XXXX, S91-XXXX, S98-XXXX
        const puneCodeMatch = s.match(/\b(T?27-[A-Z0-9]+|S(?:41|91|98)-[A-Z0-9]+)\b/);
        if (puneCodeMatch) {
          const code = puneCodeMatch[1];
          exactCodes.add(code);
          const dashIdx = code.indexOf('-');
          if (dashIdx !== -1) {
            coreCodes.add(code.substring(dashIdx + 1));
          }
        }

        // 2. If code in workspace didn't have 27- prefix (e.g. "LN151MA" or "AJ131MA")
        const coreMatch = s.match(/\b([A-Z]{2}\d{2,4}[A-Z]{2})\b/);
        if (coreMatch) {
          coreCodes.add(coreMatch[1]);
          exactCodes.add(`27-${coreMatch[1]}`);
          exactCodes.add(`T27-${coreMatch[1]}`);
        }

        // 3. Clean full name (without year e.g. "VIDYAPEETH 27-LN151MA")
        const cleanName = s.replace(/\s*20\d{2}\s*$/i, '').replace(/\s+/g, ' ').trim();
        if (
          cleanName &&
          (cleanName.includes('27-') ||
            cleanName.includes('T27-') ||
            cleanName.includes('S41') ||
            cleanName.includes('S91') ||
            cleanName.includes('S98'))
        ) {
          fullNormalizedNames.add(cleanName);
        }
      });
    });

    return { exactCodes, coreCodes, fullNormalizedNames };
  }, [allBatches]);

  const fetchData = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/custom-modules/data?moduleId=${moduleId}${forceRefresh ? '&refresh=true' : ''}`, {
        headers,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch data for ${title}`);
      }

      const json = await res.json();
      setData(json);
      setCurrentPage(1);
    } catch (err: any) {
      console.error(`Error loading ${moduleId}:`, err);
      setError(err.message || 'Could not load sheet data. Please make sure you are signed in.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [moduleId, authToken]);

  // Validation: Eliminate blank / empty rows completely
  const isMeaningfulRow = (row: Record<string, string>): boolean => {
    let filledCount = 0;
    for (const [k, v] of Object.entries(row)) {
      if (k.startsWith('_')) continue;
      const clean = String(v || '').trim();
      if (clean && clean !== '-' && clean !== '—' && clean !== 'N/A' && clean !== 'null' && clean !== 'undefined') {
        filledCount++;
      }
    }
    return filledCount >= 2;
  };

  // Pune detection rule
  // User: "batch overlook tabhi dikhao jab mere Pune batches se mile pura wrna nhi thik hain ise sahi kar dena ek dam"
  const isPuneRow = (row: Record<string, string>): boolean => {
    // Check batch column value first
    const batchColVal = String(
      row['BATCH NAME'] || 
      row['BATCH'] || 
      row['Batch Name'] || 
      row['Batch'] || 
      row['BATCH_NAME'] || 
      ''
    ).toUpperCase().trim();

    const raw = (row._rawText || Object.values(row).join(' ')).toUpperCase().trim();
    const target = batchColVal || raw;

    // 1. HARD REJECTION: If target explicitly contains another center's ID
    // Negative lookahead (?!(?:27|T27|S41|S91|S98)\b) matches any center other than Pune (e.g. 46-, 65-, 26-, etc.)
    if (/\b(?!(?:27|T27|S41|S91|S98)\b)[A-Z0-9]{2,3}-[A-Z0-9]{3,}\b/.test(target)) {
      return false;
    }

    // 2. Strict matching against user's loaded Pune batches
    const { exactCodes, coreCodes, fullNormalizedNames } = puneBatchLookup;

    if (exactCodes.size > 0 || coreCodes.size > 0) {
      // Check if target has an exact Pune batch code
      const m = target.match(/\b(T?27-[A-Z0-9]+|S(?:41|91|98)-[A-Z0-9]+)\b/);
      if (m) {
        const rowCode = m[1];
        if (exactCodes.has(rowCode)) return true;
        const dashIdx = rowCode.indexOf('-');
        if (dashIdx !== -1 && coreCodes.has(rowCode.substring(dashIdx + 1))) {
          return true;
        }
      }

      // Check full normalized names
      for (const name of fullNormalizedNames) {
        if (name.length >= 6 && target.includes(name)) {
          return true;
        }
      }

      // Check if any exact code is contained in target
      for (const code of exactCodes) {
        if (code.length >= 6 && target.includes(code)) {
          return true;
        }
      }

      // For Batch Overlook: User explicitly instructed:
      // "batch overlook tabhi dikhao jab mere Pune batches se mile pura wrna nhi"
      // If we have user's Pune batches loaded and this row does NOT match any of them, strictly reject!
      if (moduleId === 'batch-overlook') {
        return false;
      }
    }

    // 3. Fallback for other modules or before batches load:
    // Only accept genuine Pune batch codes
    if (/\b27-[A-Z0-9]{4,}\b/.test(target) || /\bT27-[A-Z0-9]{4,}\b/.test(target)) {
      return true;
    }
    if (/\bS(?:41|91|98)-[A-Z0-9]{4,}\b/.test(target)) {
      return true;
    }

    // Explicit Pune Center keywords
    if (
      target.includes('PUNE') ||
      target.includes('PCMC') ||
      target.includes('HADAPSAR') ||
      target.includes('VIMAN') ||
      target.includes('KOTHRUD') ||
      target.includes('FC ROAD') ||
      target.includes('CAMP') ||
      target.includes('PIMPLE SAUDAGAR')
    ) {
      return true;
    }

    return false;
  };

  // Helper to extract ISO date from a row
  const extractRowDate = (row: Record<string, string>): string | null => {
    // 1. Check columns with 'date', 'day', 'schedule', 'dt' in header
    for (const key of Object.keys(row)) {
      if (key.startsWith('_')) continue;
      const lower = key.toLowerCase();
      if (lower.includes('date') || lower.includes('day') || lower.includes('schedule') || lower.includes('dt')) {
        const iso = parseDateToIso(row[key]);
        if (iso) return iso;
      }
    }

    // 2. Check each cell value for a parsable date
    for (const [key, val] of Object.entries(row)) {
      if (key.startsWith('_')) continue;
      const iso = parseDateToIso(val);
      if (iso) return iso;
    }

    // 3. Check full row text for date regex
    const raw = row._rawText || Object.values(row).join(' ');
    const dMatch = raw.match(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/) || raw.match(/\b\d{1,2}[-\s]+[A-Za-z]{3,4}[-\s]*\d{2,4}?\b/);
    if (dMatch) {
      return parseDateToIso(dMatch[0]);
    }

    return null;
  };

  // Extract distinct dates for Batch Overlook (3 days filter)
  const allowed3Dates = useMemo(() => {
    if (moduleId !== 'batch-overlook' || !data?.rows) return new Set<string>();
    const datesSet = new Set<string>();
    data.rows.forEach((r) => {
      if (isMeaningfulRow(r) && isPuneRow(r)) {
        const iso = extractRowDate(r);
        if (iso) datesSet.add(iso);
      }
    });
    const sorted = Array.from(datesSet).sort().reverse();
    return new Set(sorted.slice(0, 3));
  }, [moduleId, data, puneBatchLookup]);

  // Column visibility filter:
  // User: "isme sirf tag name tak dikhna 'Test Announcement' me or same City Test me bhi"
  // Keep columns up to and including 'TEST NAME' for test-announcement and city-test
  const visibleHeaders = useMemo(() => {
    if (!data?.headers) return [];
    if (isTestNameTrimModule) {
      const testNameIdx = data.headers.findIndex((h) => {
        const lower = h.toLowerCase().trim();
        return (
          lower === 'test name' ||
          lower === 'test_name' ||
          lower.includes('test name') ||
          lower.includes('tag name')
        );
      });
      if (testNameIdx !== -1) {
        return data.headers.slice(0, testNameIdx + 1);
      }
    }
    return data.headers;
  }, [data, isTestNameTrimModule]);

  // Pune count among meaningful rows
  const puneCount = useMemo(() => {
    if (!data?.rows) return 0;
    return data.rows.filter(isMeaningfulRow).filter(isPuneRow).length;
  }, [data, puneBatchLookup, moduleId]);

  // Filtered & Sorted Rows
  const processedRows = useMemo(() => {
    if (!data || !data.rows) return [];

    // 1. Strict Meaningful Row Filter: Eliminate ALL empty rows
    let rows = data.rows.filter(isMeaningfulRow);

    // 2. Pune Filter & Module-specific Pune Batch matching
    // User: "batch overlook tabhi dikhao jab mere Pune batches se mile pura wrna nhi thik hain ise sahi kar dena ek dam"
    if (moduleId === 'batch-overlook') {
      rows = rows.filter(isPuneRow);
    } else if (puneFilterOnly && puneCount > 0) {
      rows = rows.filter(isPuneRow);
    }

    // 3. Batch Overlook: 3 Days Filter ("sirf 3 din ka dikhna if rhega pune ka to thik hain")
    if (moduleId === 'batch-overlook' && last3DaysFilter && allowed3Dates.size > 0) {
      rows = rows.filter((r) => {
        const iso = extractRowDate(r);
        return iso ? allowed3Dates.has(iso) : true;
      });
    }

    // 4. Weekend Schedule Modules (test-announcement, city-test, mip-batches):
    // Dynamic Old Saturday/Sunday + Upcoming Saturday/Sunday
    // User: "Upcoming wala bhi dikhao like ek old saturday sunday or ek new aane wala"
    // User: "MIP batches me bhi same kro like old or new dikhe ek ek saturady and sunday ka"
    if (isWeekendScheduleModule && testScope !== 'ALL') {
      const { oldSatIso, upcomingSunIso, upcomingSatIso, oldSunIso } = weekendWindow;

      rows = rows.filter((r) => {
        const iso = extractRowDate(r);
        if (!iso) {
          // If row explicitly mentions Saturday or Sunday
          const raw = (r._rawText || Object.values(r).join(' ')).toUpperCase();
          if (raw.includes('SATURDAY') || raw.includes('SUNDAY')) {
            return testScope === 'ACTIVE_CYCLE';
          }
          return false; // Exclude rows with no date in weekend cycle
        }

        const isOldWeekend = iso === oldSatIso || iso === oldSunIso;
        const isUpcomingWeekend = iso === upcomingSatIso || iso === upcomingSunIso;

        if (testScope === 'ACTIVE_CYCLE') {
          // Both: 1 old weekend (5-6 Sep) + 1 upcoming weekend (12-13 Sep)
          if (isOldWeekend || isUpcomingWeekend) return true;
          // Fallback if dates in sheet are between oldSat and upcomingSun and on a weekend day
          if (iso >= oldSatIso && iso <= upcomingSunIso) {
            try {
              const d = new Date(iso + 'T00:00:00').getDay();
              if (d === 0 || d === 6) return true;
            } catch {}
          }
          return false;
        } else if (testScope === 'UPCOMING_ONLY') {
          // Only upcoming weekend
          if (isUpcomingWeekend) return true;
          if (iso >= upcomingSatIso && iso <= upcomingSunIso) return true;
          return false;
        } else if (testScope === 'PREVIOUS_ONLY') {
          // Only previous weekend
          if (isOldWeekend) return true;
          if (iso >= oldSatIso && iso <= oldSunIso) return true;
          return false;
        }

        return true;
      });
    }

    // 5. Text Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toUpperCase().trim();
      rows = rows.filter((r) => (r._rawText || Object.values(r).join(' ')).toUpperCase().includes(q));
    }

    // 6. Sort (Fixed: Never hide data or put blanks at top)
    if (sortColumn) {
      rows = [...rows].sort((a, b) => {
        const valA = String(a[sortColumn] || '').trim();
        const valB = String(b[sortColumn] || '').trim();

        // Push empty cells to bottom
        if (!valA && valB) return 1;
        if (valA && !valB) return -1;
        if (!valA && !valB) return 0;

        // Try date comparison
        const dateA = parseDateToIso(valA);
        const dateB = parseDateToIso(valB);
        if (dateA && dateB) {
          return sortDirection === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
        }

        // Try numeric comparison
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }

        // String comparison
        const cmp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return rows;
  }, [
    data,
    puneFilterOnly,
    puneCount,
    searchQuery,
    sortColumn,
    sortDirection,
    moduleId,
    last3DaysFilter,
    allowed3Dates,
    isWeekendScheduleModule,
    testScope,
    weekendWindow,
    puneBatchLookup,
  ]);

  // Paginated Rows (prevents DOM overload and freezing)
  const totalPages = Math.max(1, Math.ceil(processedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    if (pageSize >= 999999) return processedRows;
    const start = (currentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, currentPage, pageSize]);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleCopyTable = () => {
    if (!data || processedRows.length === 0) return;
    const headers = visibleHeaders;
    let tsv = headers.join('\t') + '\n';
    processedRows.forEach((r) => {
      tsv += headers.map((h) => r[h] || '').join('\t') + '\n';
    });
    navigator.clipboard.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 sm:space-y-4 font-sans animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white border border-[#E2E1DA] rounded-[2px] p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBackToBatches}
            className="p-1.5 sm:p-2 bg-[#FAF9F5] hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-[#E2E1DA] rounded-[2px] transition-all cursor-pointer flex-shrink-0 flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-wider"
            title="Return to Main Batches & Schedule"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Batches</span>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-wider uppercase truncate">
                {title}
              </h1>
              <span className="px-1.5 py-0.5 rounded-[1px] bg-indigo-50 text-indigo-700 border border-indigo-200 text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider">
                {badge}
              </span>
              <span className="px-1.5 py-0.5 rounded-[1px] bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Pune Aligned
              </span>
              {isWeekendScheduleModule && (
                <span className="px-1.5 py-0.5 rounded-[1px] bg-blue-50 text-blue-700 border border-blue-200 text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider">
                  Weekend Cycle Active
                </span>
              )}
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 truncate">
              {subtitle} • {data?.sheetTitle ? `Tab: ${data.sheetTitle}` : 'Loading sheet...'}
            </p>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0 self-end md:self-auto">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isLoading}
            className="px-2.5 py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-white border border-[#E2E1DA] hover:bg-slate-50 text-slate-800 rounded-[2px] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Reload latest live data from Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>

          <button
            type="button"
            onClick={handleCopyTable}
            disabled={processedRows.length === 0}
            className="px-2.5 py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-slate-900 hover:bg-black text-white rounded-[2px] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Copy displayed rows as TSV for Excel"
          >
            {copied ? (
              <>
                <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Copied TSV!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy TSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="bg-white border border-[#E2E1DA] rounded-[2px] p-2.5 sm:p-3.5 space-y-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E1DA] pb-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Pune Filter Button */}
            <button
              type="button"
              onClick={() => {
                setPuneFilterOnly(!puneFilterOnly);
                setCurrentPage(1);
              }}
              className={`px-2 py-1 rounded-[1px] text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1 ${
                puneFilterOnly
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-[#FAF9F5] text-slate-600 border-[#E2E1DA] hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-3 h-3 text-indigo-400" />
              <span>Pune Batches ({puneCount})</span>
            </button>

            {/* Weekend Schedule Module Filter Controls: Old Weekend + Upcoming Weekend */}
            {isWeekendScheduleModule && (
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setTestScope('ACTIVE_CYCLE');
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 rounded-[1px] text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1 ${
                    testScope === 'ACTIVE_CYCLE'
                      ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                      : 'bg-[#FAF9F5] text-slate-600 border-[#E2E1DA] hover:bg-slate-100'
                  }`}
                  title="Show 1 previous weekend (Sat & Sun) + 1 upcoming weekend (Sat & Sun)"
                >
                  <CalendarCheck2 className="w-3 h-3 text-blue-400" />
                  <span>🎯 Old & Upcoming Weekends ({weekendWindow.oldWeekendDisplay} & {weekendWindow.upcomingWeekendDisplay})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTestScope('UPCOMING_ONLY');
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 rounded-[1px] text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                    testScope === 'UPCOMING_ONLY'
                      ? 'bg-indigo-900 text-white border-indigo-900 shadow-2xs'
                      : 'bg-[#FAF9F5] text-slate-600 border-[#E2E1DA] hover:bg-slate-100'
                  }`}
                  title="Only show upcoming weekend records"
                >
                  Upcoming Only ({weekendWindow.upcomingWeekendDisplay})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTestScope('PREVIOUS_ONLY');
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 rounded-[1px] text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                    testScope === 'PREVIOUS_ONLY'
                      ? 'bg-amber-900 text-white border-amber-900 shadow-2xs'
                      : 'bg-[#FAF9F5] text-slate-600 border-[#E2E1DA] hover:bg-slate-100'
                  }`}
                  title="Only show last passed weekend records"
                >
                  Previous Only ({weekendWindow.oldWeekendDisplay})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTestScope('ALL');
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 rounded-[1px] text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                    testScope === 'ALL'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-[#FAF9F5] text-slate-600 border-[#E2E1DA] hover:bg-slate-100'
                  }`}
                  title={moduleId === 'mip-batches' ? 'Show all historical MIP records' : 'Show all historical tests'}
                >
                  {moduleId === 'mip-batches' ? 'All MIP Archive' : 'All Tests Archive'}
                </button>
              </div>
            )}

            {/* Batch Overlook 3-Day Filter Button */}
            {moduleId === 'batch-overlook' && (
              <button
                type="button"
                onClick={() => {
                  setLast3DaysFilter(!last3DaysFilter);
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded-[1px] text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1 ${
                  last3DaysFilter
                    ? 'bg-purple-900 text-white border-purple-900 shadow-2xs'
                    : 'bg-[#FAF9F5] text-slate-600 border-[#E2E1DA] hover:bg-slate-100'
                }`}
                title="Filter to only the latest 3 days of overlook records"
              >
                <Clock className="w-3 h-3 text-purple-400" />
                <span>{last3DaysFilter ? '🕒 Last 3 Days Only' : 'Show All Dates'}</span>
              </button>
            )}
          </div>

          {/* Quick Clear */}
          {(searchQuery || !puneFilterOnly || (moduleId === 'batch-overlook' && !last3DaysFilter) || (isWeekendScheduleModule && testScope !== 'ACTIVE_CYCLE')) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setPuneFilterOnly(true);
                if (moduleId === 'batch-overlook') setLast3DaysFilter(true);
                if (isWeekendScheduleModule) setTestScope('ACTIVE_CYCLE');
                setCurrentPage(1);
              }}
              className="text-[9px] font-black uppercase tracking-wider text-slate-700 hover:text-slate-950 underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={`Search across ${processedRows.length} active records...`}
            className="w-full text-xs pl-8 pr-7 py-1.5 sm:py-2 border border-[#E2E1DA] rounded-[2px] focus:outline-hidden focus:border-slate-950 bg-[#FAF9F5] transition-all font-sans placeholder-slate-400 font-bold uppercase tracking-wider"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-2 sm:top-2.5 text-[9px] text-slate-400 hover:text-slate-900 font-black uppercase tracking-wider cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-white border border-[#E2E1DA] rounded-[2px] p-8 text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
          <div className="text-xs font-black uppercase tracking-wider text-slate-800">
            Loading Live Sheet Records...
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Excluding empty rows and structuring date columns
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && !isLoading && (
        <div className="bg-rose-50 border border-rose-200 rounded-[2px] p-5 text-center space-y-2 text-rose-800">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
          <div className="text-xs font-black uppercase tracking-wider">{error}</div>
          <button
            type="button"
            onClick={() => fetchData(true)}
            className="mt-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-[2px] text-[10px] font-black uppercase tracking-wider cursor-pointer"
          >
            Retry Fetching
          </button>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && !error && data && (
        <div className="bg-white border border-[#E2E1DA] rounded-[2px] overflow-hidden shadow-2xs">
          {processedRows.length === 0 ? (
            <div className="p-10 text-center space-y-2 text-slate-400">
              <Database className="w-8 h-8 mx-auto text-slate-300" />
              <div className="text-xs font-black uppercase tracking-wider text-slate-700">
                No matching rows found
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider">
                {isWeekendScheduleModule && testScope !== 'ALL'
                  ? `No records in the active weekend cycle. Click "${moduleId === 'mip-batches' ? 'All MIP Archive' : 'All Tests Archive'}" to see older records.`
                  : 'Try adjusting your search query or reset filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto select-text">
              <table className="w-full border-collapse text-left font-sans text-xs">
                {/* Table Header */}
                <thead className="bg-[#FAF9F5] border-b border-[#E2E1DA] sticky top-0 z-20 select-none shadow-2xs">
                  <tr>
                    <th className="p-2 text-[8.5px] font-black text-slate-400 uppercase tracking-wider w-10 text-center border-r border-[#E2E1DA]/60">
                      #
                    </th>
                    {visibleHeaders.map((col) => {
                      const isSorted = sortColumn === col;
                      return (
                        <th
                          key={col}
                          onClick={() => handleSort(col)}
                          className="p-2 text-[9px] font-black text-slate-700 hover:text-slate-950 uppercase tracking-wider cursor-pointer border-r border-[#E2E1DA]/60 last:border-r-0 whitespace-nowrap transition-colors"
                        >
                          <div className="flex items-center gap-1">
                            <span>{col}</span>
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ChevronUp className="w-3 h-3 text-indigo-600" />
                              ) : (
                                <ChevronDown className="w-3 h-3 text-indigo-600" />
                              )
                            ) : (
                              <span className="text-slate-300 text-[8px]">↕</span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* Table Body (Render ONLY paginated rows - zero lag) */}
                <tbody className="divide-y divide-[#E2E1DA]">
                  {paginatedRows.map((row, idx) => {
                    const isPune = isPuneRow(row);
                    const globalIdx = (currentPage - 1) * pageSize + idx + 1;

                    return (
                      <tr
                        key={row._rowIndex || idx}
                        className={`hover:bg-slate-50 transition-colors ${
                          isPune ? 'bg-white' : 'bg-slate-50/40 text-slate-500'
                        }`}
                      >
                        <td className="p-2 text-[9px] font-mono text-slate-400 text-center border-r border-[#E2E1DA]/60">
                          {globalIdx}
                        </td>
                        {visibleHeaders.map((col) => {
                          const val = row[col] || '';
                          const isBatchCode =
                            col.toLowerCase().includes('batch') ||
                            /\b27-[A-Z0-9]+/i.test(val) ||
                            /\bT27-[A-Z0-9]+/i.test(val);
                          const isDate =
                            col.toLowerCase().includes('date') ||
                            col.toLowerCase().includes('day') ||
                            /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/.test(val);

                          return (
                            <td
                              key={col}
                              className="p-2 text-xs text-slate-800 border-r border-[#E2E1DA]/60 last:border-r-0 whitespace-nowrap"
                            >
                              {isBatchCode && val ? (
                                <span className="inline-block px-1.5 py-0.2 rounded-[1px] bg-slate-900 text-white font-mono font-bold text-[9.5px] uppercase tracking-wider">
                                  {val}
                                </span>
                              ) : isDate && val ? (
                                <span className="font-mono font-bold text-indigo-700 text-[10.5px]">
                                  {val}
                                </span>
                              ) : (
                                <span className="font-medium text-[11px]">{val || '—'}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer with Pagination Controls */}
          <div className="p-2.5 sm:p-3 bg-[#FAF9F5] border-t border-[#E2E1DA] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[9.5px] sm:text-[10px] text-slate-600 font-bold uppercase tracking-wider">
            {/* Status line */}
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                Showing <strong className="text-slate-900 font-black">{processedRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> - <strong className="text-slate-900 font-black">{Math.min(currentPage * pageSize, processedRows.length)}</strong> of <strong className="text-slate-900 font-black">{processedRows.length}</strong> active rows
              </span>
              {puneFilterOnly && (
                <span className="text-indigo-600">(Pune Filtered)</span>
              )}
              {isWeekendScheduleModule && testScope === 'ACTIVE_CYCLE' && (
                <span className="text-blue-600">• 2 Weekend Cycles Active</span>
              )}
              {moduleId === 'batch-overlook' && last3DaysFilter && (
                <span className="text-purple-600">• 3 Days Active</span>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-[#E2E1DA] rounded-[1px] px-1.5 py-0.5 text-[9.5px] font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 border border-[#E2E1DA] bg-white hover:bg-slate-100 disabled:opacity-40 rounded-[1px] cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-2 py-0.5 text-slate-800 font-mono font-bold">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 border border-[#E2E1DA] bg-white hover:bg-slate-100 disabled:opacity-40 rounded-[1px] cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
