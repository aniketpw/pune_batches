import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  Copy, 
  Check, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  BookOpen, 
  DoorOpen, 
  Mail, 
  AlertTriangle, 
  MessageSquare, 
  Calendar, 
  Sparkles, 
  Send,
  ExternalLink,
  ChevronRight,
  Share2,
  Eye,
  EyeOff
} from 'lucide-react';
import { ExtraClassScheduleResponse, ExtraLectureItem } from '../types';

interface ExtraClassViewProps {
  authToken?: string | null;
  onBackToBatches: () => void;
}

type DateScopeFilter = 'TODAY_TOMORROW' | 'TODAY_ONLY' | 'TOMORROW_ONLY' | 'ALL_UPCOMING' | 'HISTORY' | 'ALL';
type StatusFilter = 'ALL' | 'PENDING' | 'DONE';

export default function ExtraClassView({
  authToken,
  onBackToBatches,
}: ExtraClassViewProps) {
  const [data, setData] = useState<ExtraClassScheduleResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateScope, setDateScope] = useState<DateScopeFilter>('TODAY_TOMORROW');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedCenter, setSelectedCenter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live Updating State for "Mark Done" & WhatsApp Notice Expansion
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const fetchSchedule = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(
        `/api/extra-classes/schedule${forceRefresh ? '?refresh=true' : ''}`,
        { headers }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to load extra classes schedule.');
      }

      const json: ExtraClassScheduleResponse = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Error fetching extra class schedule:', err);
      setError(err.message || 'Could not load extra class schedule. Please ensure you are logged in.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [authToken]);

  // Handle Mark Done / Toggle live in Google Sheets
  const handleToggleDone = async (item: ExtraLectureItem) => {
    setUpdatingId(item.id);
    const newStatus = item.isDone ? 'Pending' : 'Done';

    // Optimistic UI update
    setData((prev) => {
      if (!prev) return prev;
      const updatedClasses = prev.classes.map((c) => {
        if (c.id === item.id) {
          const isDone = newStatus === 'Done';
          return {
            ...c,
            isDone,
            rawStatus: newStatus,
          };
        }
        return c;
      });

      const pendingCount = updatedClasses.filter(
        (c) => (c.isToday || c.isTomorrow) && !c.isDone
      ).length;
      const doneCount = updatedClasses.filter(
        (c) => (c.isToday || c.isTomorrow) && c.isDone
      ).length;

      return {
        ...prev,
        classes: updatedClasses,
        counts: {
          ...prev.counts,
          pending: pendingCount,
          done: doneCount,
        },
      };
    });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/extra-classes/mark-done', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          spreadsheetId: item.spreadsheetId,
          sheetTitle: item.sheetTitle,
          rowIndex: item.rowIndex,
          statusColLetter: item.statusColLetter || 'O',
          status: newStatus,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to update Google Sheet');
      }

      showToast(
        newStatus === 'Done'
          ? `✓ Marked "${item.batchCode}" as Announced/Done in Column O`
          : `Marked "${item.batchCode}" back to Pending in Column O`
      );
    } catch (err: any) {
      console.error('Error marking done:', err);
      showToast(`⚠️ Sync notice: ${err.message}`);
      fetchSchedule();
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle WhatsApp Copy (from Column K Announcement)
  const handleCopyAnnouncement = (item: ExtraLectureItem) => {
    let textToCopy = item.announcement;
    if (!textToCopy) {
      textToCopy = `Dear Vidyapeeth Students, ${item.teacherName || item.facultyCode} Sir/Ma'am will take ${item.classType || 'Extra Class'} of ${item.subject || 'Special Class'} at (${item.displayDate || item.rawDate}) at (${item.timeRange}). Don't forget to join! Keep studying! Physics Wallah is for you, by you, from you!`;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    setExpandedNoticeId(item.id);
    showToast(`Copied Column K Notice for ${item.batchCode}`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Handle Direct WhatsApp Share
  const handleShareWhatsApp = (item: ExtraLectureItem) => {
    let textToShare = item.announcement;
    if (!textToShare) {
      textToShare = `Dear Vidyapeeth Students, ${item.teacherName || item.facultyCode} Sir/Ma'am will take ${item.classType || 'Extra Class'} of ${item.subject || 'Special Class'} at (${item.displayDate || item.rawDate}) at (${item.timeRange}). Don't forget to join! Keep studying! Physics Wallah is for you, by you, from you!`;
    }

    setExpandedNoticeId(item.id);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`;
    window.open(waUrl, '_blank');
    showToast(`Opening WhatsApp for ${item.batchCode}`);
  };

  // Filtered lectures list
  const filteredLectures = useMemo(() => {
    if (!data || !data.classes) return [];

    return data.classes.filter((item) => {
      // 1. Date Scope Filter
      if (dateScope === 'TODAY_TOMORROW') {
        if (!item.isToday && !item.isTomorrow) return false;
      } else if (dateScope === 'TODAY_ONLY') {
        if (!item.isToday) return false;
      } else if (dateScope === 'TOMORROW_ONLY') {
        if (!item.isTomorrow) return false;
      } else if (dateScope === 'ALL_UPCOMING') {
        if (item.isPast) return false;
      } else if (dateScope === 'HISTORY') {
        if (!item.isPast) return false;
      }

      // 2. Status Filter
      if (statusFilter === 'PENDING' && item.isDone) return false;
      if (statusFilter === 'DONE' && !item.isDone) return false;

      // 3. Center Filter
      if (selectedCenter !== 'ALL' && item.center !== selectedCenter) return false;

      // 4. Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matches =
          item.batchCode.toLowerCase().includes(query) ||
          item.teacherName.toLowerCase().includes(query) ||
          item.subject.toLowerCase().includes(query) ||
          item.room.toLowerCase().includes(query) ||
          item.facultyCode.toLowerCase().includes(query) ||
          item.bmName.toLowerCase().includes(query) ||
          item.center.toLowerCase().includes(query) ||
          item.announcement.toLowerCase().includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [data, dateScope, statusFilter, selectedCenter, searchQuery]);

  // Center options
  const centerList = useMemo(() => {
    if (!data?.centers) return [];
    return data.centers;
  }, [data]);

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'JEE':
        return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'NEET':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'Foundation':
        return 'bg-amber-50 text-amber-700 border border-amber-100';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 font-sans animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-[2px] shadow-xl border border-slate-700 text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top duration-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card (100% matched with App.tsx & GenericSheetView.tsx) */}
      <div className="bg-white border border-[#E2E1DA] rounded-[2px] p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBackToBatches}
            className="p-1.5 sm:p-2 bg-[#FAF9F5] hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-[#E2E1DA] rounded-[2px] transition-all cursor-pointer flex-shrink-0 flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-wider"
            title="Return to Main Batches"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Batches</span>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-wider uppercase truncate">
                Extra Class Schedule
              </h1>
              <span className="px-1.5 py-0.5 rounded-[1px] bg-amber-50 text-amber-700 border border-amber-200 text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider">
                Multi-Center Hub
              </span>
              <span className="px-1.5 py-0.5 rounded-[1px] bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Pune Centers Aligned
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 truncate">
              Hadapsar • Viman Nagar • Kothrud • PCMC • FC Road • Osmanabad (Dharashiv - S-SIP) • Pimple Saudagar
            </p>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-auto">
          <button
            type="button"
            onClick={() => fetchSchedule(true)}
            disabled={isLoading}
            className="px-2.5 py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-white border border-[#E2E1DA] hover:bg-slate-50 text-slate-800 rounded-[2px] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Reload latest live schedule from Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reload Sheets</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner (100% matched with App.tsx Bento Cards & compact on mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* Today */}
        <button
          type="button"
          onClick={() => {
            setDateScope('TODAY_ONLY');
            setStatusFilter('ALL');
          }}
          className={`bg-white border rounded-[2px] p-2.5 sm:p-3.5 text-left transition-all cursor-pointer ${
            dateScope === 'TODAY_ONLY'
              ? 'border-slate-900 ring-1 ring-slate-900/20 bg-[#FAF9F5]'
              : 'border-[#E2E1DA] hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-700">
            <span>Today's Extra</span>
            <span>🔥</span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
            {data?.counts.today ?? 0}
          </div>
          <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">
            {data?.todayDateDisplay || 'Today'}
          </div>
        </button>

        {/* Tomorrow */}
        <button
          type="button"
          onClick={() => {
            setDateScope('TOMORROW_ONLY');
            setStatusFilter('ALL');
          }}
          className={`bg-white border rounded-[2px] p-2.5 sm:p-3.5 text-left transition-all cursor-pointer ${
            dateScope === 'TOMORROW_ONLY'
              ? 'border-slate-900 ring-1 ring-slate-900/20 bg-[#FAF9F5]'
              : 'border-[#E2E1DA] hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-blue-700">
            <span>Tomorrow's Extra</span>
            <span>📅</span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
            {data?.counts.tomorrow ?? 0}
          </div>
          <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">
            {data?.tomorrowDateDisplay || 'Tomorrow'}
          </div>
        </button>

        {/* Pending Broadcast */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('PENDING');
          }}
          className={`bg-white border rounded-[2px] p-2.5 sm:p-3.5 text-left transition-all cursor-pointer ${
            statusFilter === 'PENDING'
              ? 'border-slate-900 ring-1 ring-slate-900/20 bg-[#FAF9F5]'
              : 'border-[#E2E1DA] hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-rose-700">
            <span>Pending Notice</span>
            <span>⚠️</span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-600 mt-1">
            {data?.counts.pending ?? 0}
          </div>
          <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            Needs Notice
          </div>
        </button>

        {/* Announced / Done */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('DONE');
          }}
          className={`bg-white border rounded-[2px] p-2.5 sm:p-3.5 text-left transition-all cursor-pointer ${
            statusFilter === 'DONE'
              ? 'border-slate-900 ring-1 ring-slate-900/20 bg-[#FAF9F5]'
              : 'border-[#E2E1DA] hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-emerald-700">
            <span>Announced / Done</span>
            <span>✓</span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-600 mt-1">
            {data?.counts.done ?? 0}
          </div>
          <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            Live Synced
          </div>
        </button>
      </div>

      {/* Filter Toolbar (Aligned with App.tsx styling) */}
      <div className="bg-white border border-[#E2E1DA] rounded-[2px] p-2.5 sm:p-3.5 space-y-2.5 shadow-2xs">
        {/* Row 1: Scope & Status Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E1DA] pb-2">
          {/* Date Scope Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">Scope:</span>
            <button
              onClick={() => setDateScope('TODAY_TOMORROW')}
              className={`px-2 py-1 text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider rounded-[1px] transition-all cursor-pointer border shrink-0 ${
                dateScope === 'TODAY_TOMORROW'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-[#FAF9F5] text-slate-700 border-[#E2E1DA]'
              }`}
            >
              Today & Tomorrow
            </button>
            <button
              onClick={() => setDateScope('TODAY_ONLY')}
              className={`px-2 py-1 text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider rounded-[1px] transition-all cursor-pointer border shrink-0 ${
                dateScope === 'TODAY_ONLY'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-[#FAF9F5] text-slate-700 border-[#E2E1DA]'
              }`}
            >
              Today Only
            </button>
            <button
              onClick={() => setDateScope('TOMORROW_ONLY')}
              className={`px-2 py-1 text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider rounded-[1px] transition-all cursor-pointer border shrink-0 ${
                dateScope === 'TOMORROW_ONLY'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-[#FAF9F5] text-slate-700 border-[#E2E1DA]'
              }`}
            >
              Tomorrow Only
            </button>
            <button
              onClick={() => setDateScope('ALL_UPCOMING')}
              className={`px-2 py-1 text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider rounded-[1px] transition-all cursor-pointer border shrink-0 ${
                dateScope === 'ALL_UPCOMING'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-[#FAF9F5] text-slate-700 border-[#E2E1DA]'
              }`}
            >
              All Upcoming
            </button>
            <button
              onClick={() => setDateScope('HISTORY')}
              className={`px-2 py-1 text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider rounded-[1px] transition-all cursor-pointer border shrink-0 ${
                dateScope === 'HISTORY'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-[#FAF9F5] text-slate-700 border-[#E2E1DA]'
              }`}
            >
              Past Logs
            </button>
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">Status:</span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2 py-1 text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider rounded-[1px] border ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-[#E2E1DA] hover:bg-[#FAF9F5]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-2 py-1 text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider rounded-[1px] border ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              ⚠️ Pending
            </button>
            <button
              onClick={() => setStatusFilter('DONE')}
              className={`px-2 py-1 text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider rounded-[1px] border ${
                statusFilter === 'DONE'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              ✓ Done
            </button>
          </div>
        </div>

        {/* Row 2: Search Bar & Center Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search extra lecture by batch, faculty, subject, room, BM..."
              className="w-full text-xs pl-8 pr-7 py-1.5 sm:py-2 border border-[#E2E1DA] rounded-[2px] focus:outline-hidden focus:border-slate-950 bg-[#FAF9F5] transition-all font-sans placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 sm:top-2.5 text-[9px] text-slate-400 hover:text-slate-900 font-black uppercase tracking-wider"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="w-full sm:w-auto text-xs px-2.5 py-1.5 sm:py-2 border border-[#E2E1DA] rounded-[2px] bg-white font-bold uppercase tracking-wider focus:outline-hidden focus:border-slate-900 text-slate-800"
            >
              <option value="ALL">All Centers ({centerList.length})</option>
              {centerList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count Line */}
      <div className="flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <div>
          Showing <span className="text-slate-800 font-black">{filteredLectures.length}</span> lectures
          {dateScope === 'TODAY_TOMORROW' && ' (Today & Tomorrow)'}
          {selectedCenter !== 'ALL' && ` in ${selectedCenter}`}
        </div>
        <div className="hidden sm:block">
          Chronological by date & time slot
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white rounded-[2px] p-4 border border-[#E2E1DA] shadow-2xs animate-pulse space-y-3"
            >
              <div className="h-4 bg-slate-200 rounded-[1px] w-3/4" />
              <div className="h-3 bg-slate-100 rounded-[1px] w-1/2" />
              <div className="h-16 bg-slate-50 rounded-[1px]" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-[2px] text-rose-800 flex flex-col items-center justify-center text-center gap-2">
          <AlertTriangle className="w-6 h-6 text-rose-600" />
          <div className="font-bold text-xs uppercase tracking-wider">{error}</div>
          <button
            onClick={() => fetchSchedule(true)}
            className="mt-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-[2px] text-[10px] font-black uppercase tracking-wider cursor-pointer"
          >
            Retry Fetching
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredLectures.length === 0 && (
        <div className="bg-white rounded-[2px] border border-[#E2E1DA] p-8 text-center flex flex-col items-center justify-center gap-2.5">
          <div className="w-10 h-10 rounded-[2px] bg-[#FAF9F5] border border-[#E2E1DA] flex items-center justify-center text-lg">
            📅
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            No Extra Lectures Found
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider max-w-sm">
            {dateScope === 'TODAY_TOMORROW'
              ? 'No extra lectures scheduled for Today or Tomorrow. Switch to "All Upcoming" or select another center.'
              : 'No lectures matched the current filter criteria.'}
          </p>
          <button
            onClick={() => {
              setDateScope('ALL_UPCOMING');
              setStatusFilter('ALL');
              setSelectedCenter('ALL');
              setSearchQuery('');
            }}
            className="mt-1 px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-[2px] text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            Reset to All Upcoming
          </button>
        </div>
      )}

      {/* LECTURE CARDS GRID (100% matched with BatchCard.tsx design system) */}
      {!isLoading && !error && filteredLectures.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredLectures.map((item) => {
            const isUpdating = updatingId === item.id;
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-[2px] border border-[#E2E1DA] hover:border-slate-900/40 p-3.5 sm:p-4 flex flex-col justify-between gap-3 transition-all relative group shadow-2xs"
              >
                {/* Card Top: Date, Center & Status Badges */}
                <div className="flex items-center justify-between gap-2 border-b border-[#E2E1DA] pb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Date Pill */}
                    {item.isToday ? (
                      <span className="px-1.5 py-0.5 rounded-[1px] bg-amber-100 text-amber-800 border border-amber-300 text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1">
                        <span>🔥 Today</span>
                        <span className="font-mono">({item.displayDate})</span>
                      </span>
                    ) : item.isTomorrow ? (
                      <span className="px-1.5 py-0.5 rounded-[1px] bg-blue-100 text-blue-800 border border-blue-300 text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1">
                        <span>📅 Tomorrow</span>
                        <span className="font-mono">({item.displayDate})</span>
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-[1px] bg-slate-100 text-slate-700 border border-slate-200 text-[8.5px] font-bold uppercase tracking-wider">
                        {item.displayDate || item.rawDate} {item.day && `(${item.day})`}
                      </span>
                    )}

                    {/* Center Tag */}
                    <span className="px-1.5 py-0.5 rounded-[1px] bg-[#FAF9F5] border border-[#E2E1DA] text-slate-700 text-[8.5px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-indigo-600" />
                      <span>{item.center}</span>
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {item.isDone ? (
                      <span className="px-1.5 py-0.5 rounded-[1px] bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Announced ✓</span>
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-[1px] bg-amber-50 text-amber-700 border border-amber-200 text-[8px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Batch Title & Category Pills */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight font-sans truncate">
                      {item.formattedBatchName || item.batchCode}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(item.batchCode);
                        showToast(`Copied batch code: ${item.batchCode}`);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-900 hover:bg-[#FAF9F5] rounded-[2px] transition-all cursor-pointer flex-shrink-0"
                      title="Copy batch code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Stream & Phase Badges (Identical to BatchCard) */}
                  <div className="flex flex-wrap items-center gap-1">
                    {item.category && (
                      <span className={`px-1.5 py-0.2 rounded-[1px] text-[8.5px] font-bold uppercase tracking-wider ${getCategoryStyles(item.category)}`}>
                        {item.category}
                      </span>
                    )}
                    {item.phase && item.phase !== 'Unknown' && (
                      <span className="px-1.5 py-0.2 rounded-[1px] text-[8.5px] font-bold uppercase tracking-wider bg-slate-50 text-slate-700 border border-slate-100">
                        {item.phase}
                      </span>
                    )}
                    {item.timeSlot && (
                      <span className="px-1.5 py-0.2 rounded-[1px] text-[8.5px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
                        {item.timeSlot}
                      </span>
                    )}
                    {item.classType && (
                      <span className="px-1.5 py-0.2 rounded-[1px] text-[8.5px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                        {item.classType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Core Lecture Info 4-Cell Grid (Clean sharp cells) */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Time Slot */}
                  <div className="bg-[#FAF9F5] border border-[#E2E1DA] rounded-[2px] p-2">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-indigo-600" />
                      <span>Timing</span>
                    </div>
                    <div className="font-bold text-slate-900 truncate mt-0.5 text-xs">
                      {item.timeRange}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="bg-[#FAF9F5] border border-[#E2E1DA] rounded-[2px] p-2">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="w-2.5 h-2.5 text-amber-600" />
                      <span>Subject</span>
                    </div>
                    <div className="font-bold text-slate-900 truncate mt-0.5 text-xs">
                      {item.subject || 'Special Class'}
                    </div>
                  </div>

                  {/* Faculty */}
                  <div className="bg-[#FAF9F5] border border-[#E2E1DA] rounded-[2px] p-2">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Faculty</span>
                    </div>
                    <div className="font-bold text-slate-900 truncate mt-0.5 text-xs" title={item.teacherName}>
                      {item.teacherName || 'Faculty TBD'}{' '}
                      {item.facultyCode && (
                        <span className="text-[9px] text-slate-500 font-normal">
                          ({item.facultyCode})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Room / Venue */}
                  <div className="bg-[#FAF9F5] border border-[#E2E1DA] rounded-[2px] p-2">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <DoorOpen className="w-2.5 h-2.5 text-purple-600" />
                      <span>Room / Venue</span>
                    </div>
                    <div className="font-bold text-slate-900 truncate mt-0.5 text-xs">
                      {item.room || 'Room TBA'}
                    </div>
                  </div>
                </div>

                {/* BM Line */}
                {item.bmName && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-[#FAF9F5] border border-[#E2E1DA] rounded-[2px] px-2.5 py-1">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-black text-slate-400 uppercase tracking-wider text-[8.5px]">BM:</span>
                    <span className="truncate select-all text-slate-800 font-mono text-[10px]">
                      {item.bmName}
                    </span>
                  </div>
                )}

                {/* WhatsApp Announcement Message Preview */}
                <div className="bg-[#FAF9F5] border border-[#E2E1DA] rounded-[2px] p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                      Student WhatsApp Notice
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyAnnouncement(item)}
                      className="text-[9px] font-black uppercase tracking-wider text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-800 bg-white border border-[#E2E1DA] rounded-[2px] p-2 leading-relaxed whitespace-pre-line font-sans select-all max-h-28 overflow-y-auto">
                    {item.announcement}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-2 border-t border-[#E2E1DA] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyAnnouncement(item)}
                    className="flex-1 py-1.5 sm:py-2 px-3 text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-white hover:bg-[#FAF9F5] text-slate-800 border border-[#E2E1DA] rounded-[2px] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    title="Copy formatted notice ready for WhatsApp group"
                  >
                    <Send className="w-3 h-3 text-emerald-600" />
                    <span>{isCopied ? 'Copied Notice!' : 'Copy WhatsApp Notice'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleDone(item)}
                    disabled={isUpdating}
                    className={`flex-1 py-1.5 sm:py-2 px-3 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-[2px] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                      item.isDone
                        ? 'bg-[#FAF9F5] hover:bg-slate-100 text-slate-700 border border-[#E2E1DA]'
                        : 'bg-slate-900 hover:bg-black text-white border border-slate-900 shadow-2xs'
                    }`}
                    title="Toggle announced status in Google Sheet"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
                        <span>Updating...</span>
                      </>
                    ) : item.isDone ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Done ✓ (Undo)</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Mark as Done</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
