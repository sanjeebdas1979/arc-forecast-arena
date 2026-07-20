"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAccount } from "wagmi";
import { arcTestnet } from "viem/chains";

type VerificationContextValue = {
  isVerified: boolean;
  setVerified: (value: boolean) => void;
};

type VerificationProviderProps = {
  children: ReactNode;
};

const VerificationContext =
  createContext<VerificationContextValue | null>(null);

export function VerificationProvider({
  children,
}: VerificationProviderProps) {
  const { address, chainId, isConnected } = useAccount();

  const [isVerified, setIsVerified] = useState(false);

  /*
   * Wallet disconnect, wallet address change অথবা
   * Arc Testnet থেকে অন্য network-এ গেলে verification reset হবে।
   */
  useEffect(() => {
    setIsVerified(false);
  }, [address, chainId, isConnected]);

  const setVerified = useCallback(
    (value: boolean): void => {
      if (
        !isConnected ||
        !address ||
        chainId !== arcTestnet.id
      ) {
        setIsVerified(false);
        return;
      }

      setIsVerified(value);
    },
    [address, chainId, isConnected]
  );

  const value = useMemo(
    () => ({
      isVerified,
      setVerified,
    }),
    [isVerified, setVerified]
  );

  return (
    <VerificationContext.Provider value={value}>
      {children}
    </VerificationContext.Provider>
  );
}

export function useVerification(): VerificationContextValue {
  const context = useContext(VerificationContext);

  if (!context) {
    throw new Error(
      "useVerification must be used inside VerificationProvider."
    );
  }

  return context;
}