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
  "Alpha Fox", "Beta Wolf", "Gamma Hound", "Delta Eagle", "Epsilon Hawk",
  "Zeta Lion", "Eta Tiger", "Theta Bear", "Iota Shark", "Kappa Whale",
  "Lambda Lynx", "Mu Panther", "Nu Cobra", "Xi Viper", "Omicron Raptor",
  "Pi Falcon", "Rho Owl", "Sigma Raven", "Tau Bat", "Upsilon Moth",
  "Phi Beetle", "Chi Spider", "Psi Scorpion", "Omega Dragon", "Neon Ghost",
  "Cyber Knight", "Iron Rebel", "Quantum Hunter", "Shadow Walker", "Plasma Pilot",
  "Lunar Rover", "Solar Flare", "Glitch Runner", "Hyper Driver", "Static Void",
  "Null Pointer", "Bit Crusher", "Data Stream", "Link Carver", "Core Shard",
  "Volt Surge", "Aero Glide", "Terra Form", "Hydro Flow", "Pyro Blast",
  "Cryo Chill", "Magma Core", "Sonic Boom", "Edge Case", "Zero Day",
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

wss.on("connection", async (ws) => {
  let clientId = uuidv4();
  let alias = getAnonymousName();

  ws.clientId = clientId;
  localWsMap.set(clientId, ws);

  ws.send(JSON.stringify({ type: "ASSIGNED_IP", clientId, alias }));

  ws.on("message", async (message) => {
    try {
      let data = JSON.parse(message.toString());
      const currentId = ws.clientId;

      switch (data.type) {
        case "CREATE_SESSION": {
          let sessionId = uuidv4().slice(0, 6).toUpperCase();
          // Do not immediately assign client1 to avoid ghost connection taking the slot
          await redis.hset(`session:${sessionId}`, {
            client1: "",
            client2: "",
          });
          await redis.hset(`client:${currentId}`, { sessionId, alias });
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

          // CASE 1: Rejoining as Client 1 (Host refreshed)
          // If the caller IS client1 (ID match) or client1 is OFFLINE, they take slot 1
          if (!client1 || client1.clientId === currentId || !localWsMap.has(client1.clientId)) {
             client1 = { clientId: currentId, alias };
             await redis.hset(`session:${sessionId}`, { client1: JSON.stringify(client1) });
          } 
          // CASE 2: Joining as Client 2
          else if (!client2 || client2.clientId === currentId || !localWsMap.has(client2.clientId)) {
             client2 = { clientId: currentId, alias };
             await redis.hset(`session:${sessionId}`, { client2: JSON.stringify(client2) });
          }
          // CASE 3: Session is actually full with 2 active connections
          else {
             ws.send(JSON.stringify({ type: "SESSION_ERROR", message: "Session Full" }));
             return;
          }

          await redis.hset(`client:${currentId}`, { sessionId, alias });
          ws.send(JSON.stringify({ type: "SESSION_JOINED", sessionId }));

          // Notify both if ready
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
  });
});

server.listen(port, "0.0.0.0", () =>
  console.log(`Signal Bridge Online on port ${port}`)
);
