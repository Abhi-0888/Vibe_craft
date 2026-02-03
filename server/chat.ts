import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { parse } from "url";

type ClientInfo = {
  ws: WebSocket;
  gameId: string;
  address?: string;
};

const channels: Map<string, Set<WebSocket>> = new Map();

function broadcast(gameId: string, data: any) {
  const clients = channels.get(gameId);
  if (!clients) return;
  const payload = JSON.stringify(data);
  clients.forEach((ws) => {
    try {
      ws.send(payload);
    } catch {}
  });
}

export function setupChatServer(httpServer: Server) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request, socket, head) => {
    const { pathname, query } = parse(request.url || "", true);
    if (pathname !== "/ws/chat") {
      return;
    }
    wss.handleUpgrade(request, socket as any, head, (ws) => {
      const gameId = (query?.gameId as string) || "default";
      const address = (query?.address as string) || undefined;

      const set = channels.get(gameId) || new Set<WebSocket>();
      set.add(ws);
      channels.set(gameId, set);

      ws.on("message", (message) => {
        let text = "";
        let type = "chat";
        try {
          const parsed = JSON.parse(message.toString());
          text = parsed?.text ?? message.toString();
          type = parsed?.type ?? "chat";
        } catch {
          text = message.toString();
        }
        if (type === "end-game") {
          const chan = channels.get(gameId);
          if (chan) {
            chan.forEach((client) => {
              try { client.close(); } catch {}
            });
            channels.delete(gameId);
          }
          return;
        }
        broadcast(gameId, {
          type: "chat",
          gameId,
          address,
          text,
          ts: Date.now(),
        });
      });

      ws.on("close", () => {
        const chan = channels.get(gameId);
        if (!chan) return;
        chan.delete(ws);
        if (chan.size === 0) {
          channels.delete(gameId);
        }
      });

      ws.send(JSON.stringify({ type: "hello", gameId }));
    });
  });
}
