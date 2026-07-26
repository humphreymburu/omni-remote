import React, { useState } from 'react';
import { Hash, Delete, CornerDownLeft, Keyboard, Send } from 'lucide-react';
import { RemoteCommand } from '../../types';

interface NumPadRemoteProps {
  onSendCommand: (command: RemoteCommand) => void;
}

export const NumPadRemote: React.FC<NumPadRemoteProps> = ({ onSendCommand }) => {
  const [typedText, setTypedText] = useState('');

  const handleNumClick = (num: number) => {
    onSendCommand({ type: `NUM_${num}` as any, value: num });
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedText) return;
    onSendCommand({ type: 'TEXT_INPUT', value: typedText });
    setTypedText('');
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-6 rounded-[36px] bg-[#111111] border border-white/10 shadow-2xl">
      {/* Number Pad Header */}
      <div className="flex items-center justify-between px-2 text-xs font-semibold text-gray-300">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-400">
          <Hash className="w-4 h-4 text-blue-400" />
          <span>Direct Channel & Keypad</span>
        </div>
      </div>

      {/* On-Screen Keyboard Text Input */}
      <form onSubmit={handleSendText} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Keyboard className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
          <input
            type="text"
            placeholder="Type text to send to TV screen..."
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            className="w-full bg-[#121212] border border-white/10 rounded-2xl pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all shadow-md shadow-blue-600/30 active:scale-95 shrink-0"
          title="Send text to TV"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* 0-9 Keypad Grid */}
      <div className="grid grid-cols-3 gap-3 my-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumClick(num)}
            className="py-4 rounded-2xl bg-[#121212] hover:bg-blue-600 active:bg-blue-700 text-white font-extrabold text-base tracking-widest border border-white/5 shadow-md transition-all active:scale-90"
          >
            {num}
          </button>
        ))}

        <button
          onClick={() => onSendCommand({ type: 'BACK' })}
          className="py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs border border-white/5 transition-all active:scale-90 flex items-center justify-center uppercase tracking-wider"
        >
          CLEAR
        </button>

        <button
          onClick={() => handleNumClick(0)}
          className="py-4 rounded-2xl bg-[#121212] hover:bg-blue-600 text-white font-extrabold text-base tracking-widest border border-white/5 shadow-md transition-all active:scale-90"
        >
          0
        </button>

        <button
          onClick={() => onSendCommand({ type: 'NAV_SELECT' })}
          className="py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-90 flex items-center justify-center gap-1 uppercase tracking-wider"
        >
          <CornerDownLeft className="w-4 h-4" /> ENTER
        </button>
      </div>
    </div>
  );
};
