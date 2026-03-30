import { useState, useRef, useEffect } from "react";
import { Activity, Play, Pause } from "lucide-react";

export default function AudioMessage({ msg, progress, isActive }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!audioRef.current || msg.isTransferring) return;
    if (isPlaying) {
       audioRef.current.pause();
    } else {
       audioRef.current.play();
    }
  };

  const isBuffering = msg.isTransferring && isActive;
  const isLocal = msg.side === 'local';

  return (
    <div 
      onClick={togglePlay} 
      className={`flex items-center gap-4 select-none min-w-[200px] md:min-w-[240px] px-1 py-1 ${!isBuffering ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-wait'}`}
    >
      <div className={`w-10 h-10 ${isLocal ? 'bg-white/20' : 'bg-accent-primary/10'} rounded-full flex items-center justify-center shrink-0 border border-white/10 shadow-inner`}>
         {isBuffering ? (
           <Activity className="w-4 h-4 text-white animate-pulse" />
         ) : isPlaying ? (
           <Pause className="w-4 h-4 text-white" />
         ) : (
           <Play className="w-4 h-4 text-white translate-x-0.5" />
         )}
      </div>
      <div className="flex flex-col grow min-w-0">
          <div className="flex justify-between items-center mb-1.5 px-0.5">
             <span className={`text-[10px] font-bold uppercase tracking-wider ${isBuffering ? 'text-white animate-pulse' : isLocal ? 'text-white/80' : 'text-accent-primary'}`}>
                {isBuffering ? 'Streaming...' : 'Voice Note'}
             </span>
             <span className={`text-[8px] font-bold uppercase ${isLocal ? 'text-white/40' : 'text-text-muted'}`}>
                {msg.side === 'local' ? 'Host' : 'Peer'}
             </span>
          </div>
          <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden border border-white/5 shadow-inner">
             <div 
               className={`h-full rounded-full transition-all ${isBuffering ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] duration-75' : isLocal ? 'bg-white' : 'bg-accent-primary'} duration-300`} 
               style={{ width: `${isBuffering ? progress : audioProgress}%` }} 
             />
          </div>
          <div className={`flex justify-between mt-1 text-[8px] font-bold uppercase tracking-wider px-0.5 ${isLocal ? 'text-white/40' : 'text-text-muted'}`}>
             <span>{isBuffering ? 'Deciphering...' : 'Synced'}</span>
             {isBuffering && <span>{Math.round(progress)}%</span>}
          </div>
      </div>
      {msg.url && (
        <audio 
          ref={audioRef} 
          src={msg.url} 
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onTimeUpdate={(e) => {
             if (e.target.duration) {
                setAudioProgress((e.target.currentTime / e.target.duration) * 100);
             }
          }}
          className="hidden" 
        />
      )}
    </div>
  );
}
