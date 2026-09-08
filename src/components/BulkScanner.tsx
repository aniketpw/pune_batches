import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Batch } from '../types';

interface BulkScannerProps {
  tabName: string;
  batches: Batch[];
  onScanBatch: (batch: Batch) => Promise<void>;
  onComplete: () => void;
}

export default function BulkScanner({ tabName, batches, onScanBatch, onComplete }: BulkScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scanType, setScanType] = useState<'unlinked' | 'all'>('unlinked');
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scannedList, setScannedList] = useState<Batch[]>([]);
  const [results, setResults] = useState<{ batchName: string; status: 'success' | 'failed' | 'skipped'; message: string }[]>([]);
  
  const isRunningRef = useRef(isRunning);
  const queueRef = useRef<Batch[]>([]);
  
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  const toggleOpen = () => {
    if (isRunning) {
      if (window.confirm("A scan is currently running. Are you sure you want to close this panel? The scan will be stopped.")) {
        setIsRunning(false);
        setIsOpen(false);
      }
    } else {
      setIsOpen(!isOpen);
      setResults([]);
      setCurrentIndex(0);
    }
  };

  const startScan = async () => {
    // Determine which batches to scan
    const toScan = batches.filter(b => {
      if (scanType === 'all') return true;
      // Unlinked only
      return !b.driveUrl || b.driveUrl === '' || b.driveUrl === 'Not Found';
    });

    if (toScan.length === 0) {
      alert("No batches match the selected criteria for scanning.");
      return;
    }

    queueRef.current = toScan;
    setIsRunning(true);
    setCurrentIndex(0);
    setResults([]);

    for (let i = 0; i < toScan.length; i++) {
      if (!isRunningRef.current) break;

      const batch = toScan[i];
      setCurrentIndex(i + 1);

      try {
        await onScanBatch(batch);
        setResults(prev => [
          { 
            batchName: batch.fullName, 
            status: 'success', 
            message: 'Drive link found & saved successfully!' 
          },
          ...prev
        ]);
      } catch (err: any) {
        setResults(prev => [
          { 
            batchName: batch.fullName, 
            status: 'failed', 
            message: err.message || 'Folder not found or API error.' 
          },
          ...prev
        ]);
      }

      // Respect API rate limits and add a small 300ms delay like the Apps Script sleep
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    setIsRunning(false);
    onComplete();
  };

  const stopScan = () => {
    setIsRunning(false);
  };

  const progressPercent = queueRef.current.length > 0 
    ? Math.round((currentIndex / queueRef.current.length) * 100) 
    : 0;

  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  return (
    <div className="bg-white border border-[#E2E1DA] rounded-[2px] p-5 mb-6" id="bulk-scanner-container">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <RefreshCw className={`w-3.5 h-3.5 text-slate-800 ${isRunning ? 'animate-spin' : ''}`} />
            Bulk Drive Folder Scanner
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
            Automatically search Google Drive for matching folders and update links in spreadsheet row-by-row.
          </p>
        </div>
        <button
          onClick={toggleOpen}
          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[2px] border transition-all cursor-pointer ${
            isOpen 
              ? 'bg-[#FAF9F5] hover:bg-slate-100 text-slate-700 border-[#E2E1DA]' 
              : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
          }`}
          id="toggle-scanner-btn"
        >
          {isOpen ? 'Close Tool' : 'Open Scanner Tool'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-5 pt-5 border-t border-[#E2E1DA] space-y-5">
          {/* Options Panel (Only visible if not running) */}
          {!isRunning && currentIndex === 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#FAF9F5] border border-[#E2E1DA] rounded-[2px]">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Scan Filter Criteria</label>
                <div className="flex items-center gap-4 mt-1.5">
                  <label className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      checked={scanType === 'unlinked'}
                      onChange={() => setScanType('unlinked')}
                      className="text-slate-900 focus:ring-slate-900 accent-slate-900"
                    />
                    <span>Unlinked ({batches.filter(b => !b.driveUrl || b.driveUrl === '' || b.driveUrl === 'Not Found').length})</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      checked={scanType === 'all'}
                      onChange={() => setScanType('all')}
                      className="text-slate-900 focus:ring-slate-900 accent-slate-900"
                    />
                    <span>Re-scan all ({batches.length})</span>
                  </label>
                </div>
              </div>
              <button
                onClick={startScan}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white rounded-[2px] border border-slate-900 flex items-center gap-1.5 self-end sm:self-auto cursor-pointer"
                id="start-scan-btn"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Bulk Scan
              </button>
            </div>
          )}

          {/* Progress Section */}
          {(isRunning || currentIndex > 0) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-600">
                <span>
                  {isRunning 
                    ? `Scanning in progress... (${currentIndex} / ${queueRef.current.length})` 
                    : `Scan complete!`}
                </span>
                <span className="font-mono font-semibold">{progressPercent}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-200 rounded-[1px] overflow-hidden">
                <div 
                  className="h-full bg-slate-950 rounded-[1px] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
                <span className="px-2 py-1 rounded-[2px] bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {successCount} Succeeded
                </span>
                <span className="px-2 py-1 rounded-[2px] bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {failedCount} Failed/Missing
                </span>
                {isRunning && (
                  <button
                    onClick={stopScan}
                    className="ml-auto px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-[#E2E1DA] rounded-[2px] flex items-center gap-1 text-[9px] font-black uppercase tracking-wider"
                    id="stop-scan-btn"
                  >
                    <Square className="w-3 h-3 fill-slate-700 text-slate-700" />
                    Pause Scan
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Results Logger */}
          {results.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Live Log</label>
              <div className="bg-[#FAF9F5] border border-[#E2E1DA] rounded-[2px] overflow-y-auto max-h-[160px] p-3 font-mono text-[10px] space-y-1.5 shadow-none">
                {results.map((res, index) => (
                  <div key={index} className="flex items-start gap-2 border-b border-slate-200/50 pb-1 last:border-0 last:pb-0">
                    <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded-[1px] font-black inline-block flex-shrink-0 border ${
                      res.status === 'success' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {res.status === 'success' ? 'OK' : 'FAIL'}
                    </span>
                    <span className="font-bold text-slate-800 truncate max-w-[200px]" title={res.batchName}>{res.batchName}</span>
                    <span className="text-slate-500 flex-1">{res.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
