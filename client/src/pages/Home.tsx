import { Sidebar } from "@/components/Sidebar";
import Dashboard from "@/pages/Dashboard";
import ChainMap from "@/pages/ChainMap";
import GuardianGame from "@/pages/GuardianGame";
import MinerTycoon from "@/pages/MinerTycoon";
import PredictionArena from "@/pages/PredictionArena";
import { Switch, Route } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError, redirectToLogin } from "@/lib/auth-utils";

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      redirectToLogin(toast);
    }
  }, [isLoading, isAuthenticated, toast]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin" />
          <div className="font-mono text-sm tracking-widest animate-pulse">INITIALIZING UPLINK...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/map" component={ChainMap} />
          <Route path="/guardian" component={GuardianGame} />
          <Route path="/miner" component={MinerTycoon} />
          <Route path="/prediction" component={PredictionArena} />
        </Switch>
      </main>
    </div>
  );
}
