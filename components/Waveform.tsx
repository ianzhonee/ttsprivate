import React from 'react';

interface WaveformProps {
  isPlaying: boolean;
}

const Waveform: React.FC<WaveformProps> = ({ isPlaying }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-12 w-full overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className={`w-1.5 bg-indigo-400 rounded-full transition-all duration-300 ${
            isPlaying ? 'animate-pulse' : 'h-1 opacity-50'
          }`}
          style={{
            height: isPlaying ? `${Math.random() * 100}%` : '4px',
            animationDelay: `${i * 0.05}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
};

export default Waveform;