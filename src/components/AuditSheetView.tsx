import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  Layers, 
  Calendar,
  Building2,
  Clock,
  User,
  BookOpen,
  FileSpreadsheet,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  X,
  Share2,
  ShieldAlert,
  Info
} from 'lucide-react';
import { AuditRecord, AuditSheetResponse } from '../types';

interface AuditSheetViewProps {
  authToken?: string | null;
  onBackToBatches: () => void;
}

type ErrorFilterType = 'ALL' | 'ERRORS_ONLY' | 'CLEAN_ONLY';

export default function AuditSheetView({
  authToken,
  onBackToBatches,
}: AuditSheetViewProps) {
  const [data, setData] = useState<AuditSheetResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedSubsheet, setSelectedSubsheet] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [errorFilter, setErrorFilter] = useState<ErrorFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Record for modal inspection
  const [detailRecord, setDetailRecord] = useState<AuditRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const fetchAuditData = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/audit-sheet${forceRefresh ? '?refresh=true' : ''}`, { headers });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to load audit sheet data.');
      }

      const json: AuditSheetResponse = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Audit sheet fetch error:', err);
      setError(err.message || 'Failed to connect to Google Sheets for Audit data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [authToken]);

  // Standard Target Subsheets requested by user
  const STANDARD_SUBSHEETS = ['Pendency', 'Topic', 'Video', 'Notes', 'Content', 'Teacher'];

  // All available subsheets from data or standard list
  const availableSubsheets = useMemo(() => {
    const list = new Set<string>();
    STANDARD_SUBSHEETS.forEach(s => list.add(s));
    (data?.subsheets || []).forEach(s => list.add(s));
    return Array.from(list);
  }, [data]);

  // Available Pune branches
  const availableBranches = useMemo(() => {
    const defaultBranches = ['PCMC VP', 'HADAPSAR', 'VIMAN NAGAR VP', 'FC ROAD', 'KOTHRUD', 'TC'];
    const set = new Set<string>(defaultBranches);
    (data?.branches || []).forEach(b => {
      if (b) set.add(b);
    });
    return Array.from(set).sort();
  }, [data]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    if (!data?.records) return [];

    return data.records.filter((rec) => {
      // 1. Subsheet Filter
      if (selectedSubsheet !== 'ALL') {
        const targetLower = selectedSubsheet.toLowerCase();
        const recSheetLower = (rec.subsheet || '').toLowerCase();
        if (!recSheetLower.includes(targetLower) && !targetLower.includes(recSheetLower)) {
          return false;
        }
      }

      // 2. Branch Filter
      if (selectedBranch !== 'ALL') {
        if (rec.branch !== selectedBranch && !(rec.branch || '').includes(selectedBranch)) {
          return false;
        }
      }

      // 3. Error Filter
      if (errorFilter === 'ERRORS_ONLY' && !rec.hasError) return false;
      if (errorFilter === 'CLEAN_ONLY' && rec.hasError) return false;

      // 4. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const bName = (rec.batchName || '').toLowerCase();
        const sName = (rec.subjectName || '').toLowerCase();
        const bm = (rec.finalBm || '').toLowerCase();
        const err = (rec.errors || '').toLowerCase();
        const br = (rec.branch || '').toLowerCase();
        const time = (rec.lecStartTime || '').toLowerCase();

        return (
          bName.includes(q) ||
          sName.includes(q) ||
          bm.includes(q) ||
          err.includes(q) ||
          br.includes(q) ||
          time.includes(q)
        );
      }

      return true;
    });
  }, [data, selectedSubsheet, selectedBranch, errorFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const errors = filteredRecords.filter(r => r.hasError).length;
    const clean = total - errors;
    const uniqueBatches = new Set(filteredRecords.map(r => r.batchName).filter(Boolean)).size;
    const uniqueBranches = new Set(filteredRecords.map(r => r.branch).filter(Boolean)).size;

    return { total, errors, clean, uniqueBatches, uniqueBranches };
  }, [filteredRecords]);

  // Subsheet counts map
  const subsheetCounts = useMemo(() => {
    if (!data?.records) return {} as Record<string, number>;
    const counts: Record<string, number> = { ALL: data.records.length };
    
    data.records.forEach(r => {
      const sheet = (r.subsheet || '').toLowerCase();
      availableSubsheets.forEach(sub => {
        if (sheet.includes(sub.toLowerCase())) {
          counts[sub] = (counts[sub] || 0) + 1;
        }
      });
    });

    return counts;
  }, [data, availableSubsheets]);

  const handleCopyText = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${label}!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyReport = () => {
    if (!data) return;
    const nowStr = new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }).format(new Date());

    let report = `📋 *PW PUNE - ACADEMIC & CONTENT AUDIT REPORT*\n`;
    report += `📅 *Generated:* ${nowStr} (IST)\n`;
    report += `📍 *Scope:* Pune Centers Only\n`;
    report += `📑 *Subsheet:* ${selectedSubsheet === 'ALL' ? 'All Subsheets' : selectedSubsheet}\n`;
    report += `🏢 *Branch / Center:* ${selectedBranch === 'ALL' ? 'All Pune Centers' : selectedBranch}\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📊 *Summary Statistics:*\n`;
    report += `• Total Pune Records: ${stats.total}\n`;
    report += `• Total Errors / Pendency: ${stats.errors} ⚠️\n`;
    report += `• Clean Records: ${stats.clean} ✅\n`;
    report += `• Batches Audited: ${stats.uniqueBatches}\n`;
    report += `• Centers Covered: ${stats.uniqueBranches}\n\n`;

    const errorRecords = filteredRecords.filter(r => r.hasError);
    if (errorRecords.length > 0) {
      report += `⚠️ *Actionable Errors & Pendency Items (${errorRecords.length}):*\n`;
      errorRecords.slice(0, 20).forEach((rec, idx) => {
        report += `${idx + 1}. *[${rec.branch}]* ${rec.batchName} - *${rec.subjectName || 'General'}*\n`;
        report += `   ⏰ Time: ${rec.lecStartTime || 'N/A'} | BM: ${rec.finalBm || 'Unassigned'}\n`;
        report += `   ❗ Issue: ${rec.errors}\n`;
      });
      if (errorRecords.length > 20) {
        report += `   ...and ${errorRecords.length - 20} more error items.\n`;
      }
    } else {
      report += `🎉 *Great News:* No pendency or errors found in this filtered view!\n`;
    }

    report += `\n🔗 *Pune Batches Copilot:* https://pune-batches.vercel.app`;

    navigator.clipboard.writeText(report);
    showToast('Audit Report copied to clipboard!');
  };

  const getSubjectColor = (subject: string) => {
    const s = (subject || '').toLowerCase();
    if (s.includes('phy')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (s.includes('chem')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s.includes('math')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (s.includes('bio') || s.includes('bot') || s.includes('zoo')) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-purple-50 text-purple-700 border-purple-200';
  };

  const getBranchColor = (branch: string) => {
    const b = (branch || '').toUpperCase();
    if (b.includes('PCMC')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (b.includes('HADAPSAR')) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (b.includes('VIMAN')) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (b.includes('FC')) return 'bg-violet-50 text-violet-700 border-violet-200';
    if (b.includes('KOTHRUD')) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (b.includes('TC')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#FAF9F5] overflow-y-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-3.5 py-2 rounded shadow-lg text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#E2E1DA] px-4 py-3 sm:px-6 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToBatches}
            className="p-1.5 rounded-[3px] bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
            title="Back to Batches"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 truncate">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                Audit Sheet
              </h1>
              <span className="px-2 py-0.5 rounded-[2px] text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                Pune Centers Only
              </span>
              <span className="px-2 py-0.5 rounded-[2px] text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                6 Subsheets Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              Academic, notes, video & teacher audit filtered strictly for Pune branches
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleCopyReport}
            disabled={isLoading || !data}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-[3px] text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-xs uppercase tracking-wider disabled:opacity-50"
            title="Copy formatted WhatsApp/Telegram report"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Copy Report</span>
          </button>
          <button
            onClick={() => fetchAuditData(true)}
            disabled={isLoading}
            className="p-2 bg-white hover:bg-slate-100 border border-[#E2E1DA] text-slate-700 rounded-[3px] cursor-pointer transition-all disabled:opacity-50"
            title="Sync fresh data from Google Sheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto w-full">
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-[3px] flex items-start gap-3 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold">Error loading Audit Sheet: </strong>
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchAuditData(true)}
              className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-[2px] font-bold text-[10px] uppercase cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Total Pune Records */}
          <div className="bg-white p-3.5 rounded-[3px] border border-[#E2E1DA] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase tracking-wider">
              <span>Total Pune Records</span>
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {isLoading ? '...' : stats.total}
            </div>
            <div className="text-[10px] text-slate-500 font-bold">
              Across {stats.uniqueBranches} Pune branches
            </div>
          </div>

          {/* Card 2: Errors & Pendency */}
          <div className="bg-white p-3.5 rounded-[3px] border border-rose-200 shadow-xs space-y-1 bg-gradient-to-br from-white to-rose-50/30">
            <div className="flex items-center justify-between text-rose-700 text-[10px] font-black uppercase tracking-wider">
              <span>Errors & Pendency</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-700">
              {isLoading ? '...' : stats.errors}
            </div>
            <div className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
              <span>Requires BM attention</span>
            </div>
          </div>

          {/* Card 3: Clean Records */}
          <div className="bg-white p-3.5 rounded-[3px] border border-emerald-200 shadow-xs space-y-1 bg-gradient-to-br from-white to-emerald-50/30">
            <div className="flex items-center justify-between text-emerald-700 text-[10px] font-black uppercase tracking-wider">
              <span>Clean Records</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700">
              {isLoading ? '...' : stats.clean}
            </div>
            <div className="text-[10px] text-emerald-600 font-bold">
              Verified without remarks
            </div>
          </div>

          {/* Card 4: Batches Covered */}
          <div className="bg-white p-3.5 rounded-[3px] border border-[#E2E1DA] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase tracking-wider">
              <span>Batches Audited</span>
              <Layers className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {isLoading ? '...' : stats.uniqueBatches}
            </div>
            <div className="text-[10px] text-slate-500 font-bold">
              Distinct batch groups
            </div>
          </div>
        </div>

        {/* Subsheet Switcher Tabs */}
        <div className="bg-white p-2.5 rounded-[3px] border border-[#E2E1DA] shadow-xs space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              Subsheet Category:
            </span>
            <span className="text-[9.5px] font-bold text-slate-400">
              Only user-requested tabs displayed
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedSubsheet('ALL')}
              className={`px-3 py-1.5 rounded-[2px] text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedSubsheet === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>All Subsheets</span>
              <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-bold ${
                selectedSubsheet === 'ALL' ? 'bg-slate-700 text-white' : 'bg-white text-slate-800'
              }`}>
                {data?.records?.length || 0}
              </span>
            </button>

            {availableSubsheets.map((sub) => {
              const count = subsheetCounts[sub] || 0;
              const isSelected = selectedSubsheet.toLowerCase() === sub.toLowerCase();

              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubsheet(sub)}
                  className={`px-3 py-1.5 rounded-[2px] text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{sub}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-bold ${
                      isSelected ? 'bg-indigo-800 text-white' : 'bg-white text-slate-800'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Controls: Branch, Error Status & Search */}
        <div className="bg-white p-3 rounded-[3px] border border-[#E2E1DA] shadow-xs grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          {/* 1. Branch / Center Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              Pune Branch (Center):
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E2E1DA] rounded-[2px] text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Pune Branches ({data?.branches?.length || 0})</option>
              {availableBranches.map((br) => (
                <option key={br} value={br}>
                  {br}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Error Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Audit Error Filter:
            </label>
            <div className="flex rounded-[2px] border border-[#E2E1DA] overflow-hidden bg-slate-50 p-0.5 text-xs font-bold">
              <button
                onClick={() => setErrorFilter('ALL')}
                className={`flex-1 py-1 text-center rounded-[1px] cursor-pointer transition-colors ${
                  errorFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setErrorFilter('ERRORS_ONLY')}
                className={`flex-1 py-1 text-center rounded-[1px] cursor-pointer transition-colors ${
                  errorFilter === 'ERRORS_ONLY' ? 'bg-rose-600 text-white shadow-xs font-black' : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                Errors Only
              </button>
              <button
                onClick={() => setErrorFilter('CLEAN_ONLY')}
                className={`flex-1 py-1 text-center rounded-[1px] cursor-pointer transition-colors ${
                  errorFilter === 'CLEAN_ONLY' ? 'bg-emerald-600 text-white shadow-xs font-black' : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Clean Only
              </button>
            </div>
          </div>

          {/* 3. Text Search Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Search className="w-3 h-3" />
              Live Search:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search batch, subject, BM, error..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-[#E2E1DA] rounded-[2px] text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Counter & Controls */}
        <div className="flex items-center justify-between px-1 text-xs text-slate-600 font-bold">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-slate-900">{filteredRecords.length}</strong> Pune audit records</span>
            {stats.errors > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 border border-rose-200 rounded-[2px] text-[10px] font-black uppercase">
                {stats.errors} with errors
              </span>
            )}
          </div>
          {(selectedSubsheet !== 'ALL' || selectedBranch !== 'ALL' || errorFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedSubsheet('ALL');
                setSelectedBranch('ALL');
                setErrorFilter('ALL');
                setSearchQuery('');
              }}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 underline uppercase tracking-wider cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>

        {/* Data Loading State */}
        {isLoading && (
          <div className="p-12 bg-white rounded-[3px] border border-[#E2E1DA] text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs font-black uppercase tracking-wider text-slate-800">
              Aggregating Audit Sheets for Pune Centers...
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              Scanning Pendency, Topic, Video, Notes, Content, and Teacher tabs
            </p>
          </div>
        )}

        {/* Data List / Table */}
        {!isLoading && filteredRecords.length === 0 && (
          <div className="p-12 bg-white rounded-[3px] border border-dashed border-[#E2E1DA] text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
              No matching Pune audit records found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No rows matched your selected filters ({selectedSubsheet}, {selectedBranch}, {errorFilter}). Try switching subsheets or clearing filters.
            </p>
          </div>
        )}

        {/* Responsive Table / Cards */}
        {!isLoading && filteredRecords.length > 0 && (
          <div className="space-y-2">
            {/* Desktop Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-2 px-3 py-2 bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-[2px]">
              <div className="col-span-2">Branch / Subsheet</div>
              <div className="col-span-3">Batch Name</div>
              <div className="col-span-2">Subject</div>
              <div className="col-span-1">Start Time</div>
              <div className="col-span-2">Final BM</div>
              <div className="col-span-2">Errors / Remarks</div>
            </div>

            {/* Rows */}
            {filteredRecords.map((rec) => (
              <div
                key={rec.id}
                className={`p-3 bg-white rounded-[3px] border transition-all shadow-xs space-y-2 ${
                  rec.hasError
                    ? 'border-rose-300 hover:border-rose-400 bg-gradient-to-r from-white via-white to-rose-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Desktop View Row */}
                <div className="hidden lg:grid grid-cols-12 gap-2 items-center text-xs">
                  {/* Branch & Subsheet */}
                  <div className="col-span-2 space-y-0.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded-[2px] text-[9.5px] font-black uppercase border ${getBranchColor(rec.branch)}`}>
                      {rec.branch}
                    </span>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
                      {rec.subsheet}
                    </div>
                  </div>

                  {/* Batch Name */}
                  <div className="col-span-3 font-black text-slate-900 flex items-center gap-1.5">
                    <span className="truncate" title={rec.batchName}>
                      {rec.batchName}
                    </span>
                    <button
                      onClick={() => handleCopyText(rec.batchName, rec.id, 'Batch Name')}
                      className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer rounded-[2px]"
                      title="Copy batch code"
                    >
                      {copiedId === rec.id ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Subject Name */}
                  <div className="col-span-2">
                    {rec.subjectName ? (
                      <span className={`inline-block px-2 py-0.5 rounded-[2px] text-[10px] font-black uppercase border ${getSubjectColor(rec.subjectName)}`}>
                        {rec.subjectName}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold italic">N/A</span>
                    )}
                  </div>

                  {/* Start Time */}
                  <div className="col-span-1 font-mono text-slate-700 text-[11px] font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{rec.lecStartTime || '—'}</span>
                  </div>

                  {/* Final BM */}
                  <div className="col-span-2 truncate font-medium text-slate-700 text-[11px]">
                    {rec.finalBm ? (
                      <span title={rec.finalBm} className="flex items-center gap-1 truncate">
                        <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{rec.finalBm}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                    )}
                  </div>

                  {/* Errors / Remarks */}
                  <div className="col-span-2 flex items-center justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      {rec.hasError ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-rose-100 text-rose-800 border border-rose-300 text-[10.5px] font-bold truncate max-w-full" title={rec.errors}>
                          <AlertTriangle className="w-3 h-3 text-rose-600 flex-shrink-0" />
                          <span className="truncate">{rec.errors}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Clean</span>
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setDetailRecord(rec)}
                      className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer rounded-[2px] hover:bg-slate-100 flex-shrink-0"
                      title="View all sheet columns for this row"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Mobile / Tablet Card View */}
                <div className="block lg:hidden space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded-[2px] text-[9.5px] font-black uppercase border ${getBranchColor(rec.branch)}`}>
                        {rec.branch}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase bg-slate-100 px-1.5 py-0.5 rounded-[2px]">
                        {rec.subsheet}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {rec.subjectName && (
                        <span className={`px-1.5 py-0.5 rounded-[2px] text-[9.5px] font-black uppercase border ${getSubjectColor(rec.subjectName)}`}>
                          {rec.subjectName}
                        </span>
                      )}
                      <button
                        onClick={() => setDetailRecord(rec)}
                        className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer rounded-[2px]"
                        title="View all details"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-black text-slate-900">
                    <span className="truncate">{rec.batchName}</span>
                    <button
                      onClick={() => handleCopyText(rec.batchName, rec.id, 'Batch Name')}
                      className="p-1 text-slate-400 hover:text-slate-800"
                    >
                      {copiedId === rec.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {rec.lecStartTime || 'No Time Listed'}
                    </span>
                    <span className="flex items-center gap-1 font-medium truncate max-w-[150px]">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{rec.finalBm || 'No BM'}</span>
                    </span>
                  </div>

                  {rec.hasError ? (
                    <div className="p-2 rounded-[2px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                      <span className="break-words">{rec.errors}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>No audit issues reported</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal for inspecting all columns of a row */}
      {detailRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[4px] border border-slate-300 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-black uppercase tracking-wider">
                  Audit Row Details: {detailRecord.batchName}
                </h3>
              </div>
              <button
                onClick={() => setDetailRecord(null)}
                className="p-1 text-slate-400 hover:text-white rounded-[2px] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs flex-1">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-[2px] border border-slate-200 font-bold">
                <div>
                  <span className="text-slate-400 block text-[9.5px] uppercase">Branch (Center):</span>
                  <span className="text-slate-900 font-black">{detailRecord.branch}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9.5px] uppercase">Subsheet:</span>
                  <span className="text-slate-900 font-black">{detailRecord.subsheet}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9.5px] uppercase">Subject:</span>
                  <span className="text-slate-900 font-black">{detailRecord.subjectName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9.5px] uppercase">Lecture Start Time:</span>
                  <span className="text-slate-900 font-black">{detailRecord.lecStartTime || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9.5px] uppercase">Final Batch Manager:</span>
                  <span className="text-slate-900 font-black">{detailRecord.finalBm || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9.5px] uppercase">Sheet Row Number:</span>
                  <span className="text-slate-900 font-black">Row #{detailRecord.rowIndex}</span>
                </div>
              </div>

              {detailRecord.hasError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-[2px] space-y-1">
                  <span className="text-rose-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Error / Remarks Reported:
                  </span>
                  <p className="text-rose-900 font-bold text-xs">{detailRecord.errors}</p>
                </div>
              )}

              {/* All Raw Row Columns */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  All Sheet Columns for this Row ({Object.keys(detailRecord.rawRow || {}).length}):
                </span>
                <div className="border border-slate-200 rounded-[2px] divide-y divide-slate-100 max-h-60 overflow-y-auto font-mono text-[11px]">
                  {Object.entries(detailRecord.rawRow || {}).map(([col, val]) => (
                    <div key={col} className="p-2 flex items-start justify-between gap-3 hover:bg-slate-50">
                      <span className="text-slate-500 font-bold w-1/3 truncate" title={col}>
                        {col}:
                      </span>
                      <span className="text-slate-900 font-medium w-2/3 break-words text-right">
                        {val || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setDetailRecord(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-[2px] text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
