"use client";

import { useParams } from "next/navigation";
import useVaultHook from "../../../hooks/useVault.hook";
import VaultChat from "../../../components/Chat/VaultChat";
import { Toaster } from "react-hot-toast";

export default function ChatPage() {
  const params = useParams();
  const sessionIdFromUrl = params.id;

  const {
    vpnEnabled,
    setVpnEnabled,
    status,
    sessionId,
    handleFileSelect,
    progress,
    messages,
    sendChatMessage,
    terminateConnection,
    isCallActive,
    toggleCall,
    remoteAudioRef,
    alias,
    peerAlias,
    acceptFile,
    rejectFile,
    connectToSignalling,
    isServerConnected,
    isIncomingCall,
    isOutgoingCall,
    acceptCall,
    rejectCall,
  } = useVaultHook(sessionIdFromUrl);

  return (
    <div className="bg-bg-base min-h-screen text-text-primary selection:bg-accent-primary/30 font-mono">
      <VaultChat
        messages={messages}
        onSendMessage={sendChatMessage}
        status={status}
        isServerConnected={isServerConnected}
        vpnEnabled={vpnEnabled}
        setVpnEnabled={setVpnEnabled}
        isCallActive={isCallActive}
        toggleCall={toggleCall}
        remoteAudioRef={remoteAudioRef}
        handleFileSelect={handleFileSelect}
        alias={alias}
        peerAlias={peerAlias}
        sessionId={sessionId}
        terminateConnection={terminateConnection}
        connectToSignalling={connectToSignalling}
        acceptFile={acceptFile}
        rejectFile={rejectFile}
        progress={progress}
        isIncomingCall={isIncomingCall}
        isOutgoingCall={isOutgoingCall}
        acceptCall={acceptCall}
        rejectCall={rejectCall}
      />

      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#050d06',
            color: '#00ff41',
            border: '1px solid rgba(0, 255, 65, 0.2)',
            borderRadius: '2px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            textTransform: 'uppercase',
          }
        }} 
      />
      <div className="scanline"></div>
    </div>
  );
}
