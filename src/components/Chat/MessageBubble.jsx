import { CheckCheck, Terminal } from "lucide-react";

export default function MessageBubble({ msg, children, side }) {
  const isLocal = side === 'local' || msg.side === 'local';
  
  return (
    <div className={`flex w-full gap-1 md:gap-2 ${isLocal ? 'flex-row-reverse' : 'flex-row'} items-start animate-in px-2 md:px-6`}>
      {/* AVATAR */}
      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 border border-accent-primary/20 overflow-hidden shadow-[0_0_15px_var(--accent-primary-glow)] ${isLocal ? 'bg-accent-secondary/5' : 'bg-accent-primary/5'}`}>
         <div className="text-[9px] md:text-[10px] font-mono font-bold text-accent-primary uppercase italic">
            {msg.sender?.substring(0, 2) || "??"}
         </div>
      </div>

      {/* BUBBLE WRAPPER */}
      <div className={`flex flex-col max-w-[85%] md:max-w-[65%] gap-1 ${isLocal ? 'items-end' : 'items-start'}`}>
        <div className={`relative px-3 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl shadow-xl group/bubble bg-[#0a1a0f]/90 backdrop-blur-xl border border-accent-primary/20 hover:border-accent-primary/40 transition-all hover:shadow-[0_0_25px_var(--accent-primary-glow)] ${
          isLocal 
            ? 'rounded-tr-none border-r-accent-primary/40' 
            : 'rounded-tl-none border-l-accent-primary/40'
        }`}>

          {/* METADATA HEADER */}
          <div className="flex items-center gap-1 mb-2 opacity-50 font-mono">
            <span className={`text-[9px] font-bold uppercase tracking-widest ${isLocal ? 'text-accent-secondary' : 'text-accent-primary'}`}>
               {msg.sender}
            </span>
          </div>

          {/* CONTENT */}
          <div className="flex flex-col gap-2">
            <div className={`text-xs md:text-sm leading-relaxed text-glow break-words min-w-0 font-mono ${isLocal ? 'text-accent-secondary' : 'text-accent-primary'}`}>
               {children || <span className="block whitespace-pre-wrap">{msg.message}</span>}
            </div>
            
            <div className="flex items-center gap-0 opacity-50 ml-auto shrink-0 font-mono">
               <span className="text-[8px] font-bold text-text-muted uppercase">{msg.time}</span>
               {isLocal && (
                 <CheckCheck className="w-3 h-3 text-accent-primary" />
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
