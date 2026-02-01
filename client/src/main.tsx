import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const originalFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem("auth_token");
  const url = typeof input === "string" ? input : input.toString();
  const headers = new Headers(init?.headers || {});
  if (token && url.startsWith("/api") && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const nextInit: RequestInit = { ...init, headers };
  const res = await originalFetch(input, nextInit);
  if (res.status !== 401 || !url.startsWith("/api")) return res;
  const refresh = await originalFetch("/api/auth/refresh", { method: "POST", credentials: "include" });
  if (!refresh.ok) return res;
  const data = await refresh.json().catch(() => null);
  if (!data?.token) return res;
  localStorage.setItem("auth_token", data.token);
  const retryHeaders = new Headers(init?.headers || {});
  retryHeaders.set("Authorization", `Bearer ${data.token}`);
  return originalFetch(input, { ...init, headers: retryHeaders });
};

createRoot(document.getElementById("root")!).render(<App />);
