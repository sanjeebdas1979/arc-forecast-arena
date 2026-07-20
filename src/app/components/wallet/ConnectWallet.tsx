"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import { arcTestnet } from "viem/chains";

import { useVerification } from "../providers/VerificationProvider";

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ConnectWallet() {
  const { address, chainId, isConnected } = useAccount();

  const { isVerified, setVerified } = useVerification();

  const {
    connect,
    connectors,
    isPending: isConnecting,
    error: connectError,
  } = useConnect();

  const { disconnect } = useDisconnect();

  const {
    switchChain,
    isPending: isSwitching,
    error: switchError,
  } = useSwitchChain();

  const {
    data: transactionHash,
    sendTransaction,
    isPending: isSendingTransaction,
    error: transactionError,
    reset: resetTransaction,
  } = useSendTransaction();

  const {
    isLoading: isConfirmingTransaction,
    isSuccess: isTransactionConfirmed,
    isError: isReceiptError,
  } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  const [verificationMessage, setVerificationMessage] =
    useState("");

  const metaMaskConnector = useMemo(
    () =>
      connectors.find((connector) =>
        connector.name.toLowerCase().includes("metamask")
      ) ?? connectors[0],
    [connectors]
  );

  useEffect(() => {
    if (
      !isTransactionConfirmed ||
      !address ||
      chainId !== arcTestnet.id
    ) {
      return;
    }

    setVerified(true);

    setVerificationMessage(
      "Transaction confirmed. Prediction access unlocked."
    );
  }, [
    isTransactionConfirmed,
    address,
    chainId,
    setVerified,
  ]);

  function verifyOnchain() {
    setVerificationMessage("");
    resetTransaction();

    if (!address) {
      setVerificationMessage(
        "Connect your wallet first."
      );
      return;
    }

    if (chainId !== arcTestnet.id) {
      setVerificationMessage(
        "Switch to Arc Testnet first."
      );
      return;
    }

    sendTransaction({
      to: address,
      value: parseEther("0.000001"),
    });
  }

  function disconnectWallet() {
    setVerificationMessage("");
    resetTransaction();
    disconnect();
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          disabled={!metaMaskConnector || isConnecting}
          onClick={() => {
            if (metaMaskConnector) {
              connect({
                connector: metaMaskConnector,
              });
            }
          }}
          className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isConnecting
            ? "Connecting..."
            : "Connect MetaMask"}
        </button>

        {connectError && (
          <p className="max-w-sm text-center text-sm text-red-400">
            {connectError.message}
          </p>
        )}
      </div>
    );
  }

  if (chainId !== arcTestnet.id) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-yellow-300">
          Detected chain ID: {chainId ?? "Unknown"}
        </p>

        <button
          type="button"
          disabled={isSwitching}
          onClick={() =>
            switchChain({
              chainId: arcTestnet.id,
            })
          }
          className="rounded-xl bg-yellow-400 px-6 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSwitching
            ? "Switching..."
            : "Switch To Arc Testnet"}
        </button>

        {switchError && (
          <p className="max-w-sm text-center text-sm text-red-400">
            {switchError.message}
          </p>
        )}

        <button
          type="button"
          onClick={disconnectWallet}
          className="rounded-xl border border-white/20 px-4 py-2 text-sm transition hover:bg-white hover:text-black"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="rounded-xl border border-green-500/50 bg-green-500/10 px-4 py-2">
          <p className="text-xs text-green-400">
            Arc Testnet
          </p>

          <p className="font-medium">
            {address ? shortenAddress(address) : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={disconnectWallet}
          className="rounded-xl border border-white/20 px-4 py-2 transition hover:bg-white hover:text-black"
        >
          Disconnect
        </button>
      </div>

      {isVerified ? (
        <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
          <p className="font-bold text-emerald-400">
            ✓ Verified Onchain
          </p>

          <p className="mt-1 text-sm text-gray-300">
            Prediction access is unlocked for this wallet.
          </p>
        </div>
      ) : (
        <div className="w-full max-w-md rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-center">
          <p className="font-bold text-orange-400">
            Prediction Access Locked
          </p>

          <p className="mt-2 text-sm text-gray-300">
            Complete one tiny Arc Testnet transaction to
            verify your wallet.
          </p>

          <button
            type="button"
            onClick={verifyOnchain}
            disabled={
              isSendingTransaction ||
              isConfirmingTransaction
            }
            className="mt-4 w-full rounded-xl bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSendingTransaction
              ? "Confirm In MetaMask..."
              : isConfirmingTransaction
              ? "Waiting For Confirmation..."
              : "Verify Onchain"}
          </button>

          <p className="mt-3 text-xs text-gray-500">
            Amount: 0.000001 Arc Testnet ETH
          </p>
        </div>
      )}

      {transactionHash && !isVerified && (
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-gray-500">
            Transaction submitted
          </p>

          <p className="mt-1 break-all font-mono text-xs text-gray-300">
            {transactionHash}
          </p>
        </div>
      )}

      {verificationMessage && (
        <p className="max-w-md text-center text-sm text-emerald-400">
          {verificationMessage}
        </p>
      )}

      {transactionError && (
        <p className="max-w-md text-center text-sm text-red-400">
          {transactionError.message}
        </p>
      )}

      {isReceiptError && (
        <p className="max-w-md text-center text-sm text-red-400">
          Transaction confirmation failed. Please try again.
        </p>
      )}
    </div>
  );
}