import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { TVDevice, VoiceCommandResult, RemoteCommand } from '../../types';

interface VoiceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDevice: TVDevice | null;
  onExecuteActions: (actions: Array<{ type: string; value?: string }>) => void;
}

export const VoiceControlModal: React.FC<VoiceControlModalProps> = ({
  isOpen,
  onClose,
  activeDevice,
  onExecuteActions,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<VoiceCommandResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setErrorMsg('');
        };

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            current += event.results[i][0].transcript;
          }
          setTranscript(current);
        };

        recognition.onerror = (event: any) => {
          setIsListening(false);
          if (event.error !== 'no-speech') {
            setErrorMsg(`Microphone error: ${event.error}. You can type command below.`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const startListening = () => {
    setResult(null);
    setTranscript('');
    setErrorMsg('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        setIsListening(false);
      }
    } else {
      setErrorMsg('Web Speech recognition is not supported in this browser. Please type command.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleProcessTextCommand = async (commandString: string) => {
    if (!commandString.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch('/api/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: commandString,
          currentDevice: activeDevice,
        }),
      });

      const data: VoiceCommandResult = await res.json();
      setResult(data);

      if (data.actions && data.actions.length > 0) {
        onExecuteActions(data.actions);
      }

      // Optional TTS confirmation voice response
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && data.voiceResponse) {
        const utterance = new SpeechSynthesisUtterance(data.voiceResponse);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      setErrorMsg('Failed to process voice command. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 flex flex-col gap-5 relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Voice & AI Remote Assistant</h2>
              <p className="text-xs text-slate-400">Natural language smart TV control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Microphone Pulse & Listener */}
        <div className="flex flex-col items-center justify-center py-6 gap-4 bg-slate-950/80 rounded-2xl border border-slate-800/80">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`relative p-6 rounded-full transition-all duration-300 shadow-2xl flex items-center justify-center active:scale-95 ${
              isListening
                ? 'bg-red-600 text-white shadow-red-600/50 ring-8 ring-red-500/30 animate-pulse'
                : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-indigo-600/30 ring-4 ring-indigo-500/20 hover:scale-105'
            }`}
          >
            {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>

          <div className="text-center px-4">
            <p className="text-sm font-bold text-slate-200">
              {isListening ? 'Listening... Speak now!' : 'Tap mic button or type command below'}
            </p>
            {transcript && (
              <p className="text-xs font-mono text-indigo-300 mt-2 bg-indigo-950/50 px-3 py-1.5 rounded-lg border border-indigo-500/30">
                "{transcript}"
              </p>
            )}
          </div>

          {/* Quick Trigger Button after Speech */}
          {transcript && !isListening && (
            <button
              onClick={() => handleProcessTextCommand(transcript)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Send className="w-3.5 h-3.5" /> Execute "{transcript}"
            </button>
          )}
        </div>

        {/* Text Input Fallback */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleProcessTextCommand(inputText);
            setInputText('');
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type e.g. 'Launch Netflix and turn volume up to 25'..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-md shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>

        {/* Result Feedback Banner */}
        {result && (
          <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-xl p-3 text-xs flex flex-col gap-1.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Command Processed</span>
            </div>
            <p className="text-slate-200 font-medium">{result.summary}</p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-950/60 border border-red-500/40 rounded-xl p-3 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Example Voice Commands */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex flex-col gap-1">
          <span className="font-semibold text-slate-300 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> Example Voice Commands:
          </span>
          <div className="grid grid-cols-2 gap-1 text-slate-400 mt-1">
            <button
              onClick={() => handleProcessTextCommand('Mute TV')}
              className="text-left hover:text-indigo-300 transition-colors"
            >
              • "Mute TV"
            </button>
            <button
              onClick={() => handleProcessTextCommand('Launch YouTube')}
              className="text-left hover:text-indigo-300 transition-colors"
            >
              • "Launch YouTube"
            </button>
            <button
              onClick={() => handleProcessTextCommand('Volume up by 10')}
              className="text-left hover:text-indigo-300 transition-colors"
            >
              • "Volume up by 10"
            </button>
            <button
              onClick={() => handleProcessTextCommand('Switch to HDMI 1')}
              className="text-left hover:text-indigo-300 transition-colors"
            >
              • "Switch to HDMI 1"
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
