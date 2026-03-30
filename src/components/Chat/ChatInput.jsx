import { Send, Paperclip, Mic, Square, Smile, Activity, ChevronRight } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

export default function ChatInput({
  input,
  setInput,
  handleSend,
  handleFileSelect,
  isRecording,
  startRecording,
  stopRecording,
  showEmoji,
  setShowEmoji,
  status
}) {
  const isConnected = status === "connected";

  return (
    <div className="p-2 sm:p-4 md:p-6 border-t border-accent-primary/10 bg-bg-base/90 backdrop-blur-3xl shrink-0 z-50">
      
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3 md:gap-4 relative">

        {/* ACTION BUTTONS */}
        <div className="flex gap-2 justify-between sm:justify-start">
          
          <label className="flex-1 sm:flex-none h-11 sm:w-11 bg-accent-primary/5 hover:bg-accent-primary border border-accent-primary/20 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95">
            <Paperclip className="w-5 h-5 text-accent-primary" />
            <input type="file" className="hidden" onChange={handleFileSelect} />
          </label>

          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex-1 sm:flex-none h-11 sm:w-11 rounded-xl flex items-center justify-center transition-all border ${
              isRecording
                ? "bg-red-500 border-red-500 text-white animate-pulse"
                : "bg-accent-secondary/5 text-accent-secondary border-accent-secondary/20"
            }`}
          >
            {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5 opacity-70" />}
          </button>

          <div className="relative flex-1 sm:flex-none">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className={`w-full sm:w-11 h-11 rounded-xl flex items-center justify-center transition-all border ${
                showEmoji
                  ? "bg-accent-primary text-bg-base"
                  : "bg-accent-primary/5 text-accent-primary border-accent-primary/20"
              }`}
            >
              <Smile className="w-5 h-5 opacity-70" />
            </button>

            {showEmoji && (
              <div className="fixed sm:absolute bottom-20 sm:bottom-full left-1/2 sm:left-0 -translate-x-1/2 sm:translate-x-0 sm:mb-4 z-[1000] shadow-2xl border border-accent-primary/20 rounded-2xl overflow-hidden">
                <EmojiPicker
                  theme="dark"
                  onEmojiClick={(e) => setInput((p) => p + e.emoji)}
                  width={280}
                />
              </div>
            )}
          </div>
        </div>

        {/* INPUT + SEND */}
        <div className="flex w-full items-end gap-2">
          
          <div className="flex-grow relative flex items-center">
            <div className="absolute left-3 top-3 text-accent-primary/40 hidden md:block">
              <ChevronRight className="w-4 h-4" />
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())
              }
              placeholder="Type a message..."
              className="w-full bg-bg-base/50 border border-accent-primary/20 rounded-xl px-4 md:pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent-primary resize-none max-h-[120px] overflow-y-auto"
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || !isConnected}
            className="h-11 min-w-[44px] px-3 sm:px-0 sm:w-11 bg-accent-primary text-bg-base rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
          >
            <Send className={`w-5 h-5 ${!isConnected ? 'opacity-30' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}