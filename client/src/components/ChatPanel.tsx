import React from "react";
import { usePelagus } from "@/hooks/use-pelagus";

type ChatMessage = {
  address?: string;
  text: string;
  ts: number;
};

function shortAddr(addr?: string) {
  if (!addr) return "anon";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function ChatPanel({ gameId, isActive }: { gameId: number; isActive: boolean }) {
  const { address } = usePelagus();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const wsRef = React.useRef<WebSocket | null>(null);

  React.useEffect(() => {
    if (!isActive) {
      // Clear messages and close any socket when inactive
      setMessages([]);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: "end-game", gameId }));
        } catch {}
      }
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${window.location.host}/ws/chat?gameId=${gameId}&address=${address || ""}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data?.type === "chat") {
          setMessages((prev) => [...prev, { address: data.address, text: data.text, ts: data.ts }]);
        }
      } catch {}
    };
    ws.onclose = () => {
      wsRef.current = null;
    };
    return () => {
      ws.close();
    };
  }, [gameId, address, isActive]);

  const send = () => {
    if (!input.trim() || !isActive) return;
    const payload = JSON.stringify({ text: input.trim() });
    wsRef.current?.send(payload);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800 text-xs font-mono uppercase tracking-widest text-slate-400">
        Live Chat · Game #{gameId}
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {messages.map((m, idx) => (
          <div key={idx} className="text-xs font-mono">
            <span className="text-slate-500 mr-2">{new Date(m.ts).toLocaleTimeString()}</span>
            <span className="text-yellow-400 mr-2">{shortAddr(m.address)}</span>
            <span className="text-slate-200">{m.text}</span>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-xs text-slate-500 italic">No messages yet. Say hello!</div>
        )}
      </div>
      <div className="p-3 border-t border-slate-800 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-slate-800 text-slate-200 border border-slate-700 rounded px-3 py-2 text-sm outline-none focus:border-yellow-500"
        />
        <button
          onClick={send}
          className="px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold rounded transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
