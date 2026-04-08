"use client";

import { useRef, useEffect, useState } from "react";
import { Send, Paperclip, Mic, MicOff, SmilePlus, X } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

export default function ChatInput({
  input, setInput, handleSend, handleFileSelect,
  startRecording, stopRecording, showEmoji, setShowEmoji, status,
}) {
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const onStartRecording = () => {
    startRecording();
    setIsRecording(true);
    setRecordingTime(0);
    intervalRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
  };

  const onStopRecording = () => {
    stopRecording();
    setIsRecording(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setRecordingTime(0);
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const isDisabled = status === "disconnected" || status === "ready" || status === "failed" || !status;

  return (
    <div className="shrink-0 border-t border-[#1a4d29] bg-[#0a1f11]">
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        {/* Recording state */}
        {isRecording && (
          <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-md bg-red-500/5 border border-red-500/10">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-red-500/70 uppercase tracking-widest tabular-nums">{formatTime(recordingTime)}</span>
            </div>
            <button onClick={onStopRecording} className="text-[9px] font-bold text-red-500/60 uppercase tracking-wider hover:text-red-500 transition-colors">Stop</button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Attach */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={isDisabled}
            className="w-10 h-10 shrink-0 rounded-md border border-[#1a4d29] text-[#41b868] flex items-center justify-center hover:text-accent-primary hover:border-[#2d8248] disabled:opacity-50 transition-all"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input ref={fileRef} type="file" onChange={handleFileSelect} className="hidden" />

          {/* Emoji */}
          <div className="relative">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              disabled={isDisabled}
              className="w-10 h-10 shrink-0 rounded-md border border-[#1a4d29] text-[#41b868] flex items-center justify-center hover:text-accent-primary hover:border-[#2d8248] disabled:opacity-50 transition-all"
            >
              {showEmoji ? <X className="w-5 h-5" /> : <SmilePlus className="w-5 h-5" />}
            </button>
            {showEmoji && (
              <div className="absolute bottom-full left-0 mb-3 z-[200] shadow-2xl">
                <EmojiPicker
                  onEmojiClick={(e) => { setInput(i => i + e.emoji); setShowEmoji(false); }}
                  theme="dark"
                />
              </div>
            )}
          </div>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={isDisabled ? "Waiting for connection..." : "Type a message..."}
              disabled={isDisabled}
              rows={1}
              className="w-full bg-[#05170b] border border-[#1a4d29] focus:border-accent-primary rounded-md px-4 py-2.5 text-[#e0ffe0] text-[13px] placeholder:text-[#2d8248] focus:outline-none resize-none custom-scrollbar leading-relaxed disabled:opacity-50 transition-all"
              style={{ maxHeight: "120px" }}
            />
          </div>

          {/* Voice Rec / Send Button Toggle */}
          {!input.trim() ? (
            <button
              onClick={isRecording ? onStopRecording : onStartRecording}
              disabled={isDisabled}
              className={`w-10 h-10 shrink-0 rounded-md border flex items-center justify-center transition-all ${
                isRecording
                  ? "bg-red-500/20 border-red-500/50 text-red-500"
                  : "border-[#1a4d29] text-[#41b868] hover:text-accent-primary disabled:opacity-50"
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={isDisabled}
              className="w-10 h-10 shrink-0 rounded-md bg-accent-primary hover:bg-[#00cc33] flex items-center justify-center disabled:opacity-50 transition-all text-[#020c06]"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
