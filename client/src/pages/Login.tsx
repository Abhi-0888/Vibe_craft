import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, UserPlus, LogIn, Globe, Zap, Database, Wallet } from "lucide-react";
import { BrowserProvider } from "quais";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  async function connectWallet() {
    try {
      setLoading(true);
      // @ts-ignore
      if (!window.pelagus) throw new Error("Pelagus Wallet not found!");

      // @ts-ignore
      const provider = new BrowserProvider(window.pelagus);
      await provider.send("quai_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      localStorage.setItem("auth_token", "guest.token");
      localStorage.setItem("guest_user", JSON.stringify({ id: "guest", username: address }));
      toast({
        title: "Wallet Connected",
        description: `Linked: ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
      setTimeout(() => setLocation("/"), 300);
    } catch (err: any) {
      toast({
        title: "Connection Error",
        description: err.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    try {
      setLoading(true);
      if (mode === "register") {
        const uname = username || email.split("@")[0];
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: uname } },
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      toast({
        title: mode === "login" ? "Welcome back" : "Account created",
        description: "Redirecting to Command Center",
        variant: "default",
      });
      setTimeout(() => setLocation("/"), 300);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />

        {/* Animated Grid */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `linear-gradient(to right, #ff3333 1px, transparent 1px), linear-gradient(to bottom, #ff3333 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at center, black, transparent 80%)'
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10 px-6"
      >
        <Card className="bg-black/40 backdrop-blur-xl border-primary/20 box-shadow-glow border-glow relative overflow-hidden">
          {/* Header Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

          <CardHeader className="text-center pb-2">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              className="mx-auto w-12 h-12 mb-4 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/30"
            >
              <Shield className="w-6 h-6 text-primary" />
            </motion.div>
            <CardTitle className="font-display text-2xl tracking-widest uppercase text-shadow-glow">
              {mode === "login" ? "Authenticate" : "Initialize Link"}
            </CardTitle>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Quai Network :: Sector Orbit
            </p>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
                className="space-y-4"
              >
                <div className="space-y-2 group">
                  <div className="flex justify-between items-center px-1">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Identity_Email
                    </div>
                  </div>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="USER@DOMAIN.NET"
                    className="bg-black/60 border-primary/10 focus:border-primary/50 font-mono text-sm h-11"
                  />
                </div>

                {mode === "register" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2 group"
                  >
                    <div className="flex justify-between items-center px-1">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Handle_Alias
                      </div>
                    </div>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="CYBER_MINER_01"
                      className="bg-black/60 border-primary/10 focus:border-primary/50 font-mono text-sm h-11"
                    />
                  </motion.div>
                )}

                <div className="space-y-2 group">
                  <div className="flex justify-between items-center px-1">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                      <Database className="w-3 h-3" /> Access_Key
                    </div>
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="bg-black/60 border-primary/10 focus:border-primary/50 font-mono text-sm h-11"
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            <Button
              className="w-full h-12 bg-primary hover:bg-primary/80 text-primary-foreground font-display tracking-widest transition-all duration-300 relative group overflow-hidden"
              onClick={submit}
              disabled={loading || !email || !password}
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
              <div className="flex items-center gap-2">
                {loading ? (
                  <span className="animate-pulse">Processing...</span>
                ) : mode === "login" ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Establish Link</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Profile</span>
                  </>
                )}
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-10 border-primary/20 hover:border-primary/50 text-muted-foreground hover:text-primary font-mono text-xs tracking-widest transition-all duration-300 mt-2"
              onClick={async () => {
                try {
                  setLoading(true);
                  localStorage.setItem("auth_token", "guest.token");
                  localStorage.setItem("guest_user", JSON.stringify({ id: "guest", username: "Guest" }));
                  toast({
                    title: "Guest Uplink Active",
                    description: "Welcome to Sector Orbit",
                  });
                  setTimeout(() => setLocation("/"), 300);
                } catch (err) {
                  toast({
                    title: "Uplink Error",
                    description: `Error: ${err instanceof Error ? err.message : String(err)}`,
                    variant: "destructive",
                  });
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              CONTINUE AS GUEST
            </Button>

            <div className="text-center">
              <button
                className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors duration-300"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? "// Switch_to_Registration" : "// Return_to_Main_Log"}
              </button>
            </div>
          </CardContent>

          <CardFooter className="justify-center gap-6 pt-4 pb-6 border-t border-primary/10 bg-black/20">
            <a href="https://dominantstrategies.io/" target="_blank" rel="noreferrer" className="text-[10px] font-mono uppercase text-muted-foreground hover:text-primary transition-colors">
              HQ_DomStr
            </a>
            <a href="https://qu.ai/#partners" target="_blank" rel="noreferrer" className="text-[10px] font-mono uppercase text-muted-foreground hover:text-primary transition-colors">
              Net_Nodes
            </a>
            <a href="https://docs.qu.ai/learn/introduction" target="_blank" rel="noreferrer" className="text-[10px] font-mono uppercase text-muted-foreground hover:text-primary transition-colors">
              OS_Manual
            </a>
          </CardFooter>
        </Card>

        {/* Status Decoration */}
        <div className="mt-4 flex justify-between items-center px-2">
          <div className="text-[8px] font-mono text-primary/40 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
            SYSTEM_ONLINE :: NODE_CONNECTED
          </div>
          <div className="text-[8px] font-mono text-primary/40">
            v2.0.4-LATEST
          </div>
        </div>
      </motion.div>
    </div>
  );
}
