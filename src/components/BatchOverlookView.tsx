import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  Copy, 
  Check, 
  Sparkles, 
  MapPin, 
  User, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  Layers, 
  Activity, 
  Calendar,
  Building2,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { AppView, Batch, CustomModuleDataResponse } from '../types';

interface BatchOverlookViewProps {
  authToken?: string | null;
  allBatches?: Batch[];
  onBackToBatches: () => void;
}

export default function BatchOverlookView({
  authToken,
  allBatches = [],
  onBackToBatches,
}: BatchOverlookViewProps) {
  const [data, setData] = useState<CustomModuleDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [puneOnly, setPuneOnly] = useState<boolean>(true);
  const [streamFilter, setStreamFilter] = useState<'ALL' | 'JEE' | 'NEET' | 'Foundation'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Known Pune batch codes for exact cross-referencing
  const knownBatchCodes = useMemo(() => {
    const set = new Set<string>();
    allBatches.forEach((b) => {
      const c = (b.displayName || b.fullName || '').toUpperCase();
      const parts = c.split(/[\s-]+/);
      parts.forEach((p) => {
        if (p.length >= 4) set.add(p);
      });
      set.add(c);
    });
    return set;
  }, [allBatches]);

  const fetchData = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(
        `/api/custom-modules/data?moduleId=batch-overlook${forceRefresh ? '&refresh=true' : ''}`,
        { headers }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to fetch Batch Overlook data.');
      }

      const json: CustomModuleDataResponse = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Error fetching batch overlook:', err);
      setError(err.message || 'Could not load Batch Overlook data. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [authToken]);

  // Pune detection rule
  const isPuneRow = (row: Record<string, string>): boolean => {
    const raw = (row._rawText || Object.values(row).join(' ')).toUpperCase();

    // 1. Explicit mention of Pune centers
    if (
      raw.includes('PUNE') ||
      raw.includes('PCMC') ||
      raw.includes('HADAPSAR') ||
      raw.includes('VIMAN') ||
      raw.includes('KOTHRUD') ||
      raw.includes('FC ROAD') ||
      raw.includes('PIMPLE') ||
      raw.includes('PIMPRI')
    ) {
      return true;
    }

    // 2. SIP codes (S41, S91, S98)
    if (raw.includes('S41') || raw.includes('S91') || raw.includes('S98')) {
      return true;
    }

    // 3. User rule: "27 sab se aage likha rhega batch code me ... or same T27 rhega"
    if (/\b27-[A-Z0-9]+/i.test(raw) || /\bT27-[A-Z0-9]+/i.test(raw)) {
      return true;
    }

    // 4. Match against known batches
    for (const code of knownBatchCodes) {
      if (code && raw.includes(code)) {
        return true;
      }
    }

    return false;
  };

  // Helper to extract batch title from row
  const getRowBatchTitle = (row: Record<string, string>, headers: string[]): string => {
    for (const h of headers) {
      const lower = h.toLowerCase();
      if (lower.includes('batch') || lower.includes('name') || lower.includes('code')) {
        const val = row[h];
        if (val && val.length > 3) return val;
      }
    }
    for (const h of headers) {
      const val = row[h];
      if (val && val.length > 3) return val;
    }
    return `Batch Row #${row._rowIndex}`;
  };

  // Detect stream from text
  const detectStream = (text: string): 'JEE' | 'NEET' | 'Foundation' | 'Other' => {
    const up = text.toUpperCase();
    if (up.includes('LJ') || up.includes('AJ') || up.includes('PJ') || up.includes('JEE')) return 'JEE';
    if (up.includes('LN') || up.includes('AN') || up.includes('YN') || up.includes('YA') || up.includes('NEET')) return 'NEET';
    if (up.includes('UF') || up.includes('NF') || up.includes('UP') || up.includes('FOUNDATION')) return 'Foundation';
    return 'Other';
  };

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

  // Process rows into cards
  const cardItems = useMemo(() => {
    if (!data || !data.rows || !data.headers) return [];

    const { headers, rows } = data;

    const batchCol = headers.find((h) => {
      const l = h.toLowerCase();
      return l.includes('batch') || l.includes('code');
    }) || headers[0];

    const centerCol = headers.find((h) => {
      const l = h.toLowerCase();
      return l.includes('center') || l.includes('location') || l.includes('branch');
    });

    const statusCol = headers.find((h) => {
      const l = h.toLowerCase();
      return l.includes('status') || l.includes('state') || l.includes('phase') || l.includes('stage');
    });

    const bmCol = headers.find((h) => {
      const l = h.toLowerCase();
      return l.includes('bm') || l.includes('manager') || l.includes('mentor') || l.includes('coordinator');
    });

    return rows.map((row, idx) => {
      const batchName = row[batchCol] || getRowBatchTitle(row, headers);
      const isPune = isPuneRow(row);
      const stream = detectStream(batchName + ' ' + (row._rawText || ''));
      const center = centerCol ? row[centerCol] : '';
      const status = statusCol ? row[statusCol] : '';
      const bm = bmCol ? row[bmCol] : '';

      const otherAttributes: { key: string; value: string }[] = [];
      headers.forEach((h) => {
        if (
          h !== batchCol &&
          h !== centerCol &&
          h !== statusCol &&
          h !== bmCol &&
          !h.startsWith('_')
        ) {
          const val = row[h];
          if (val && val.trim() !== '' && val !== '-' && val !== 'N/A') {
            otherAttributes.push({ key: h, value: val.trim() });
          }
        }
      });

      return {
        id: `overlook_${row._rowIndex || idx}`,
        rowIndex: row._rowIndex || `${idx + 1}`,
        batchName,
        isPune,
        stream,
        center: center || (isPune ? 'Pune Region' : 'General'),
        status: status || 'Active',
        bm,
        otherAttributes,
        rawText: row._rawText || Object.values(row).join(' '),
      };
    });
  }, [data, knownBatchCodes]);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cardItems.filter((item) => {
      if (puneOnly && !item.isPune) return false;
      if (streamFilter !== 'ALL' && item.stream !== streamFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          item.batchName.toLowerCase().includes(q) ||
          item.center.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q) ||
          item.bm.toLowerCase().includes(q) ||
          item.rawText.toLowerCase().includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [cardItems, puneOnly, streamFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = cardItems.length;
    const pune = cardItems.filter((c) => c.isPune).length;
    const jee = cardItems.filter((c) => (puneOnly ? c.isPune : true) && c.stream === 'JEE').length;
    const neet = cardItems.filter((c) => (puneOnly ? c.isPune : true) && c.stream === 'NEET').length;
    const foundation = cardItems.filter((c) => (puneOnly ? c.isPune : true) && c.stream === 'Foundation').length;

    return { total, pune, jee, neet, foundation };
  }, [cardItems, puneOnly]);

  const handleCopyCard = (item: any) => {
    const summary = [
      `📌 *Batch Overlook: ${item.batchName}*`,
      `🏛️ Center: ${item.center}`,
      `🎯 Stream: ${item.stream}`,
      `📊 Status: ${item.status}`,
      item.bm ? `👤 Manager: ${item.bm}` : '',
      ...item.otherAttributes.slice(0, 4).map((a: any) => `• ${a.key}: ${a.value}`),
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(summary);
    setCopiedId(item.id);
    showToast(`Copied details for ${item.batchName}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-3 sm:space-y-4 font-sans animate-in fade-in duration-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-[2px] shadow-xl border border-slate-700 text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top duration-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
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
                Batch Overlook Hub
              </h1>
              <span className="px-1.5 py-0.5 rounded-[1px] bg-purple-50 text-purple-700 border border-purple-200 text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider">
                Cards View
              </span>
              <span className="px-1.5 py-0.5 rounded-[1px] bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Pune Aligned
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 truncate">
              Executive performance tracking and high-level batch overview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-auto">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isLoading}
            className="px-2.5 py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-white border border-[#E2E1DA] hover:bg-slate-50 text-slate-800 rounded-[2px] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reload Data</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* Pune Batches */}
        <button
          type="button"
          onClick={() => setPuneOnly(true)}
          className={`bg-white border rounded-[2px] p-2.5 sm:p-3.5 text-left transition-all cursor-pointer ${
            puneOnly
              ? 'border-slate-900 ring-1 ring-slate-900/20 bg-[#FAF9F5]'
              : 'border-[#E2E1DA] hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-purple-700">
            <span>Pune Batches</span>
            <span>📍</span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
            {stats.pune}
          </div>
          <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            Auto-filtered
          </div>
        </button>

        {/* JEE */}
        <button
          type="button"
          onClick={() => setStreamFilter(streamFilter === 'JEE' ? 'ALL' : 'JEE')}
          className={`bg-white border rounded-[2px] p-2.5 sm:p-3.5 text-left transition-all cursor-pointer ${
            streamFilter === 'JEE'
              ? 'border-slate-900 ring-1 ring-slate-900/20 bg-[#FAF9F5]'
              : 'border-[#E2E1DA] hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-blue-700">
            <span>JEE Batches</span>
            <span>📐</span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
            {stats.jee}
          </div>
          <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            Engineering Prep
          </div>
        </button>

        {/* NEET */}
        <button
          type="button"
          onClick={() => setStreamFilter(streamFilter === 'NEET' ? 'ALL' : 'NEET')}
          className={`bg-white border rounded-[2px] p-2.5 sm:p-3.5 text-left transition-all cursor-pointer ${
            streamFilter === 'NEET'
              ? 'border-slate-900 ring-1 ring-slate-900/20 bg-[#FAF9F5]'
              : 'border-[#E2E1DA] hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-emerald-700">
            <span>NEET Batches</span>
            <span>🔬</span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
            {stats.neet}
          </div>
          <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            Medical Prep
          </div>
        </button>

        {/* Foundation */}
        <button
          type="button"
          onClick={() => setStreamFilter(streamFilter === 'Foundation' ? 'ALL' : 'Foundation')}
          className={`bg-white border rounded-[2px] p-2.5 sm:p-3.5 text-left transition-all cursor-pointer ${
            streamFilter === 'Foundation'
              ? 'border-slate-900 ring-1 ring-slate-900/20 bg-[#FAF9F5]'
              : 'border-[#E2E1DA] hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-700">
            <span>Foundation</span>
            <span>🌱</span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
            {stats.foundation}
          </div>
          <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            Class 8-10 Prep
          </div>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#E2E1DA] rounded-[2px] p-2.5 sm:p-3.5 space-y-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E1DA] pb-2">
          {/* Pune Toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">Scope:</span>
            <button
              onClick={() => setPuneOnly(true)}
              className={`px-2 py-1 text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider rounded-[1px] transition-all cursor-pointer border ${
                puneOnly
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-[#FAF9F5] text-slate-700 border-[#E2E1DA]'
              }`}
            >
              📍 Pune Batches ({stats.pune})
            </button>
            <button
              onClick={() => setPuneOnly(false)}
              className={`px-2 py-1 text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider rounded-[1px] transition-all cursor-pointer border ${
                !puneOnly
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-[#FAF9F5] text-slate-700 border-[#E2E1DA]'
              }`}
            >
              All Batches ({stats.total})
            </button>
          </div>

          {/* Stream Filter Pills */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setStreamFilter('ALL')}
              className={`px-2 py-1 text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider rounded-[1px] border ${
                streamFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-[#E2E1DA] hover:bg-[#FAF9F5]'
              }`}
            >
              All Streams
            </button>
            <button
              onClick={() => setStreamFilter('JEE')}
              className={`px-2 py-1 text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider rounded-[1px] border ${
                streamFilter === 'JEE'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
              }`}
            >
              JEE
            </button>
            <button
              onClick={() => setStreamFilter('NEET')}
              className={`px-2 py-1 text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider rounded-[1px] border ${
                streamFilter === 'NEET'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              NEET
            </button>
            <button
              onClick={() => setStreamFilter('Foundation')}
              className={`px-2 py-1 text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider rounded-[1px] border ${
                streamFilter === 'Foundation'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              Foundation
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search batches by code, location, manager, status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
      </div>

      {/* Results Count Line */}
      <div className="flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <div>
          Showing <span className="text-slate-800 font-black">{filteredCards.length}</span> batches
          {puneOnly && ' (Pune Only)'}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white rounded-[2px] p-4 border border-[#E2E1DA] shadow-2xs animate-pulse space-y-2.5"
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
          <AlertCircle className="w-6 h-6 text-rose-600" />
          <div className="font-bold text-xs uppercase tracking-wider">{error}</div>
          <button
            onClick={() => fetchData(true)}
            className="mt-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-[2px] text-[10px] font-black uppercase tracking-wider cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredCards.length === 0 && (
        <div className="bg-white rounded-[2px] border border-[#E2E1DA] p-8 text-center flex flex-col items-center justify-center gap-2.5">
          <div className="w-10 h-10 rounded-[2px] bg-[#FAF9F5] border border-[#E2E1DA] flex items-center justify-center text-lg">
            📊
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            No Batches Found
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider max-w-sm">
            No batches matched the active filters.
          </p>
          <button
            onClick={() => {
              setPuneOnly(false);
              setStreamFilter('ALL');
              setSearchQuery('');
            }}
            className="mt-1 px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-[2px] text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            Show All Batches
          </button>
        </div>
      )}

      {/* CARDS GRID */}
      {!isLoading && !error && filteredCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredCards.map((item) => {
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-[2px] border border-[#E2E1DA] hover:border-slate-900/40 p-3.5 sm:p-4 flex flex-col justify-between gap-3 transition-all relative group shadow-2xs"
              >
                {/* Header */}
                <div className="border-b border-[#E2E1DA] pb-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.2 rounded-[1px] text-[8.5px] font-bold uppercase tracking-wider ${getCategoryStyles(item.stream)}`}>
                        {item.stream}
                      </span>
                      {item.isPune && (
                        <span className="px-1.5 py-0.2 rounded-[1px] text-[8px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                          Pune Center
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleCopyCard(item)}
                      className="p-1 text-slate-400 hover:text-slate-900 hover:bg-[#FAF9F5] rounded-[2px] transition-all cursor-pointer"
                      title="Copy details"
                    >
                      {isCopied ? (
                        <span className="text-[9px] text-emerald-600 font-bold uppercase">Copied!</span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight font-sans truncate">
                    {item.batchName}
                  </h4>
                </div>

                {/* Body Metrics */}
                <div className="space-y-2">
                  {/* Status & Location Pill */}
                  <div className="flex items-center justify-between gap-2 text-xs bg-[#FAF9F5] border border-[#E2E1DA] rounded-[2px] p-2">
                    <div className="flex items-center gap-1 text-slate-700 font-bold truncate text-[11px]">
                      <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span className="truncate">{item.center}</span>
                    </div>

                    {item.status && (
                      <span className="px-1.5 py-0.2 rounded-[1px] text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {item.status}
                      </span>
                    )}
                  </div>

                  {/* BM */}
                  {item.bm && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-[#FAF9F5] border border-[#E2E1DA] rounded-[2px] px-2.5 py-1">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-black text-slate-400 uppercase tracking-wider text-[8.5px]">BM:</span>
                      <span className="truncate text-slate-800 font-mono text-[10px] select-all">
                        {item.bm}
                      </span>
                    </div>
                  )}

                  {/* Attributes Grid */}
                  {item.otherAttributes.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {item.otherAttributes.slice(0, 4).map((attr: any, i: number) => (
                        <div
                          key={i}
                          className="bg-[#FAF9F5] border border-[#E2E1DA] rounded-[2px] p-1.5 overflow-hidden"
                        >
                          <div className="text-[8px] font-black text-slate-400 uppercase tracking-wider truncate">
                            {attr.key}
                          </div>
                          <div className="font-bold text-slate-900 truncate text-[11px] mt-0.5" title={attr.value}>
                            {attr.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-[#E2E1DA] flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono text-[9px] font-bold uppercase">Row #{item.rowIndex}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCard(item)}
                    className="text-[9px] font-black uppercase tracking-wider text-slate-700 hover:text-slate-950 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{isCopied ? 'Copied' : 'Copy Summary'}</span>
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
