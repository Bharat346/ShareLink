import { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import { 
  Send, 
  MessageSquare, 
  Phone, 
  PhoneOff, 
  FileCode, 
  Download, 
  Trash2, 
  Paperclip, 
  Smile, 
  LogOut, 
  Hash, 
  User,
  Activity,
  Mic,
  Square,
  Play,
  Pause,
  Menu,
  X
} from "lucide-react";
import FileMessageComponent from "./FileMessage.component";

const AudioMessage = ({ msg, progress, isActive }) => {
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

  return (
    <div 
      onClick={togglePlay} 
      className={`flex items-center gap-4 select-none min-w-[200px] md:min-w-[240px] px-1 py-0.5 ${!isBuffering ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-wait'}`}
    >
      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
         {isBuffering ? (
           <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
         ) : isPlaying ? (
           <Pause className="w-4 h-4 text-blue-400" />
         ) : (
           <Play className="w-4 h-4 text-white translate-x-0.5" />
         )}
      </div>
      <div className="flex flex-col grow min-w-0">
          <div className="flex justify-between items-center mb-1.5 px-0.5">
             <span className={`text-[8px] font-black uppercase tracking-widest italic ${isBuffering ? 'text-blue-500 animate-pulse' : 'text-gray-500'}`}>
                {isBuffering ? 'Streaming Feed...' : 'Voice Note'}
             </span>
             <span className="text-[7px] font-black text-gray-700 uppercase">{msg.side === 'local' ? 'Host' : 'Peer'}</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
             <div 
               className={`h-full rounded-full transition-all ${isBuffering ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6] duration-75' : 'bg-blue-500 duration-300'}`} 
               style={{ width: `${isBuffering ? progress : audioProgress}%` }} 
             />
          </div>
          <div className="flex justify-between mt-1 text-[7px] font-black text-gray-800 uppercase tracking-widest px-0.5">
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
};

export default function VaultChatComponent({
  messages,
  onSendMessage,
  status,
  isCallActive,
  toggleCall,
  remoteAudioRef,
  handleFileSelect,
  acceptFile,
  rejectFile,
  alias,
  peerAlias,
  sessionId,
  terminateConnection,
  progress
}) {
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const scrollRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, progress]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `VoiceNote_${new Date().toISOString().replace(/[:.]/g,'-')}.webm`, { type: 'audio/webm' });
        handleFileSelect({ target: { files: [file] } });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
      setShowEmoji(false);
    }
  };

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("") || "?";

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col animate-fade-in overflow-hidden font-inter">
      {/* HEADER */}
      <div className="h-16 md:h-20 border-b border-white/5 bg-black/60 backdrop-blur-3xl flex items-center justify-between px-4 md:px-8 z-20 shrink-0">
        <div className="flex items-center gap-3 md:gap-6">
          <div className="flex items-center gap-3">
             <div className="hidden md:flex w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 items-center justify-center text-blue-500">
                <User className="w-5 h-5" />
             </div>
             <div className="flex flex-col">
                <div className="flex items-center gap-2">
                   <h3 className="text-sm md:text-base font-black text-white italic tracking-tight uppercase leading-none">{alias}</h3>
                   <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                      <div className={`w-1.5 h-1.5 rounded-full ${['connected', 'transferring', 'downloading'].includes(status) ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 animate-pulse'}`}></div>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">
                        {['connected', 'transferring', 'downloading'].includes(status) ? 'L4_SYNCED' : 'L4_PENDING'}
                      </span>
                   </div>
                </div>
                <span className="text-[10px] font-black text-blue-500/40 uppercase tracking-[0.4em] mt-1 italic hidden md:block">Identity Provisioned</span>
             </div>
          </div>

          {peerAlias && (
            <div className="flex items-center gap-4 animate-fade-in">
               <div className="w-px h-8 bg-white/10 hidden md:block"></div>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[11px] font-black text-white border border-white/10 italic">
                    {getInitials(peerAlias)}
                  </div>
                  <span className="text-xs font-black text-gray-500 uppercase italic truncate max-w-[100px]">{peerAlias}</span>
               </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 md:gap-8 relative">
           <div className="hidden lg:flex flex-col items-end">
              <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-0.5 italic">Signal Code</span>
              <div className="flex items-center gap-2 bg-white/[0.03] px-4 py-1.5 rounded-xl border border-white/5 shadow-inner">
                 <Hash className="w-3 h-3 text-blue-500" />
                 <span className="text-sm font-black text-white italic tracking-[0.2em] uppercase leading-none">{sessionId}</span>
              </div>
           </div>
           
           <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={toggleCall}
                disabled={status !== 'connected'}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all ${isCallActive ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'bg-white/5 text-gray-700 border border-white/5 hover:text-white disabled:opacity-20'}`}
              >
                {isCallActive ? <PhoneOff className="w-4 h-4 shadow-2xl" /> : <Phone className="w-5 h-5" />}
              </button>
              <button 
                onClick={terminateConnection}
                className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border border-white/5 text-gray-700 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4" />
              </button>
           </div>

           <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden w-10 h-10 bg-white/5 border border-white/5 text-gray-400 hover:text-white rounded-xl flex items-center justify-center transition-all"
           >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
           </button>

           {showMobileMenu && (
             <div className="absolute top-14 right-0 w-64 bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 flex flex-col gap-4 shadow-2xl z-50 md:hidden animate-fade-in origin-top-right">
                <div className="flex flex-col border-b border-white/5 pb-3">
                   <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1 italic">Signal Code</span>
                   <div className="flex items-center justify-between bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                      <Hash className="w-4 h-4 text-blue-500" />
                      <span className="text-base font-black text-white italic tracking-[0.2em] uppercase leading-none">{sessionId}</span>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <button 
                     onClick={() => { toggleCall(); setShowMobileMenu(false); }}
                     disabled={status !== 'connected'}
                     className={`w-full py-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all font-bold text-[9px] uppercase tracking-widest ${isCallActive ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10 disabled:opacity-20 hover:bg-white/10'}`}
                   >
                     {isCallActive ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4 text-blue-500" />}
                     {isCallActive ? 'End Call' : 'Call'}
                   </button>
                   <button 
                     onClick={terminateConnection}
                     className="w-full py-3 bg-white/5 border border-white/10 text-gray-400 hover:bg-red-500 hover:text-white hover:border-red-500 rounded-xl flex flex-col items-center justify-center gap-2 transition-all font-bold text-[9px] uppercase tracking-widest"
                   >
                     <LogOut className="w-4 h-4" /> Disconnect
                   </button>
                </div>
             </div>
           )}
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-4 md:p-8 flex flex-col gap-4 md:gap-6 no-scrollbar relative bg-[#050505]"
      >
        {messages.length === 0 && (
           <div className="flex flex-col items-center justify-center h-full gap-5 opacity-5 select-none grayscale scale-75 md:scale-100">
              <MessageSquare className="w-24 h-24 text-white" />
              <p className="text-xl uppercase tracking-[0.8em] text-white font-black italic">Isolated Link</p>
           </div>
        )}

        {messages.map((msg, i) => {
          const isActiveTransfer = (msg.type === 'file-request' || msg.type === 'audio-note') && 
                i === messages.reduce((acc, m, idx) => (m.type === 'file-request' || m.type === 'audio-note') ? idx : acc, -1);

          return (
          <div key={i} className={`flex flex-col max-w-[85%] md:max-w-[75%] animate-fade-in ${msg.side === 'local' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
            <div className={`flex items-center gap-2 mb-2 ${msg.side === 'local' ? 'flex-row-reverse' : ''}`}>
               <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{msg.sender}</span>
            </div>

            <div className={`px-4 py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-sm font-medium leading-relaxed tracking-tight group/msg transition-all duration-300 relative ${
               msg.side === 'local' ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20' : 'bg-white/[0.04] text-gray-200 border border-white/5 rounded-tl-none backdrop-blur-3xl'
            }`}>
              
              {msg.type === 'file-request' ? (
                 <FileMessageComponent 
                    msg={msg} 
                    isActiveTransfer={isActiveTransfer} 
                    status={status} 
                    progress={progress} 
                    acceptFile={acceptFile} 
                    rejectFile={rejectFile} 
                 />
              ) : msg.type === 'audio-note' ? (
                 <AudioMessage msg={msg} progress={progress} isActive={isActiveTransfer} />
              ) : (
                <span className="block whitespace-pre-wrap">{msg.message}</span>
              )}
            </div>
            <span className="text-[8px] md:text-[9px] font-black text-gray-800 mt-2 uppercase tracking-[0.2em] italic px-2">{msg.time}</span>
          </div>
        )})}
      </div>

      <div className="p-4 md:p-6 border-t border-white/5 bg-black/80 backdrop-blur-3xl shrink-0 z-50">
        <div className="max-w-[900px] mx-auto flex items-center md:items-end gap-2 md:gap-4 relative">
          <div className="flex gap-1.5 md:gap-2 shrink-0">
             <label className="w-10 h-10 md:w-12 md:h-12 bg-white/5 hover:bg-blue-600 border border-white/10 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-90 group shadow-md shrink-0">
                <Paperclip className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-white" />
                <input type="file" className="hidden" onChange={handleFileSelect} />
             </label>
             <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-gray-400 border border-white/5 hover:text-white'}`}
             >
                {isRecording ? <Square className="w-4 h-4 md:w-5 md:h-5" /> : <Mic className="w-4 h-4 md:w-5 md:h-5" />}
             </button>
             <button 
                onClick={() => setShowEmoji(!showEmoji)}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${showEmoji ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 border border-white/5 hover:text-white'}`}
             >
                <Smile className="w-4 h-4 md:w-5 md:h-5" />
             </button>
             {showEmoji && (
               <div className="absolute bottom-full left-0 mb-4 z-[1000] scale-90 origin-bottom-left shadow-2xl">
                  <EmojiPicker theme="dark" onEmojiClick={(e) => setInput(p => p + e.emoji)} width={280} />
               </div>
             )}
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Protocol feed signal..."
            className="flex-grow bg-[#111111] border border-white/10 rounded-xl px-4 py-3 md:px-5 md:py-3.5 text-xs md:text-sm font-medium focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-gray-600 italic no-scrollbar resize-none h-[40px] md:h-[48px] max-h-[100px] overflow-y-auto text-white shadow-inner"
            onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || status !== 'connected'}
            className="w-10 h-10 md:w-12 md:h-12 bg-white text-black hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all disabled:opacity-20 active:scale-90 shadow-md shrink-0"
          >
            {status === 'connected' ? <Send className="w-4 h-4 md:w-5 md:h-5" /> : <Activity className="w-4 h-4 animate-spin-slow" />}
          </button>
        </div>
      </div>
      
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
}
