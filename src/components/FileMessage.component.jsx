import { FileCode, Download, Trash2, Activity } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function FileMessageComponent({ msg, isActiveTransfer, status, progress, acceptFile, rejectFile }) {
  const isSender = msg.side === 'local';
  
  const isCurrentlyTransferring = isActiveTransfer && (status === 'transferring' || status === 'downloading');
  const isPending = isActiveTransfer && (status === 'waiting-for-peer' || status === 'awaiting-acceptance'); 
  
//   console.log("L10 : FileMessage.component.jsx : acceptFile : ", acceptFile);

  const [speed, setSpeed] = useState("0");
  const [timeRemaining, setTimeRemaining] = useState("calculating...");
  const lastProgressRef = useRef(progress);
  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    if (isCurrentlyTransferring && progress > 0) {
      const now = Date.now();
      const timeDiff = (now - lastTimeRef.current) / 1000;
      
      // Update stats every half-second for better responsiveness
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

  // Reset tracking when transfer starts
  useEffect(() => {
     if (isCurrentlyTransferring && progress === 0) {
        lastProgressRef.current = 0;
        lastTimeRef.current = Date.now();
        setSpeed("0 MB/s");
        setTimeRemaining("calculating...");
     }
  }, [isCurrentlyTransferring, progress]);

  return (
    <div className="flex flex-col gap-4 py-1 min-w-[200px] md:min-w-[260px]">
       <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shadow-inner shrink-0">
             <FileCode className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
          </div>
          <div className="flex flex-col overflow-hidden">
             <span className="text-[8px] font-black uppercase text-blue-500 tracking-[0.2em] mb-0.5 italic">
                Binary Payload
             </span>
             <h4 className="text-sm md:text-base font-black italic text-white tracking-tight truncate w-[140px] md:w-[200px]">
                {msg.fileName}
             </h4>
             <span className="text-[9px] font-bold text-gray-700 uppercase">
                {(msg.fileSize / 1024 ** 2).toFixed(2)} MB Feed
             </span>
          </div>
       </div>

       {isCurrentlyTransferring ? (
         <div className="w-full flex flex-col gap-2 p-3 bg-black/40 rounded-xl border border-white/5 shadow-inner">
            <div className="flex justify-between items-center text-[8px] font-black uppercase">
               <span className="text-blue-500 animate-pulse italic">
                  {isSender ? 'Encrypting Payload...' : 'Decrypting Feed...'}
               </span>
               <span className="text-white">{Math.round(progress)}%</span>
            </div>
            
            <div className="flex justify-between items-center text-[8px] font-bold text-gray-500 uppercase px-1">
                <span className="flex items-center gap-1">
                   <Activity className="w-3 h-3 text-blue-500 animate-pulse" /> 
                   {speed}
                </span>
                <span>{progress > 0 ? timeRemaining : 'Initiating...'}</span>
            </div>

            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
               <div className="h-full bg-blue-500 transition-[width] duration-75 shadow-[0_0_15px_#3b82f6]" style={{ width: `${progress}%` }}></div>
            </div>
         </div>
        ) : isPending ? (
          isSender ? (
             <div className="w-full flex items-center justify-center py-3 bg-white/5 rounded-xl border border-white/10 text-[8px] font-black text-gray-500 uppercase tracking-widest animate-pulse">
                 Waiting for peer acceptance...
             </div>
          ) : (
             <div className="flex gap-2">
                <button onClick={acceptFile} className="grow py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20">
                   Accept <Download className="w-3 h-3" />
                </button>
                <button onClick={rejectFile} className="w-10 h-10 bg-white/5 hover:bg-red-500 rounded-xl flex items-center justify-center border border-white/10 text-gray-500 hover:text-white transition-all active:scale-95 shrink-0">
                   <Trash2 className="w-4 h-4" />
                </button>
             </div>
          )
       ) : null}
    </div>
  );
}
