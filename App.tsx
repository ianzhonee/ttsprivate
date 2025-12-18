import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateSpeech } from './services/geminiService';
import { decode, decodeAudioData, audioBufferToWav } from './utils/audioUtils';
import Waveform from './components/Waveform';
import { VoiceName } from './types';

// Icons
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M8 5v14l11-7z"/></svg>
);
const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M6 6h12v12H6z"/></svg>
);
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M3 9h4"/><path d="M3 5h4"/></svg>
);
const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);

const App: React.FC = () => {
  const [text, setText] = useState<string>("Modal 60 ribu doang, bisa dapet celana sekeren ini? Yakin nggak mau?");
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(VoiceName.Kore);
  const [style, setStyle] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  // Refs for audio context and source
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize AudioContext lazily (browsers require user interaction)
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }
    // Resume if suspended
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const handleStop = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // already stopped
      }
    }
    setIsPlaying(false);
  };

  const clearAudioState = () => {
    if (audioBuffer || isPlaying) {
      handleStop();
      setAudioBuffer(null);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    clearAudioState();
  };

  const handleStyleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStyle(e.target.value);
    clearAudioState();
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVoice(e.target.value as VoiceName);
    clearAudioState();
  };

  const handleGenerateAndPlay = async () => {
    if (!text.trim()) return;

    setError(null);
    setIsLoading(true);
    
    // Stop any current playback
    handleStop();
    setAudioBuffer(null);

    try {
      const base64Audio = await generateSpeech(text, selectedVoice, style);
      
      const ctx = getAudioContext();
      const rawBytes = decode(base64Audio);
      const decodedBuffer = await decodeAudioData(rawBytes, ctx, 24000, 1);
      
      setAudioBuffer(decodedBuffer);
      
      // Auto play after generation
      playBuffer(decodedBuffer);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate speech. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const playBuffer = (buffer: AudioBuffer) => {
    const ctx = getAudioContext();
    
    // Disconnect old source if exists
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
      } catch (e) {
        // Ignore error if already stopped
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
      setIsPlaying(false);
    };

    audioSourceRef.current = source;
    source.start();
    setIsPlaying(true);
  };

  const handlePlayReplay = () => {
    if (audioBuffer) {
      if (isPlaying) {
        handleStop(); // If clicking play while playing, act as stop/replay or just let it continue? Usually restart.
        setTimeout(() => playBuffer(audioBuffer), 50); // slight delay to ensure clean restart
      } else {
        playBuffer(audioBuffer);
      }
    } else {
      handleGenerateAndPlay();
    }
  };

  const handleDownload = () => {
    if (!audioBuffer) return;
    
    try {
      const wavBlob = audioBufferToWav(audioBuffer);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gemini-vox-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download audio:", err);
      setError("Failed to download audio file.");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20">
             <SparklesIcon />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Gemini Vox</h1>
            <p className="text-sm text-slate-400">Powered by Gemini 2.5 Flash TTS</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          
          {/* Controls Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Voice</label>
              <select 
                value={selectedVoice}
                onChange={handleVoiceChange}
                className="w-full bg-slate-800 text-white text-sm rounded-lg px-3 py-2.5 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none hover:bg-slate-750 transition-colors"
                disabled={isLoading || isPlaying}
              >
                {Object.values(VoiceName).map(voice => (
                  <option key={voice} value={voice}>{voice}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Style / Tone</label>
              <input
                type="text"
                value={style}
                onChange={handleStyleChange}
                placeholder="e.g. Cheerfully, Whispering..."
                className="w-full bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-500 hover:bg-slate-750 transition-colors"
                disabled={isLoading || isPlaying}
              />
            </div>
          </div>

          {/* Text Input */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl opacity-30 group-focus-within:opacity-100 transition duration-300 blur-sm"></div>
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder="Enter text to generate speech..."
              className="relative w-full h-40 bg-slate-900/90 text-slate-100 p-4 rounded-xl border border-white/10 focus:outline-none focus:ring-0 resize-none text-lg leading-relaxed placeholder-slate-600 shadow-inner"
              spellCheck={false}
            />
          </div>

          {/* Visualization Area */}
          <div className="h-16 bg-slate-950/50 rounded-xl border border-white/5 flex items-center justify-center px-4 relative overflow-hidden">
            <div className={`absolute inset-0 bg-indigo-500/5 transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}></div>
            {audioBuffer ? (
              <Waveform isPlaying={isPlaying} />
            ) : (
              <span className="text-slate-600 text-sm font-medium">Waveform visualization will appear here</span>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            
            {audioBuffer && (
              <button
                onClick={handleDownload}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all active:scale-95 border border-white/10"
                title="Download WAV"
              >
                <DownloadIcon />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}

            {isPlaying && (
               <button
               onClick={handleStop}
               className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-slate-700 text-white hover:bg-slate-600 transition-all active:scale-95 border border-white/5"
             >
               <StopIcon />
               Stop
             </button>
            )}

            <button
              onClick={audioBuffer ? handlePlayReplay : handleGenerateAndPlay}
              disabled={isLoading || !text.trim()}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white shadow-xl shadow-indigo-500/20 transition-all active:scale-95 border border-white/10 
                ${isLoading 
                  ? 'bg-slate-700 cursor-not-allowed opacity-70' 
                  : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/40'
                }
              `}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <PlayIcon />
                  <span>{audioBuffer ? (isPlaying ? 'Replay' : 'Play Again') : 'Generate Speech'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/50 border-t border-white/5 text-xs text-slate-500 text-center flex justify-between items-center">
          <span>Gemini 2.5 Flash Preview • Google DeepMind</span>
          <span className="text-slate-600">24kHz • Mono</span>
        </div>

      </div>
    </div>
  );
};

export default App;