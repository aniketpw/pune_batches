import React, { useState } from 'react';
import { X, Save, Loader2, Link2, ExternalLink } from 'lucide-react';
import { Batch } from '../types';

interface EditBatchModalProps {
  batch: Batch;
  onClose: () => void;
  onSave: (updatedFields: { adminUrl: string; pwUrl: string; driveUrl: string; matchStatus: string }) => Promise<void>;
}

export default function EditBatchModal({ batch, onClose, onSave }: EditBatchModalProps) {
  const [adminUrl, setAdminUrl] = useState(batch.adminUrl || '');
  const [pwUrl, setPwUrl] = useState(batch.pwUrl || '');
  const [driveUrl, setDriveUrl] = useState(batch.driveUrl || '');
  const [matchStatus, setMatchStatus] = useState(batch.matchStatus || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onSave({ adminUrl, pwUrl, driveUrl, matchStatus });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update batch links.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/35 flex items-center justify-center p-4 z-50 touch-none overscroll-none select-none">
      <div 
        className="bg-white rounded-[2px] shadow-none w-full max-w-lg overflow-hidden border border-[#E2E1DA] overscroll-contain select-auto"
        id="edit-batch-modal"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E1DA] flex items-center justify-between bg-[#FAF9F5]">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Edit Batch Links</h3>
            <p className="text-[10px] text-slate-500 font-mono font-bold mt-0.5 uppercase tracking-wide">{batch.fullName}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-[2px] transition-all cursor-pointer"
            id="close-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-[2px] text-[10px] font-bold uppercase tracking-wider">
              {error}
            </div>
          )}

          {/* Admin URL */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>Admin URL</span>
              {adminUrl && (
                <a href={adminUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5 text-[9px] font-bold">
                  Test <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </label>
            <div className="relative">
              <input
                type="url"
                value={adminUrl}
                onChange={(e) => setAdminUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-xs px-3 py-1.5 border border-[#E2E1DA] rounded-[2px] focus:outline-none focus:border-slate-800 transition-all text-slate-800 placeholder-slate-400 bg-white"
              />
            </div>
          </div>

          {/* PW App / PW URL */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>App / PW URL</span>
              {pwUrl && (
                <a href={pwUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5 text-[9px] font-bold">
                  Test <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </label>
            <input
              type="url"
              value={pwUrl}
              onChange={(e) => setPwUrl(e.target.value)}
              placeholder="https://..."
              className="w-full text-xs px-3 py-1.5 border border-[#E2E1DA] rounded-[2px] focus:outline-none focus:border-slate-800 transition-all text-slate-800 placeholder-slate-400 bg-white"
            />
          </div>

          {/* Drive Link */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>Google Drive Link</span>
              {driveUrl && driveUrl !== 'Not Found' && (
                <a href={driveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5 text-[9px] font-bold">
                  Test <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </label>
            <input
              type="text"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="Google Drive Folder URL"
              className="w-full text-xs px-3 py-1.5 border border-[#E2E1DA] rounded-[2px] focus:outline-none focus:border-slate-800 transition-all text-slate-800 placeholder-slate-400 bg-white"
            />
          </div>

          {/* Match Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-700">
              Drive Match Status
            </label>
            <input
              type="text"
              value={matchStatus}
              onChange={(e) => setMatchStatus(e.target.value)}
              placeholder="e.g. Found: Folder Name or Missing: Code"
              className="w-full text-xs px-3 py-1.5 border border-[#E2E1DA] rounded-[2px] focus:outline-none focus:border-slate-800 transition-all text-slate-800 placeholder-slate-400 bg-white"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E1DA]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 border border-[#E2E1DA] rounded-[2px] transition-all cursor-pointer"
              id="cancel-modal-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-[2px] border border-slate-900 flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
              id="save-modal-btn"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save to Sheet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
