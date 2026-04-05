import { Send, Paperclip, Mic, Square, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";

export default function ChatInput({
  input,
  setInput,
  handleSend,
  handleFileSelect,
  startRecording,
  stopRecording,
  showEmoji,
  setShowEmoji,
  status
}) {
  const isConnected = status === "connected";
  const containerRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowEmoji]);

  const onSendWrapper = () => {
    if (input.trim()) {
      handleSend();
      setShowEmoji(false);
    }
  };

  const handleMicToggle = () => {
    if (isRecording) {
      stopRecording();
      setIsRecording(false);
    } else {
      startRecording();
      setIsRecording(true);
    }
  };

  return (
    <div ref={containerRef} className="p-3 sm:p-5 mb-safe bg-bg-base/98 backdrop-blur-3xl shrink-0 z-50 border-t border-accent-primary/10 font-mono relative overflow-visible">
      
      <div className="max-w-4xl mx-auto flex items-end gap-3 sm:gap-4 relative">
        
        {/* EMOJI PICKER POPUP - Responsive Positioning */}
        {showEmoji && (
          <div className="absolute bottom-[calc(100%+8px)] left-0 w-full sm:w-[350px] z-[1000] animate-in slide-in-from-bottom-2 duration-300">
            <div className="bg-bg-base border border-accent-primary/30 rounded-sm overflow-hidden shadow-[0_0_50px_rgba(0,255,65,0.15)]">
              <EmojiPicker
                theme="dark"
                onEmojiClick={(e) => setInput((p) => p + e.emoji)}
                width="100%"
                height={350}
                lazyLoadEmojis={true}
                searchPlaceholder="PROTO_SEARCH..."
              />
            </div>
          </div>
        )}

        {/* WHATSAPP STYLE INPUT WRAPPER */}
        <div className="flex-grow flex items-end bg-bg-input border border-accent-primary/20 rounded-sm px-2 py-0.5 transition-all group focus-within:border-accent-primary/50 relative">
          
          {/* EMBEDDED UTILITY TOOLS (LEFT) - Better Spacing */}
          <div className="flex items-center gap-1 mb-1 mr-2 border-r border-accent-primary/10 pr-2">
             <button
                onClick={() => setShowEmoji(!showEmoji)}
                className={`w-9 h-9 rounded-sm flex items-center justify-center transition-colors ${showEmoji ? "text-accent-primary bg-accent-primary/10" : "text-accent-primary/40 hover:text-accent-primary"}`}
             >
                <Smile className="w-5.5 h-5.5" />
             </button>
             
             <label className="w-9 h-9 rounded-sm flex items-center justify-center text-accent-primary/40 hover:text-accent-primary transition-colors cursor-pointer bg-transparent">
                <Paperclip className="w-5 h-5" />
                <input type="file" className="hidden" onChange={handleFileSelect} />
             </label>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.shiftKey && (e.preventDefault(), onSendWrapper())
            }
            placeholder="ENTRY_PAYLOAD..."
            className="flex-grow bg-transparent border-none px-1 py-3 text-sm focus:outline-none resize-none min-h-[44px] max-h-[150px] scrollbar-none placeholder:text-accent-primary/10 text-accent-primary leading-relaxed font-mono"
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
            }}
          />
        </div>

        {/* DYNAMIC ACTION BUTTON (RIGHT) - Adopted text-green change */}
        <div className="shrink-0 flex items-center mb-1">
           {!input.trim() ? (
              <button
                onClick={handleMicToggle}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-sm flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-red text-white animate-pulse ring-4 ring-red/20 shadow-[0_0_25px_rgba(255,0,0,0.4)]"
                    : "bg-accent-primary text-white shadow-[0_0_15px_var(--accent-primary-glow)] hover:scale-105 active:scale-90"
                }`}
              >
                {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5.5 h-5.5" />}
              </button>
           ) : (
              <button
                onClick={onSendWrapper}
                disabled={!isConnected && status !== "ready"} // Relaxed disable during setup
                className="w-11 h-11 sm:w-12 sm:h-12 bg-accent-primary text-green rounded-sm flex items-center justify-center transition-all disabled:opacity-30 shadow-[0_0_20px_var(--accent-primary-glow)] hover:scale-105 active:scale-95"
              >
                <Send className="w-5.5 h-5.5 ml-0.5" />
              </button>
           )}
        </div>
      </div>
    </div>
  );
}
