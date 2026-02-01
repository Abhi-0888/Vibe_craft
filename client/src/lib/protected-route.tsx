import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import React from "react";

type ProtectedRouteProps = {
    path: string;
    component: React.ComponentType<any>;
};

export function ProtectedRoute({
    path,
    component: Component,
}: ProtectedRouteProps) {
    const { user, isLoading } = useAuth();

    return (
        <Route path={path}>
            {() => {
                if (isLoading) {
                    return (
                        <div className="flex h-screen w-screen items-center justify-center bg-background text-primary">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-12 w-12 animate-spin" />
                                <div className="font-mono text-sm tracking-widest animate-pulse uppercase">
                                    Initializing Uplink...
                                </div>
                            </div>
                        </div>
                    );
                }

                if (!user) {
                    return <Redirect to="/login" />;
                }

                return <Component /> as any;
            }}
        </Route>
    );
}
