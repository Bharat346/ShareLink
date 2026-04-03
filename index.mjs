import "dotenv/config";
import { createServer as createHttpServer } from "http";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import { redis } from "./lib/redis.mjs";

const port = parseInt(process.env.PORT || "4000", 10);
const server = createHttpServer();

const wss = new WebSocketServer({ noServer: true });
const localWsMap = new Map();
const disconnectTimers = new Map();

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

  // Send initial identity (VPN IP removed as requested)
  ws.send(JSON.stringify({ type: "ASSIGNED_IP", clientId, alias }));

  ws.on("message", async (message) => {
    try {
      let data = JSON.parse(message.toString());
      const currentId = ws.clientId;

      if (data.type === "RECONNECT") {
        const oldId = data.oldClientId;
        const clientData = await redis.hgetall(`client:${oldId}`);
        if (clientData) {
          if (disconnectTimers.has(oldId)) {
            clearTimeout(disconnectTimers.get(oldId));
            disconnectTimers.delete(oldId);
          }
          localWsMap.delete(ws.clientId);
          ws.clientId = oldId;
          localWsMap.set(oldId, ws);
          ws.send(
            JSON.stringify({
              type: "RECONNECTED",
              clientId: oldId,
              sessionId: clientData.sessionId,
              alias: clientData.alias || alias,
            }),
          );
          return;
        }
      }

      switch (data.type) {
        case "CREATE_SESSION": {
          let sessionId = uuidv4().slice(0, 6).toUpperCase();
          const clientInfo = { clientId: currentId, alias };
          await redis.hset(`session:${sessionId}`, {
            client1: JSON.stringify(clientInfo),
            client2: "",
          });
          await redis.hset(`client:${currentId}`, { sessionId, alias });
          ws.send(JSON.stringify({ type: "SESSION_CREATED", sessionId }));
          break;
        }

        case "JOIN_SESSION": {
          const sessionId = data.sessionId;
          const session = await redis.hgetall(`session:${sessionId}`);

          if (!session || !session.client1) {
            ws.send(JSON.stringify({ type: "SESSION_ERROR", message: "Invalid Session" }));
            return;
          }

          const client1 = typeof session.client1 === 'string' ? JSON.parse(session.client1) : session.client1;
          let client2 = session.client2 ? (typeof session.client2 === 'string' ? JSON.parse(session.client2) : session.client2) : null;

          if (client1.clientId !== currentId) {
            if (client2 && client2.clientId !== currentId) {
              ws.send(JSON.stringify({ type: "SESSION_ERROR", message: "Session Full" }));
              return;
            }
            if (!client2) {
              client2 = { clientId: currentId, alias };
              await redis.hset(`session:${sessionId}`, {
                client2: JSON.stringify(client2),
              });
            }
          }

          await redis.hset(`client:${currentId}`, { sessionId, alias });
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
                isInitiator: true,
              }));
              rws.send(JSON.stringify({
                type: "PEER_READY",
                peerId: client1.clientId,
                peerAlias: client1.alias,
                polite: true,
                isInitiator: false,
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
                senderAlias: alias,
              }));
            }
          } else if (data.sessionId) {
            const session = await redis.hgetall(`session:${data.sessionId}`);
            if (session) {
              const c1 = safeParse(session.client1);
              const c2 = safeParse(session.client2);
              [c1, c2].forEach(c => {
                if (c && c.clientId && c.clientId !== currentId) {
                  const wsClient = localWsMap.get(c.clientId);
                  if (wsClient?.readyState === 1) {
                    wsClient.send(JSON.stringify({
                      type: "SIGNAL",
                      ...signal,
                      senderId: currentId,
                      senderAlias: alias,
                    }));
                  }
                }
              });
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
    const cid = ws.clientId;
    localWsMap.delete(cid);
    const timer = setTimeout(async () => {
      const cData = await redis.hgetall(`client:${cid}`);
      if (cData?.sessionId) {
        const session = await redis.hgetall(`session:${cData.sessionId}`);
        if (session) {
          const client1 = safeParse(session.client1);
          const client2 = safeParse(session.client2);
          let peerId = client1?.clientId === cid ? client2?.clientId : client1?.clientId;
          if (peerId) {
            const peerWs = localWsMap.get(peerId);
            if (peerWs?.readyState === 1) peerWs.send(JSON.stringify({ type: "PEER_DISCONNECTED" }));
          }
          await redis.del(`session:${cData.sessionId}`);
        }
      }
      await redis.del(`client:${cid}`);
    }, 10 * 60 * 1000);
    disconnectTimers.set(cid, timer);
  });
});

server.listen(port, "0.0.0.0", () =>
  console.log(`Signal Bridge Online on ws://192.168.0.101:${port}/signaling`)
);
