import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'quais';
import { formatEther } from 'ethers';

interface PelagusState {
  address: string | null;
  balance: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePelagus() {
  const [state, setState] = useState<PelagusState>({
    address: null,
    balance: null,
    isConnected: false,
    isLoading: true,
    error: null,
  });

  const fetchBalance = useCallback(async (addr: string) => {
    try {
      // @ts-ignore
      if (!window.pelagus) return;
      // @ts-ignore
      const provider = new BrowserProvider(window.pelagus);
      const balance = await provider.getBalance(addr);
      setState(prev => ({ ...prev, balance: formatEther(balance) }));
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      // @ts-ignore
      if (!window.pelagus) {
        setState(prev => ({ ...prev, isLoading: false, error: "Pelagus not installed" }));
        return;
      }

      // @ts-ignore
      const provider = new BrowserProvider(window.pelagus);
      const accounts = await provider.send("quai_accounts", []);

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        setState(prev => ({ ...prev, address, isConnected: true, isLoading: false }));
        fetchBalance(address);
      } else {
        setState(prev => ({ ...prev, isConnected: false, isLoading: false }));
      }
    } catch (err) {
      console.error("Error checking connection:", err);
      setState(prev => ({ ...prev, isLoading: false, error: "Failed to check connection" }));
    }
  }, [fetchBalance]);

  useEffect(() => {
    checkConnection();

    // Listen for account changes
    // @ts-ignore
    if (window.pelagus) {
      // @ts-ignore
      window.pelagus.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setState(prev => ({ ...prev, address: accounts[0], isConnected: true }));
          fetchBalance(accounts[0]);
        } else {
          setState(prev => ({ ...prev, address: null, balance: null, isConnected: false }));
        }
      });
    }

    return () => {
      // Cleanup listeners if needed
    };
  }, [checkConnection, fetchBalance]);

  const refreshBalance = useCallback(() => {
    if (state.address) {
      fetchBalance(state.address);
    }
  }, [state.address, fetchBalance]);

  const connect = useCallback(async () => {
    try {
      // @ts-ignore
      if (!window.pelagus) {
        throw new Error("Pelagus wallet not found");
      }
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      // @ts-ignore
      const provider = new BrowserProvider(window.pelagus);
      await provider.send("quai_requestAccounts", []);
      await checkConnection();
    } catch (err: any) {
      console.error("Error connecting wallet:", err);
      setState(prev => ({ ...prev, isLoading: false, error: err.message || "Failed to connect" }));
    }
  }, [checkConnection]);

  return {
    ...state,
    checkConnection,
    refreshBalance,
    connect
  };
}
