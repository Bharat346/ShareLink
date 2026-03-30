import { FileCode, Download, Trash2, Activity, ShieldCheck } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function FileMessage({ msg, isActiveTransfer, status, progress, acceptFile, rejectFile }) {
  const isLocal = msg.side === 'local';
  const isCurrentlyTransferring = isActiveTransfer && (status === 'transferring' || status === 'downloading');
  const isPending = isActiveTransfer && (status === 'waiting-for-peer' || status === 'awaiting-acceptance'); 
  
  const [speed, setSpeed] = useState("0");
  const [timeRemaining, setTimeRemaining] = useState("calculating...");
  const lastProgressRef = useRef(progress);
  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    if (isCurrentlyTransferring && progress > 0) {
      const now = Date.now();
      const timeDiff = (now - lastTimeRef.current) / 1000;
      
      if (timeDiff >= 0.5) {
         const percentDiff = progress - lastProgressRef.current;
         if (percentDiff > 0 && msg.fileSize) {
            const bytesReceived = (percentDiff / 100) * msg.fileSize;
            const bytesPerSec = bytesReceived / timeDiff;
            
            const mbps = (bytesPerSec / 1024 / 1024).toFixed(1);
            setSpeed(`${mbps} MB/s`);
            
            const percentRemaining = 100 - progress;
            const bytesRemaining = (percentRemaining / 100) * msg.fileSize;
            const secsRemaining = Math.max(0, bytesRemaining / bytesPerSec);
            
            if (secsRemaining < 60) {
               setTimeRemaining(`${Math.ceil(secsRemaining)}s left`);
            } else {
               setTimeRemaining(`${Math.ceil(secsRemaining / 60)}m left`);
            }
         }
         lastProgressRef.current = progress;
         lastTimeRef.current = now;
      }
    }
  }, [progress, isCurrentlyTransferring, msg.fileSize]);

  useEffect(() => {
     if (isCurrentlyTransferring && progress === 0) {
        lastProgressRef.current = 0;
        lastTimeRef.current = Date.now();
        setSpeed("0 MB/s");
        setTimeRemaining("calculating...");
     }
  }, [isCurrentlyTransferring, progress]);

  return (
    <div className={`flex flex-col gap-4 py-1 min-w-[220px] md:min-w-[280px] ${isLocal ? 'text-white' : 'text-text-primary'}`}>
       <div className="flex items-center gap-3 md:gap-4">
          <div className={`w-11 h-11 md:w-12 md:h-12 ${isLocal ? 'bg-white/20' : 'bg-accent-primary/10'} rounded-2xl flex items-center justify-center border border-white/10 shadow-inner shrink-0`}>
             <FileCode className={`w-5.5 h-5.5 md:w-6 md:h-6 ${isLocal ? 'text-white' : 'text-accent-primary'}`} />
          </div>
          <div className="flex flex-col overflow-hidden">
             <div className="flex items-center gap-1.5 mb-1">
                <ShieldCheck className={`w-3 h-3 ${isLocal ? 'text-white/60' : 'text-accent-primary/60'}`} />
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isLocal ? 'text-white/60' : 'text-text-muted'}`}>
                   Binary Transfer
                </span>
             </div>
             <h4 className="text-sm md:text-base font-bold tracking-tight truncate max-w-[160px] md:max-w-[200px]">
                {msg.fileName}
             </h4>
             <span className={`text-[10px] font-medium uppercase mt-0.5 ${isLocal ? 'text-white/50' : 'text-text-muted'}`}>
                {(msg.fileSize / 1024 ** 2).toFixed(2)} MB • {msg.side === 'local' ? 'Sent' : 'Received'}
             </span>
          </div>
       </div>

       {isCurrentlyTransferring ? (
         <div className={`w-full flex flex-col gap-2.5 p-3.5 ${isLocal ? 'bg-black/20' : 'bg-bg-base/80'} rounded-2xl border border-white/5 shadow-inner`}>
            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
               <span className={`${isLocal ? 'text-white' : 'text-accent-primary'} animate-pulse`}>
                  {isLocal ? 'Syncing Outbound' : 'Syncing Inbound'}
               </span>
               <span className={isLocal ? 'text-white' : 'text-text-primary'}>{Math.round(progress)}%</span>
            </div>
            
            <div className={`flex justify-between items-center text-[9px] font-medium uppercase px-0.5 ${isLocal ? 'text-white/40' : 'text-text-muted'}`}>
                <span className="flex items-center gap-1.5">
                   <Activity className={`w-3 h-3 ${isLocal ? 'text-white/60' : 'text-accent-primary/60'} animate-pulse`} /> 
                   {speed}
                </span>
                <span>{progress > 0 ? timeRemaining : 'Waking nodes...'}</span>
            </div>

            <div className={`w-full h-1.5 ${isLocal ? 'bg-white/10' : 'bg-white/5'} rounded-full overflow-hidden`}>
               <div 
                 className={`h-full ${isLocal ? 'bg-white' : 'bg-accent-primary'} transition-[width] duration-100 shadow-[0_0_12px_rgba(255,255,255,0.4)]`} 
                 style={{ width: `${progress}%` }}
                ></div>
            </div>
         </div>
        ) : isPending ? (
          isLocal ? (
             <div className={`w-full flex items-center justify-center py-3.5 ${isLocal ? 'bg-white/10' : 'bg-white/5'} rounded-2xl border border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest animate-pulse`}>
                 Awaiting Peer Approval
             </div>
          ) : (
             <div className="flex gap-2.5">
                <button 
                  onClick={acceptFile} 
                  className="grow py-3 bg-accent-primary hover:brightness-110 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-lg shadow-accent-primary/20"
                >
                   Accept <Download className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={rejectFile} 
                  className="w-11 h-11 bg-bg-base/40 hover:bg-accent-red rounded-xl flex items-center justify-center border border-border-default text-text-muted hover:text-white transition-all active:scale-95 shrink-0"
                >
                   <Trash2 className="w-4.5 h-4.5" />
                </button>
             </div>
          )
       ) : null}
    </div>
  );
}
