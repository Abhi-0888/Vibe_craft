import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMe } from "@/hooks/use-game";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Map as MapIcon,
  ShieldCheck,
  Pickaxe,
  TrendingUp,
  LogOut,
  Cpu,
  Coins
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { data: user } = useMe();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/map", label: "Chain Map", icon: MapIcon },
    { href: "/miner", label: "Mining Hub", icon: Pickaxe },
    { href: "/nfts", label: "NFT Gallery", icon: Cpu },
    { href: "/quests", label: "Quests", icon: ShieldCheck },
    { href: "/guardian", label: "Guardian", icon: ShieldCheck },
    { href: "/prediction", label: "Predictions", icon: TrendingUp },
    { href: "/teams", label: "Teams", icon: MapIcon },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/60 flex flex-col z-50">
      {/* Brand Header */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Cpu className="mr-2 h-6 w-6 text-primary animate-pulse" />
        <span className="font-display text-xl font-bold tracking-widest text-foreground">
          QUAI<span className="text-primary">NET</span>
        </span>
      </div>

      {/* User Stats Card */}
      <div className="p-4">
        <div className="rounded-sm border border-primary/20 bg-primary/5 p-4 clip-corner-br">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground uppercase">
            <span>Operator</span>
            <span className="font-mono text-primary">{user?.username}</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Coins className="h-4 w-4 text-yellow-500" />
            <span className="font-mono text-lg font-bold text-foreground">
              {user?.tokens?.toFixed(2) ?? "---"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Pickaxe className="h-3 w-3" />
            <span>{user?.miningPower ?? 0} H/s</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "group flex items-center px-4 py-3 text-sm font-medium rounded-sm transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary border-r-2 border-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 transition-colors",
                    isActive ? "text-primary drop-shadow-[0_0_5px_rgba(255,51,51,0.8)]" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="font-sans uppercase tracking-wide">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <button
          onClick={() => logout()}
          className="flex w-full items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          DISCONNECT
        </button>
      </div>
    </aside>
  );
}
