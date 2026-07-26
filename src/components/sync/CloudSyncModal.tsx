import React, { useState } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  ShieldCheck,
  X,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCloudSync: (accountId: string) => Promise<boolean>;
  onLoadCloudSync: (accountId: string) => Promise<boolean>;
  onExportJSON: () => void;
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  onSaveCloudSync,
  onLoadCloudSync,
  onExportJSON,
  onImportJSON,
}) => {
  const [accountId, setAccountId] = useState<string>('user-remote-profile-1');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSave = async () => {
    setIsLoading(true);
    setStatusMsg('');
    const success = await onSaveCloudSync(accountId);
    setIsLoading(false);
    setStatusMsg(
      success ? 'Remote setup backed up to cloud successfully.' : 'Failed to save to cloud.'
    );
  };

  const handleLoad = async () => {
    setIsLoading(true);
    setStatusMsg('');
    const success = await onLoadCloudSync(accountId);
    setIsLoading(false);
    setStatusMsg(
      success ? 'Remote profile restored from cloud successfully.' : 'No cloud profile found for ID.'
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Multi-Device Cloud Sync</h2>
              <p className="text-xs text-slate-400">Sync remote configurations across devices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Account ID Form */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-sky-400" /> Cloud Profile Sync Key / Account ID
          </label>
          <input
            type="text"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="e.g. my-family-livingroom"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-500"
          />

          <div className="grid grid-cols-2 gap-3 mt-1">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CloudUpload className="w-4 h-4" />
              )}
              Backup to Cloud
            </button>

            <button
              onClick={handleLoad}
              disabled={isLoading}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CloudDownload className="w-4 h-4" />
              )}
              Restore Profile
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-sky-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Local JSON Backup / Export */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col gap-2.5">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <FileJson className="w-4 h-4 text-amber-400" /> Offline File Backup & Import
          </h4>
          <p className="text-[11px] text-slate-400">
            Export your remote layout, custom channels, and touch gestures as a JSON file.
          </p>

          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={onExportJSON}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-700"
            >
              Export JSON
            </button>

            <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer">
              Import JSON
              <input type="file" accept=".json" onChange={onImportJSON} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
