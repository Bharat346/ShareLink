'use client';

import { Shield, Lock, Zap, Terminal, Globe, Fingerprint, EyeOff, ServerOff, Radio, Key, Network, Cpu, ArrowRight, Activity, GitBranch, Layers, RefreshCw } from "lucide-react";
import Link from "next/link";
import Navigation from "../../components/Layout/Navigation";
import Footer from "../../components/Layout/Footer";

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: Lock,
      title: "AES-256-GCM Encryption",
      description: "All messages and files are encrypted using 256-bit Advanced Encryption Standard in Galois/Counter Mode. AES-256 is a symmetric-key block cipher that operates on 128-bit blocks of data with a 256-bit key, producing ciphertext indistinguishable from random noise. GCM mode adds authenticated encryption, meaning each ciphertext includes a 128-bit authentication tag that detects any tampering — ensuring both confidentiality and data integrity simultaneously at the L4 transport layer."
    },
    {
      icon: ServerOff,
      title: "Zero-Knowledge Storage",
      description: "ShareLink operates without any persistent database. Your messages, file metadata, and session identifiers exist solely in the volatile RAM of your local browser process. When a WebRTC handshake terminates — either by disconnection or manual closure — all associated memory buffers are deallocated and overwritten. There is no write-ahead log, no disk persistence, and no cloud backup. If you close the tab, the session is cryptographically dead."
    },
    {
      icon: EyeOff,
      title: "Signaling Ephemerality",
      description: "Our signaling server functions as a one-time matchmaker, never a data relay. It exchanges only Session Description Protocol (SDP) offers and ICE candidates — structured JSON objects that describe network topology, not content. The instant both peers confirm a direct ICE connection path, the signaling server is algorithmically evicted from the data flow. All subsequent communication is peer-to-peer. The server cannot log, inspect, or forward your traffic."
    },
    {
      icon: Fingerprint,
      title: "End-to-End P2P Architecture",
      description: "Unlike centralized architectures where your data is relayed through corporate infrastructure, ShareLink establishes a direct encrypted bitstream between two browser endpoints using WebRTC's RTCDataChannel API. Each channel is bound to a unique DTLS certificate negotiated at session initiation. Data traverses the shortest possible network path — typically a direct UDP stream — and is never buffered, stored, or observable by any intermediate node."
    }
  ];

  const webrtcSteps = [
    {
      icon: Radio,
      step: "01",
      title: "SDP: Session Description Protocol",
      color: "accent-primary",
      content: `SDP is the foundational handshake language of WebRTC. Before two peers can communicate, they must mutually describe their capabilities in a structured plaintext format. An SDP document contains: the media types supported (audio, video, data), the codec preferences in priority order, the network ports available, the encryption fingerprint (a hash of the DTLS certificate), and the ICE credentials (username fragment + password).

The process begins when Peer A creates an "SDP Offer" — a declaration of what it wants to do and what it supports. This offer is transmitted through the signaling server to Peer B. Peer B examines the offer, selects compatible parameters from its own capabilities, and returns an "SDP Answer" — a confirmation and counter-declaration. This two-step exchange is called the "Offer/Answer" model and is derived from the JSEP (JavaScript Session Establishment Protocol) specification.

Once both SDPs are exchanged and applied via setLocalDescription() and setRemoteDescription(), the peers have a shared understanding of the session parameters. No actual media or data flows yet — SDP purely negotiates the terms of the connection.`
    },
    {
      icon: Network,
      step: "02",
      title: "ICE: Interactive Connectivity Establishment",
      color: "accent-secondary",
      content: `ICE is the algorithm that discovers how two peers on the modern internet — separated by NATs, firewalls, and carrier-grade routing — can actually reach each other. The internet's wide deployment of Network Address Translation (NAT) means most devices do not have a publicly routable IP address. ICE solves this through a three-tier candidate discovery process.

First, the browser gathers "Host Candidates" — the device's own local IP addresses and ports. These work when both peers are on the same LAN. Second, if a STUN (Session Traversal Utilities for NAT) server is reachable, the browser queries it to discover its "Server-Reflexive Candidate" — the public IP:port that the NAT assigns to outbound connections. This works for most home and office networks with simple NAT configurations.

Third, when symmetric NATs or strict firewalls block the above, a TURN (Traversal Using Relays around NAT) server is used. TURN acts as a media relay — the only case where a server touches your data path. Even then, since the data is DTLS-encrypted before reaching TURN, the relay server cannot decrypt or read any content.

ICE then performs "connectivity checks" — sending STUN binding requests across all candidate pairs — to find the optimal direct path. The winning candidate pair becomes the active transport.`
    },
    {
      icon: Key,
      step: "03",
      title: "DTLS: Datagram Transport Layer Security",
      color: "accent-primary",
      content: `DTLS is the UDP-compatible variant of TLS, adapted for the unreliable, out-of-order packet delivery characteristics of datagram protocols. WebRTC mandates DTLS 1.2 or higher for all data channels — there is no non-encrypted mode.

During the DTLS handshake (which runs after ICE connectivity is established), each peer generates a self-signed X.509 certificate. The fingerprint of this certificate — a SHA-256 hash — was previously embedded in the SDP exchange. Both peers cross-verify these fingerprints during the DTLS handshake, creating a cryptographic binding between the identity established in SDP and the key material being negotiated.

The DTLS handshake uses the standard TLS 1.2 cipher suite negotiation to establish a shared Master Secret. From this, both sides derive symmetric encryption keys using a key derivation function (PRF). The resulting session keys are used for all subsequent AES-256-GCM encryption of channel data.

A critical security property: the DTLS handshake cannot be forged by a man-in-the-middle without controlling the signaling server AND compromising the fingerprint exchange. Since our signaling server only transmits SDP — not the private keys — interception at the signaling layer cannot enable decryption of channel traffic.`
    },
    {
      icon: Layers,
      step: "04",
      title: "SRTP: Secure Real-time Transport Protocol",
      color: "accent-secondary",
      content: `While RTCDataChannel uses DTLS directly for data, media streams (audio and video) are transported via SRTP — Secure Real-time Transport Protocol, standardized in RFC 3711. SRTP is a profile of RTP (Real-time Transport Protocol) that adds symmetric encryption and message authentication.

The encryption keys for SRTP are derived from the DTLS handshake using a mechanism called DTLS-SRTP (RFC 5764). The DTLS connection negotiates a shared keying material, which is then fed through a key derivation function to produce separate encryption and authentication keys for each SRTP stream direction (send/receive).

SRTP uses AES in Counter Mode (AES-CTR) for encryption and HMAC-SHA1 for authentication tags on each RTP packet. Each packet includes a Packet Index to prevent replay attacks — an attacker who captures and retransmits a valid encrypted packet will be rejected by the receiver's replay detection window.

ShareLink's data channels do not use SRTP directly (that is reserved for media streams), but understanding SRTP illustrates the layered encryption philosophy of WebRTC: every possible data path is independently secured, with different cryptographic primitives tuned to each transport's latency and reliability requirements.`
    },
    {
      icon: GitBranch,
      step: "05",
      title: "RTCDataChannel: The Encrypted Data Pipe",
      color: "accent-primary",
      content: `RTCDataChannel is the WebRTC API that ShareLink uses to transmit messages and files. Underneath the browser API, data channels are implemented on top of SCTP (Stream Control Transmission Protocol) — a transport layer protocol that provides features of both TCP (reliable, ordered delivery) and UDP (unreliable, low-latency delivery), configurable per channel.

SCTP itself is tunneled inside the DTLS connection, so the encryption stack is: RTCDataChannel → SCTP → DTLS → UDP → IP Network. This means data channel messages are encrypted by DTLS before they hit the network.

Each RTCDataChannel is created with configuration options: "ordered" (whether messages arrive in sequence), "maxRetransmits" (how many times to retry lost packets), and "protocol" (an application-level string identifier). ShareLink creates ordered, reliable data channels for text messages and a separate unordered channel optimized for streaming file chunks with lower latency.

The channel emits events: onopen (DTLS handshake complete and channel ready), onmessage (data received from peer), onclose (peer closed or disconnected), and onerror (SCTP-level error). All message payloads — strings or ArrayBuffers — pass through the DTLS encryption layer transparently, requiring no application-level encryption code.`
    },
    {
      icon: RefreshCw,
      step: "06",
      title: "NAT Traversal & Hole Punching",
      color: "accent-secondary",
      content: `NAT hole punching is the mechanism ICE uses to establish direct peer-to-peer connectivity through Network Address Translation devices. Understanding it reveals why ShareLink can connect two browser clients on different continents without a media relay server in most cases.

When both peers are behind NATs, neither has a stable public address. The hole-punching technique exploits a behavior of stateful NATs: when a device sends a UDP packet from internal address A:portA to external address B:portB, the NAT creates a mapping entry and will forward future packets from B:portB destined to the NAT's external IP to A:portA.

ICE coordinates simultaneous outbound UDP packets from both peers toward each other's Server-Reflexive candidates. If the timing is coordinated (via the signaling server), each outbound packet "punches a hole" in the sender's NAT — creating a mapping that allows the other peer's incoming packets to pass through. When both packets arrive and the NAT mappings are in place, a bidirectional direct channel is established.

This technique, called "simultaneous open," succeeds with most full-cone, restricted-cone, and port-restricted NAT types. Only symmetric NATs — which create different external mappings for each destination — require falling back to TURN relay. Modern ISPs predominantly use port-restricted NATs, making TURN relay necessary in roughly 15-20% of real-world WebRTC connections, according to industry telemetry.`
    }
  ];

  const protocolStack = [
    { layer: "Application", protocol: "RTCDataChannel API", detail: "Message & File Transfer", color: "#00ff88" },
    { layer: "Transport (App)", protocol: "SCTP", detail: "Reliable / Ordered Streams", color: "#00ccff" },
    { layer: "Security", protocol: "DTLS 1.2+", detail: "Key Exchange & Encryption", color: "#ff6b35" },
    { layer: "Transport (Net)", protocol: "UDP / ICE", detail: "Peer Discovery & Routing", color: "#a855f7" },
    { layer: "Network", protocol: "IP", detail: "Internet Protocol", color: "#64748b" },
  ];

  return (
    <div className="bg-bg-base min-h-screen text-text-primary selection:bg-accent-primary/30 font-mono">
      <Navigation />

      {/* ── HERO HEADER ── */}
      <header className="pt-32 pb-20 px-6 md:px-12 max-w-6xl mx-auto border-b border-accent-primary/10">
        <div className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-lg bg-accent-primary/5 border border-accent-primary/20 text-accent-primary text-[10px] font-bold uppercase tracking-[0.4em] w-fit">
            SECURITY_PROTOCOL_v4
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-glow glitch">
            Vault_Security
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl leading-relaxed italic opacity-70">
            "Trust the math, not the middleman." — A complete technical reference of the ShareLink protocol: every primitive, every handshake, every layer explained.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-12 py-20 space-y-32">

        {/* ── SECTION 1: CORE SECURITY PILLARS ── */}
        <section>
          <div className="mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent-primary mb-3">01 — Foundation</p>
            <h2 className="text-4xl font-black uppercase tracking-tighter">Core_Security<span className="text-accent-primary">::</span>Pillars</h2>
            <p className="text-text-muted mt-3 max-w-2xl text-sm leading-relaxed">
              Four non-negotiable principles underpin every interaction in ShareLink. These are not marketing claims — each is a verifiable cryptographic or architectural guarantee.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityFeatures.map((feat, idx) => (
              <div key={idx} className="card p-8 border border-accent-primary/10 hover:border-accent-primary/30 transition-all bg-bg-surface/30 group rounded-3xl">
                <div className="w-14 h-14 bg-accent-primary/5 rounded-2xl flex items-center justify-center border border-accent-primary/10 mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_var(--accent-primary-glow)]">
                  <feat.icon className="w-7 h-7 text-accent-primary" />
                </div>
                <h3 className="text-base font-bold mb-4 tracking-tighter uppercase text-white">{feat.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 2: PROTOCOL STACK DIAGRAM ── */}
        <section>
          <div className="mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent-primary mb-3">02 — Architecture</p>
            <h2 className="text-4xl font-black uppercase tracking-tighter">Protocol<span className="text-accent-primary">::</span>Stack</h2>
            <p className="text-text-muted mt-3 max-w-2xl text-sm leading-relaxed">
              Every data channel message in ShareLink descends through the following layered protocol stack before leaving your device. Each layer adds a specific capability — delivery guarantees, encryption, or routing.
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-accent-primary/60 via-accent-primary/20 to-transparent"></div>
            <div className="space-y-0">
              {protocolStack.map((item, idx) => (
                <div key={idx} className="relative flex items-stretch group">
                  {/* connector dot */}
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 z-10 transition-all group-hover:scale-150"
                    style={{ borderColor: item.color, backgroundColor: `${item.color}22` }}>
                  </div>
                  <div className="pl-16 pr-6 py-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-8 w-full border-b border-white/5 hover:bg-white/[0.02] transition-all">
                    <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 w-28 shrink-0">{item.layer}</div>
                    <div className="font-black text-base tracking-tight" style={{ color: item.color }}>{item.protocol}</div>
                    <div className="text-sm text-text-muted md:ml-auto">{item.detail}</div>
                    <ArrowRight className="w-4 h-4 text-white/10 hidden md:block" />
                    <div className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border hidden md:block"
                      style={{ borderColor: `${item.color}33`, color: item.color, backgroundColor: `${item.color}11` }}>
                      Layer {protocolStack.length - idx}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-2xl bg-accent-primary/5 border border-accent-primary/10 text-[11px] text-text-muted leading-relaxed ml-16">
              <span className="text-accent-primary font-bold">Data flow (outbound):</span> Your message → RTCDataChannel API → SCTP framing → DTLS encryption → UDP datagram → NAT/ICE routing → Peer's network → DTLS decryption → SCTP reassembly → RTCDataChannel onmessage event.
            </div>
          </div>
        </section>

        {/* ── SECTION 3: WEBRTC DEEP DIVE ── */}
        <section>
          <div className="mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent-primary mb-3">03 — Deep Dive</p>
            <h2 className="text-4xl font-black uppercase tracking-tighter">WebRTC<span className="text-accent-primary">::</span>Explained</h2>
            <p className="text-text-muted mt-3 max-w-2xl text-sm leading-relaxed">
              Web Real-Time Communication is not a single protocol — it is a collection of IETF and W3C standards that work in sequence to establish a secure, encrypted, peer-to-peer data channel inside a browser. Each step below is mandatory and non-bypassable.
            </p>
          </div>

          <div className="space-y-6">
            {webrtcSteps.map((step, idx) => (
              <div key={idx} className="group rounded-3xl border border-white/5 hover:border-accent-primary/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all overflow-hidden">
                <div className="p-8 md:p-10">
                  {/* Step Header */}
                  <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
                    <div className="flex items-center gap-5 shrink-0">
                      <span className="text-5xl font-black opacity-10 group-hover:opacity-20 transition-all tabular-nums">{step.step}</span>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center border bg-accent-primary/5 border-accent-primary/20 group-hover:scale-110 transition-transform shadow-[0_0_20px_var(--accent-primary-glow)]">
                        <step.icon className="w-6 h-6 text-accent-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter text-white">{step.title}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Activity className="w-3 h-3 text-accent-primary opacity-60" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-accent-primary opacity-60">Protocol Layer Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Content paragraphs */}
                  <div className="space-y-5 pl-0 md:pl-20">
                    {step.content.split('\n\n').map((para, pIdx) => (
                      <p key={pIdx} className="text-sm text-text-muted leading-[1.9] tracking-wide">
                        {para.split('**').map((chunk, cIdx) =>
                          cIdx % 2 === 1
                            ? <span key={cIdx} className="text-white font-semibold">{chunk}</span>
                            : chunk
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 4: CONNECTION LIFECYCLE ── */}
        <section>
          <div className="mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent-primary mb-3">04 — Lifecycle</p>
            <h2 className="text-4xl font-black uppercase tracking-tighter">Connection<span className="text-accent-primary">::</span>Lifecycle</h2>
            <p className="text-text-muted mt-3 max-w-2xl text-sm leading-relaxed">
              From the moment you generate a ShareLink token to the moment your session closes, the following sequence of cryptographic events occurs in strict order.
            </p>
          </div>

          <div className="relative">
            {[
              {
                phase: "Phase 1", title: "Token Generation & Signaling Room",
                body: "When you open ShareLink, a cryptographically random room identifier is generated using the browser's window.crypto.getRandomValues() API — a CSPRNG (Cryptographically Secure Pseudo-Random Number Generator) seeded by the OS entropy pool. This 128-bit token is never transmitted to our backend in plaintext; it is used only as a WebSocket room identifier to route SDP and ICE messages between the two peers who share the link."
              },
              {
                phase: "Phase 2", title: "SDP Offer Creation",
                body: "Peer A calls RTCPeerConnection.createOffer(), which triggers the browser to compile an SDP document listing its DTLS fingerprint, supported codecs, and ICE credentials. This SDP is set as the local description (setLocalDescription), which simultaneously begins ICE candidate gathering. The SDP offer is transmitted through the WebSocket signaling channel to Peer B."
              },
              {
                phase: "Phase 3", title: "ICE Candidate Exchange",
                body: "As the browser discovers network candidates (host, server-reflexive, relay), each candidate is emitted via the onicecandidate event and transmitted through the signaling server to the remote peer. Both sides accumulate candidates and perform connectivity checks — STUN binding requests — against each candidate pair. The first successful check that yields a response promotes that pair to the 'selected candidate pair,' which becomes the active ICE transport."
              },
              {
                phase: "Phase 4", title: "DTLS Handshake",
                body: "Over the established ICE transport (a direct UDP path or TURN relay), both peers initiate a DTLS 1.2 handshake. One peer acts as DTLS client, the other as server — determined by the 'a=setup' attribute in the SDP. They exchange certificates, verify fingerprints against the SDP-embedded hashes, perform an ECDHE (Elliptic Curve Diffie-Hellman Ephemeral) key exchange, and derive symmetric session keys. Perfect Forward Secrecy is guaranteed because ECDHE generates a fresh keypair for every session."
              },
              {
                phase: "Phase 5", title: "Data Channel Open",
                body: "With DTLS established, the RTCDataChannel handshake occurs over SCTP. The channel transitions to the 'open' state, triggering the onopen event in the application. At this point, ShareLink displays 'Secure Tunnel Active.' All subsequent messages are wrapped by SCTP, encrypted by DTLS-AES-256-GCM, and sent as UDP datagrams directly to the remote peer."
              },
              {
                phase: "Phase 6", title: "Session Termination & Key Destruction",
                body: "When either peer closes the connection — by navigating away, closing the tab, or clicking Disconnect — the RTCPeerConnection.close() method is called. This tears down the DTLS session, sending a DTLS close_notify alert. The browser's internal keystore discards all session keys, master secrets, and DTLS certificates generated for this session. Since keys are never persisted to disk and all state lives in volatile RAM, there is no possibility of key recovery after session close."
              }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6 md:gap-10 pb-12 relative">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full border border-accent-primary/40 bg-accent-primary/10 flex items-center justify-center text-[10px] font-black text-accent-primary shrink-0">
                    {idx + 1}
                  </div>
                  {idx < 5 && <div className="w-px flex-1 mt-3 bg-gradient-to-b from-accent-primary/30 to-transparent"></div>}
                </div>
                <div className="pb-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-accent-primary mb-1">{item.phase}</p>
                  <h4 className="text-base font-black uppercase tracking-tight text-white mb-3">{item.title}</h4>
                  <p className="text-sm text-text-muted leading-[1.9]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 5: THREAT MODEL ── */}
        <section>
          <div className="mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent-primary mb-3">05 — Threat Model</p>
            <h2 className="text-4xl font-black uppercase tracking-tighter">Attack<span className="text-accent-primary">::</span>Vectors_Mitigated</h2>
            <p className="text-text-muted mt-3 max-w-2xl text-sm leading-relaxed">
              A security system is only meaningful when analyzed against concrete threats. Here is ShareLink's explicit threat model and the cryptographic countermeasures in place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                threat: "Man-in-the-Middle (MitM) on Signaling",
                risk: "Critical",
                mitigation: "Even if an attacker intercepts SDP messages on the signaling server, they cannot forge the DTLS fingerprint without controlling the private key of the target peer. Fingerprint verification during the DTLS handshake cryptographically binds the identity to the key material. A MitM would require compromising both signaling AND one peer's private key simultaneously."
              },
              {
                threat: "Passive Network Eavesdropping",
                risk: "Nullified",
                mitigation: "All UDP datagrams on the wire are encrypted with AES-256-GCM derived from an ECDHE master secret. Even with complete capture of all network traffic, an observer gains only ciphertext. AES-256 with GCM provides IND-CCA2 security — the strongest semantic security model, provably resistant to chosen-ciphertext attacks."
              },
              {
                threat: "Server-Side Data Breach",
                risk: "Irrelevant",
                mitigation: "ShareLink stores zero message content, zero file data, and zero session keys on any server. Our infrastructure holds only ephemeral WebSocket connection state for the duration of the SDP exchange — typically under 10 seconds. A complete breach of our backend exposes no user data because no user data has ever been written to disk."
              },
              {
                threat: "Replay Attacks",
                risk: "Blocked",
                mitigation: "DTLS incorporates sequence numbers and epoch counters in every record. A replay detector maintains a sliding window of accepted sequence numbers. Any retransmitted datagram with a previously-seen sequence number is silently discarded. Combined with session-unique keys, captured and replayed packets from any prior session are immediately rejected."
              },
              {
                threat: "Key Compromise / Session Recovery",
                risk: "Impossible",
                mitigation: "ECDHE (using Curve25519 or P-256) generates ephemeral key pairs that are discarded after the handshake. The derived session keys exist only in volatile RAM. Even if a long-term private key were somehow obtained, past session keys cannot be reconstructed — this property is called Perfect Forward Secrecy (PFS) and is mandatory in ShareLink's DTLS configuration."
              },
              {
                threat: "Identity Spoofing / Impersonation",
                risk: "Mitigated",
                mitigation: "ShareLink uses room tokens as peer identity channels. Only a peer who possesses the shared room URL can connect to that specific P2P session. Since room tokens are 128-bit CSPRNGs, brute-force enumeration is computationally infeasible (2¹²⁸ possible values). For high-security use cases, ShareLink displays the remote peer's DTLS certificate fingerprint for out-of-band verification."
              }
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-accent-primary/20 transition-all">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h4 className="text-sm font-black uppercase tracking-tight text-white leading-snug">{item.threat}</h4>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border shrink-0 ${
                    item.risk === "Critical" ? "border-red-500/30 text-red-400 bg-red-500/10" :
                    item.risk === "Nullified" ? "border-green-500/30 text-green-400 bg-green-500/10" :
                    item.risk === "Impossible" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                    "border-accent-primary/30 text-accent-primary bg-accent-primary/10"
                  }`}>{item.risk}</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">{item.mitigation}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 6: GLOSSARY ── */}
        <section>
          <div className="mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent-primary mb-3">06 — Reference</p>
            <h2 className="text-4xl font-black uppercase tracking-tighter">Glossary<span className="text-accent-primary">::</span>Terms</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/5">
            {[
              { term: "AES-256-GCM", def: "Advanced Encryption Standard with 256-bit key in Galois/Counter Mode. Provides authenticated encryption — confidentiality + integrity in a single operation." },
              { term: "CSPRNG", def: "Cryptographically Secure Pseudo-Random Number Generator. Produces unpredictable output derived from OS entropy, used for key and token generation." },
              { term: "DTLS", def: "Datagram Transport Layer Security. TLS adapted for unreliable UDP transport. Provides handshake, key exchange, and record-layer encryption for WebRTC channels." },
              { term: "ECDHE", def: "Elliptic Curve Diffie-Hellman Ephemeral. A key-agreement protocol that generates fresh session keys per handshake, enabling Perfect Forward Secrecy." },
              { term: "ICE", def: "Interactive Connectivity Establishment. Algorithm for discovering the optimal direct network path between two peers, handling NAT traversal via STUN and TURN." },
              { term: "NAT", def: "Network Address Translation. A technique that maps multiple private IP addresses to a single public IP, complicating direct peer-to-peer connectivity." },
              { term: "Perfect Forward Secrecy", def: "A property where compromise of long-term keys does not expose past session keys. Achieved by using ephemeral (one-time) key pairs discarded after each handshake." },
              { term: "SCTP", def: "Stream Control Transmission Protocol. A transport protocol combining TCP-like reliability with multi-streaming. Used as the carrier for RTCDataChannel messages." },
              { term: "SDP", def: "Session Description Protocol. A text format describing multimedia session parameters: codecs, network addresses, DTLS fingerprints, and ICE credentials." },
              { term: "SRTP", def: "Secure Real-time Transport Protocol. Encrypts RTP media streams using AES-CTR with HMAC-SHA1 authentication. Keys are derived from the DTLS handshake." },
              { term: "STUN", def: "Session Traversal Utilities for NAT. A lightweight protocol that reveals a device's public IP and port as seen by an external server, assisting ICE." },
              { term: "TURN", def: "Traversal Using Relays around NAT. A relay protocol for cases where direct ICE paths fail. TURN relays encrypted DTLS traffic, cannot decrypt content." },
              { term: "WebRTC", def: "Web Real-Time Communication. A W3C/IETF standard enabling browser-to-browser audio, video, and data channels with mandatory end-to-end encryption." },
              { term: "Zero Trust", def: "Security architecture assuming no implicit trust for any node — including internal servers. All data is authenticated and encrypted regardless of network position." },
            ].map((item, idx) => (
              <div key={idx} className="p-5 bg-bg-base hover:bg-white/[0.02] transition-all">
                <span className="text-[10px] font-black uppercase tracking-widest text-accent-primary block mb-1">{item.term}</span>
                <p className="text-xs text-text-muted leading-relaxed">{item.def}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <div className="p-10 md:p-16 border border-accent-primary/20 rounded-[40px] bg-gradient-to-br from-accent-primary/[0.05] to-transparent relative overflow-hidden">
          <div className="absolute top-0 right-0 w-60 h-60 bg-accent-primary/5 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-0 left-20 w-40 h-40 bg-accent-secondary/5 blur-[80px] rounded-full"></div>
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <Shield className="w-16 h-16 text-accent-primary mx-auto mb-8 animate-pulse" />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-primary/5 rounded-lg border border-accent-primary/20 mb-6">
              <span className="text-[9px] font-bold text-accent-primary uppercase tracking-widest">Zero Knowledge · Zero Trust · Zero Compromise</span>
            </div>
            <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-tighter italic">Total Node Privacy</h3>
            <p className="text-text-muted text-sm md:text-base leading-relaxed mb-4">
              ShareLink is built on the principle of Zero Trust Architecture. We do not know who you are, we do not know what you share, and we cannot track your session history.
            </p>
            <p className="text-text-muted text-sm md:text-base leading-relaxed mb-10">
              The application logic is 100% client-side. DTLS keys are generated in the browser sandbox and never transmitted to any server. The cryptographic guarantees described in this document are enforced by the W3C WebRTC specification — not by our promises.
            </p>
            <Link href="/" className="inline-flex items-center gap-3 px-10 py-5 bg-accent-primary text-bg-base font-bold rounded-2xl hover:scale-105 transition-all shadow-[0_0_40px_var(--accent-primary-glow)] uppercase tracking-[.2em] text-[11px]">
              <Terminal className="w-5 h-5" /> RE-ENTER_BRIDGE
            </Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}