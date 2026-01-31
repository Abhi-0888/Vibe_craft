import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { CyberButton } from "@/components/CyberButton";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold font-display text-destructive">404 ERROR</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground font-mono">
            The requested neural pathway does not exist. The coordinate you are trying to access is invalid or has been purged.
          </p>
          
          <div className="mt-8">
            <Link href="/">
              <CyberButton variant="destructive" className="w-full">
                RETURN TO GRID
              </CyberButton>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
