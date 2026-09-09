import React, { useState } from 'react';
import { HardDrive, ExternalLink, Chrome, Edit2, Loader2, AlertCircle, RefreshCw, Sparkles, Copy, CheckCircle, Share2 } from 'lucide-react';
import { Batch, getBatchFormattedTitle } from '../types';

interface BatchCardProps {
  key?: string;
  batch: Batch;
  onEdit: (batch: Batch) => void;
  onScan: (batch: Batch) => Promise<void>;
  onExplain?: (batch: Batch) => void;
}

export default function BatchCard({ batch, onEdit, onScan, onExplain }: BatchCardProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const formattedTitle = React.useMemo(() => {
    return getBatchFormattedTitle(batch);
  }, [batch.displayName, batch.fullName]);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(formattedTitle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textLines = [
      `*📌 ${formattedTitle}*`,
      `🏷 *Category:* ${batch.category}${batch.phase && batch.phase !== 'Unknown' ? ` | ${batch.phase}` : ''}${batch.timeSlot ? ` | ${batch.timeSlot}` : ''}`,
      batch.bmEmail ? `👤 *BM:* ${batch.bmEmail.split('@')[0]}` : '',
      hasDriveLink ? `📂 *Drive:* ${batch.driveUrl}` : '',
      hasAdminLink ? `🔗 *Admin:* ${batch.adminUrl}` : '',
      hasAppLink ? `📱 *App:* ${batch.pwUrl}` : '',
    ].filter(Boolean).join('\n');

    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textLines)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleScanClick = async () => {
    setIsScanning(true);
    setScanError(null);
    try {
      await onScan(batch);
    } catch (err: any) {
      setScanError(err.message || 'Scan failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const hasDriveLink = batch.driveUrl && batch.driveUrl !== '' && batch.driveUrl !== 'Not Found';
  const hasAdminLink = batch.adminUrl && batch.adminUrl !== '';
  const hasAppLink = batch.pwUrl && batch.pwUrl !== '';

  // Badge styles based on screenshot and elegant palettes
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

  const getPhaseStyles = (phase: string) => {
    if (phase.includes('1')) return 'bg-slate-50 text-slate-700 border border-slate-100';
    if (phase.includes('2')) return 'bg-orange-50 text-orange-700 border border-orange-100';
    if (phase.includes('3')) return 'bg-teal-50 text-teal-700 border border-teal-100';
    return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
  };

  const getTimeSlotStyles = (slot: string) => {
    switch (slot) {
      case 'Morning':
        return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'Afternoon':
        return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'Evening':
        return 'bg-sky-50 text-sky-700 border border-sky-100';
      case 'Weekend':
        return 'bg-rose-50 text-rose-700 border border-rose-100';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  };

  return (
    <div 
      className="bg-white rounded-[2px] border border-[#E2E1DA] hover:border-slate-900/40 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4 transition-all relative group shadow-2xs"
      id={`batch-${batch.rowIndex}`}
    >
      {/* Left Details */}
      <div className="space-y-2.5 sm:space-y-3 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2.5">
          <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate font-sans">
            {formattedTitle}
          </h4>
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-1.5 text-slate-400 hover:text-slate-950 hover:bg-[#FAF9F5] rounded-[2px] transition-all cursor-pointer flex items-center justify-center border border-transparent hover:border-slate-200"
              title="Copy batch code"
            >
              {copied ? (
                <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider px-1">Copied!</span>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-[2px] transition-all cursor-pointer flex items-center justify-center border border-transparent hover:border-emerald-200"
              title="Share batch details on WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(batch)}
              className="p-1.5 text-slate-400 hover:text-slate-950 hover:bg-[#FAF9F5] rounded-[2px] transition-all cursor-pointer flex items-center justify-center border border-transparent hover:border-slate-200"
              title="Edit details"
              id={`edit-btn-${batch.rowIndex}`}
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
          <span className={`px-2.5 py-1 rounded-[2px] font-black tracking-wide uppercase text-[10px] sm:text-[11px] shadow-2xs ${getCategoryStyles(batch.category)}`}>
            {batch.category}
          </span>
          {batch.phase && batch.phase !== 'Unknown' && (
            <span className={`px-2.5 py-1 rounded-[2px] font-black uppercase text-[10px] sm:text-[11px] shadow-2xs ${getPhaseStyles(batch.phase)}`}>
              {batch.phase}
            </span>
          )}
          {batch.timeSlot && (
            <span className={`px-2.5 py-1 rounded-[2px] font-black uppercase text-[10px] sm:text-[11px] shadow-2xs ${getTimeSlotStyles(batch.timeSlot)}`}>
              {batch.timeSlot}
            </span>
          )}
          {batch.bmEmail ? (
            <span className="px-2.5 py-1 rounded-[2px] bg-slate-50 text-slate-700 border border-slate-200 text-[10px] sm:text-[11px] font-black uppercase tracking-wider truncate max-w-[200px] sm:max-w-none shadow-2xs" title={`Manager: ${batch.bmEmail}`}>
              BM: {batch.bmEmail.split('@')[0]}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-[2px] bg-red-50 text-red-600 border border-red-200 text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-2xs">
              No Manager Assigned
            </span>
          )}
          {batch.previousNames && batch.previousNames.length > 0 && (
            <span 
              className="px-2.5 py-1 rounded-[2px] bg-slate-100 text-slate-600 border border-slate-300 text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-2xs"
              title={`Combined with earlier row: ${batch.previousNames.join(', ')}`}
            >
              Prev: {batch.previousNames[batch.previousNames.length - 1]}
            </span>
          )}
        </div>

        {/* Scan Status Feedback */}
        {batch.matchStatus && (
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${hasDriveLink ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <span>Status: {batch.matchStatus}</span>
          </div>
        )}
        {scanError && (
          <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>{scanError}</span>
          </div>
        )}
      </div>

      {/* Right Actions - Full Width 4-Col Grid on Mobile, Flex on Desktop */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full lg:w-auto lg:flex lg:items-center flex-shrink-0 pt-3 lg:pt-0 border-t border-slate-100 lg:border-none">
        {/* AI Explainer Action */}
        {onExplain && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onExplain(batch);
            }}
            className="w-full lg:w-auto px-2 sm:px-3 py-2.5 sm:py-2 text-[11px] sm:text-xs font-black bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 rounded-[2px] border border-indigo-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider group/aidecode shadow-xs active:scale-95"
            title="View Today's Schedule & AI Decode (Raw_DB)"
            id={`ai-decode-btn-${batch.rowIndex}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 fill-indigo-200 group-hover/aidecode:scale-110 transition-transform flex-shrink-0" />
            <span className="truncate">AI Decode</span>
          </button>
        )}

        {/* Drive Action */}
        {hasDriveLink ? (
          <a
            href={batch.driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            className="w-full lg:w-auto px-2 sm:px-3 py-2.5 sm:py-2 text-[11px] sm:text-xs font-black border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70 rounded-[2px] flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider shadow-xs active:scale-95"
            id={`drive-link-${batch.rowIndex}`}
          >
            <HardDrive className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Drive</span>
          </a>
        ) : (
          <button
            onClick={handleScanClick}
            disabled={isScanning}
            className="w-full lg:w-auto px-2 sm:px-3 py-2.5 sm:py-2 text-[11px] sm:text-xs font-black border border-dashed border-amber-300 bg-amber-50/50 text-amber-700 hover:bg-amber-100 rounded-[2px] flex items-center justify-center gap-1.5 transition-all disabled:opacity-65 uppercase tracking-wider shadow-xs active:scale-95 cursor-pointer"
            id={`scan-btn-${batch.rowIndex}`}
          >
            {isScanning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 flex-shrink-0" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-45 transition-transform flex-shrink-0" />
            )}
            <span className="truncate">Scan Drive</span>
          </button>
        )}

        {/* PW / App Action */}
        {hasAppLink ? (
          <a
            href={batch.pwUrl}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            className="w-full lg:w-auto px-2 sm:px-3 py-2.5 sm:py-2 text-[11px] sm:text-xs font-black border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-[2px] flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider shadow-xs active:scale-95"
            id={`app-link-${batch.rowIndex}`}
          >
            <Chrome className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="truncate">App</span>
          </a>
        ) : (
          <button
            disabled
            className="w-full lg:w-auto px-2 sm:px-3 py-2.5 sm:py-2 text-[11px] sm:text-xs font-black border border-slate-100 bg-slate-50 text-slate-300 rounded-[2px] flex items-center justify-center gap-1.5 cursor-not-allowed uppercase tracking-wider"
            id={`app-link-disabled-${batch.rowIndex}`}
          >
            <Chrome className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">App</span>
          </button>
        )}

        {/* Admin Action */}
        {hasAdminLink ? (
          <a
            href={batch.adminUrl}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            className="w-full lg:w-auto px-2 sm:px-3 py-2.5 sm:py-2 text-[11px] sm:text-xs font-black bg-slate-900 hover:bg-black text-white border border-slate-900 rounded-[2px] flex items-center justify-center gap-1.5 transition-all duration-200 uppercase tracking-wider shadow-xs active:scale-95"
            id={`admin-link-${batch.rowIndex}`}
          >
            <span className="truncate">Admin</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80 flex-shrink-0" />
          </a>
        ) : (
          <button
            disabled
            className="w-full lg:w-auto px-2 sm:px-3 py-2.5 sm:py-2 text-[11px] sm:text-xs font-black bg-slate-50 border border-slate-100 text-slate-300 rounded-[2px] flex items-center justify-center gap-1.5 cursor-not-allowed uppercase tracking-wider"
            id={`admin-link-disabled-${batch.rowIndex}`}
          >
            <span className="truncate">Admin</span>
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}
