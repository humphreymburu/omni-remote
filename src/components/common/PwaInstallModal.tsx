import React from 'react';
import { Share, PlusSquare, Smartphone, CheckCircle, X, Tv } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl shadow-2xl p-6 text-[#e0e0e0] flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-600/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Install OmniRemote on iPhone</h2>
              <p className="text-xs text-gray-400">Run as a native app on iOS & Android</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step-by-step iPhone guide */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#181818] rounded-2xl p-4 border border-white/5 flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-500/30">
              1
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                Open in Safari <span className="text-[10px] text-gray-500 font-normal">(iPhone standard browser)</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Ensure you are viewing this page in Safari on your iPhone (not Chrome or inside another app preview).
              </p>
            </div>
          </div>

          <div className="bg-[#181818] rounded-2xl p-4 border border-white/5 flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-500/30">
              2
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                Tap the Share Button <Share className="w-4 h-4 text-blue-400 inline" />
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Tap the Share icon at the bottom center of Safari navigation toolbar.
              </p>
            </div>
          </div>

          <div className="bg-[#181818] rounded-2xl p-4 border border-white/5 flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-500/30">
              3
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                Select "Add to Home Screen" <PlusSquare className="w-4 h-4 text-blue-400 inline" />
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Scroll down the options list and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong> in top right.
              </p>
            </div>
          </div>

          <div className="bg-[#181818] rounded-2xl p-4 border border-white/5 flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 font-bold text-sm flex items-center justify-center shrink-0 border border-green-500/30">
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Full-Screen TV Remote App</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Launch OmniRemote directly from your iOS Home Screen without browser address bars!
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs transition-colors shadow-lg shadow-blue-600/30 uppercase tracking-wider"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
