import "dotenv/config";
import { createServer as createHttpServer } from "http";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import { redis } from "./lib/redis.mjs";

const port = parseInt(process.env.PORT || "4000", 10);
const server = createHttpServer();

const wss = new WebSocketServer({ noServer: true });
const localWsMap = new Map();

const NAMES = [
  "Alpha Fox",
  "Beta Wolf",
  "Gamma Hound",
  "Delta Eagle",
  "Epsilon Hawk",
  "Zeta Lion",
  "Eta Tiger",
  "Theta Bear",
  "Iota Shark",
  "Kappa Whale",
  "Lambda Lynx",
  "Mu Panther",
  "Nu Cobra",
  "Xi Viper",
  "Omicron Raptor",
  "Pi Falcon",
  "Rho Owl",
  "Sigma Raven",
  "Tau Bat",
  "Upsilon Moth",
  "Phi Beetle",
  "Chi Spider",
  "Psi Scorpion",
  "Omega Dragon",
  "Neon Ghost",
  "Cyber Knight",
  "Iron Rebel",
  "Quantum Hunter",
  "Shadow Walker",
  "Plasma Pilot",
  "Lunar Rover",
  "Solar Flare",
  "Glitch Runner",
  "Hyper Driver",
  "Static Void",
  "Null Pointer",
  "Bit Crusher",
  "Data Stream",
  "Link Carver",
  "Core Shard",
  "Volt Surge",
  "Aero Glide",
  "Terra Form",
  "Hydro Flow",
  "Pyro Blast",
  "Cryo Chill",
  "Magma Core",
  "Sonic Boom",
  "Edge Case",
  "Zero Day",
];

function safeParse(data) {
  if (!data) return null;
  if (typeof data === "object") return data;
  try {
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

function getAnonymousName() {
  return NAMES[Math.floor(Math.random() * NAMES.length)];
}

server.on("upgrade", (req, socket, head) => {
  if (req.url?.split("?")[0] === "/signaling") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

wss.on("connection", (ws, req) => {
  const urlParams = new URL(req.url, "http://localhost").searchParams;
  let clientId = urlParams.get("clientId") || uuidv4();
  
  ws.clientId = clientId;
  ws.alias = "SEARCHING..."; // Placeholder while we fetch from Redis
  localWsMap.set(clientId, ws);

  // 🛡️ IDENTITY RESOLUTION (Async)
  const identityPromise = (async () => {
    try {
      let alias = urlParams.get("alias");
      if (!alias || alias === "SEARCHING...") {
        alias = await redis.hget(`client:${clientId}`, "alias");
      }
      if (!alias || alias === "SEARCHING...") {
        alias = getAnonymousName();
      }

      ws.alias = alias;
      await redis.hset(`client:${clientId}`, { clientId, alias });
      
      ws.send(JSON.stringify({ type: "ASSIGNED_IP", clientId, alias }));
      return alias;
    } catch (err) {
      console.error("Identity Error:", err);
      ws.alias = getAnonymousName(); // Fallback
      return ws.alias;
    }
  })();

  ws.on("message", async (message) => {
    try {
      // 🚨 WAIT for identity to be fully resolved before processing any data
      // This prevents "SEARCHING..." from leaking into sessions
      const alias = await identityPromise;
      
      let data = JSON.parse(message.toString());
      const currentId = ws.clientId;

      switch (data.type) {
        case "PING":
          ws.send(JSON.stringify({ type: "PONG" }));
          break;

        case "CREATE_SESSION": {
          let sessionId = uuidv4().slice(0, 6).toUpperCase();
          const creatorData = { clientId: currentId, alias };
          await redis.hset(`session:${sessionId}`, {
            client1: JSON.stringify(creatorData),
            client2: "",
          });
          await redis.expire(`session:${sessionId}`, 600); // 10 min TTL
          await redis.hset(`client:${currentId}`, { sessionId, alias });
          await redis.expire(`client:${currentId}`, 600);
          ws.send(JSON.stringify({ type: "SESSION_CREATED", sessionId }));
          break;
        }

        case "JOIN_SESSION": {
          const sessionId = data.sessionId;
          const session = await redis.hgetall(`session:${sessionId}`);

          if (!session) {
            ws.send(JSON.stringify({ type: "SESSION_ERROR", message: "Invalid Session" }));
            return;
          }

          let client1 = safeParse(session.client1);
          let client2 = safeParse(session.client2);

          // Update/Slot logic
          if (!client1 || client1.clientId === currentId) {
            client1 = { clientId: currentId, alias };
            await redis.hset(`session:${sessionId}`, { client1: JSON.stringify(client1) });
          } else if (!client2 || client2.clientId === currentId) {
            client2 = { clientId: currentId, alias };
            await redis.hset(`session:${sessionId}`, { client2: JSON.stringify(client2) });
          } else if (!localWsMap.has(client1.clientId)) {
            client1 = { clientId: currentId, alias };
            await redis.hset(`session:${sessionId}`, { client1: JSON.stringify(client1) });
          } else if (!localWsMap.has(client2.clientId)) {
            client2 = { clientId: currentId, alias };
            await redis.hset(`session:${sessionId}`, { client2: JSON.stringify(client2) });
          } else {
            ws.send(JSON.stringify({ type: "SESSION_ERROR", message: "Session Full" }));
            return;
          }

          await redis.expire(`session:${sessionId}`, 600); // Refresh TTL on join
          await redis.hset(`client:${currentId}`, { sessionId, alias });
          await redis.expire(`client:${currentId}`, 600);
          ws.send(JSON.stringify({ type: "SESSION_JOINED", sessionId }));

          if (client1 && client2 && client1.clientId !== client2.clientId) {
            const sws = localWsMap.get(client1.clientId);
            const rws = localWsMap.get(client2.clientId);

            if (sws?.readyState === 1 && rws?.readyState === 1) {
              sws.send(JSON.stringify({
                type: "PEER_READY",
                peerId: client2.clientId,
                peerAlias: client2.alias,
                polite: false,
              }));
              rws.send(JSON.stringify({
                type: "PEER_READY",
                peerId: client1.clientId,
                peerAlias: client1.alias,
                polite: true,
              }));
            }
          }
          break;
        }

        case "SIGNAL": {
          const { targetId, ...signal } = data;
          if (targetId) {
            const targetWs = localWsMap.get(targetId);
            if (targetWs?.readyState === 1) {
              targetWs.send(JSON.stringify({
                type: "SIGNAL",
                ...signal,
                senderId: currentId,
              }));
            }
          }
          break;
        }
      }
    } catch (err) {
      console.error(err);
    }
  });

  ws.on("close", async () => {
    localWsMap.delete(ws.clientId);
    
    try {
      const sessionId = await redis.hget(`client:${ws.clientId}`, "sessionId");
      if (sessionId) {
        const session = await redis.hgetall(`session:${sessionId}`);
        if (session) {
          const client1 = safeParse(session.client1);
          const client2 = safeParse(session.client2);
          const otherId = (client1?.clientId === ws.clientId) ? client2?.clientId : client1?.clientId;
          
          if (otherId) {
            const otherWs = localWsMap.get(otherId);
            if (otherWs?.readyState === 1) {
              otherWs.send(JSON.stringify({ type: "PEER_DISCONNECTED", peerId: ws.clientId }));
            }
          }
        }
      }
    } catch (err) {
      console.error("Cleanup Error:", err);
    }
  });
});

server.listen(port, "0.0.0.0", () =>
  console.log(`Signal Bridge Online on port ${port}`),
);
