import { Sidebar } from "@/components/Sidebar";
import Dashboard from "@/pages/Dashboard";
import ChainMap from "@/pages/ChainMap";
import GuardianGame from "@/pages/GuardianGame";
import MinerTycoon from "@/pages/MinerTycoon";
import PredictionArena from "@/pages/PredictionArena";
import NftGallery from "@/pages/NftGallery";
import QuestBoard from "@/pages/QuestBoard";
import TeamHub from "@/pages/TeamHub";
import NotFound from "@/pages/not-found";

import { Switch, Route } from "wouter";
import { useAuth } from "@/hooks/use-auth";
;

export default function Home() {
  const { user } = useAuth();

  if (!user) return null;

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
          <Route path="/nfts" component={NftGallery} />
          <Route path="/quests" component={QuestBoard} />
          <Route path="/teams" component={TeamHub} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}
