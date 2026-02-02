import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
}

async function fetchUser(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getUser();
  if (data?.user) {
    const u = data.user;
    const username = (u.user_metadata?.username as string) || (u.email?.split("@")[0] ?? "user");
    return { id: u.id, username, email: u.email ?? undefined };
  }
  const guest = localStorage.getItem("guest_user");
  return guest ? JSON.parse(guest) : null;
}

async function logout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
  });
  localStorage.removeItem("auth_token");
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      window.location.href = "/login";
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
