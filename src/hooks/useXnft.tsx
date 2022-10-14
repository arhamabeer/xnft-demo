import { useMemo } from "react";
import {
  ConfirmOptions,
  Connection,
  PublicKey,
  sendAndConfirmRawTransaction,
  Transaction,
} from "@solana/web3.js";
import { useState, useEffect } from "react";

const Errors = {
  WalletNotConnected: new Error("Wallet is not yet connected, please wait!"),
};

export default function useXnft(opts?: ConfirmOptions) {
  const detected = useMemo(() => !!(window as any).xnft, []);

  const options: ConfirmOptions = useMemo(
    () =>
      opts || {
        commitment: "confirmed",
        skipPreflight: false,
        preflightCommitment: "confirmed",
      },
    []
  );

  const [xnft, setXnft] = useState<any>((window as any).xnft);
  const [backpack, setBackpack] = useState<any>((window as any).backpack);

  const [connection, setConnection] = useState<Connection>(
    new Connection(xnft.connection.rpcEndpoint)
  );
  const publicKey: PublicKey | null = useMemo(
    () => xnft?.publicKey || null,
    [xnft]
  );

  useEffect(() => {
    setTimeout(() => {
      (window as any).xnft.on("change", () => {
        console.log("changed", (window as any).xnft);
        // no-op
        setXnft((window as any).xnft);
        setBackpack((window as any).backpack);
        setConnection(new Connection(xnft.connection.rpcEndpoint));
      });
      (window as any).xnft.on("connect", () => {
        console.log("connected", (window as any).xnft);
        // no-op
        setXnft((window as any).xnft);
        setBackpack((window as any).backpack);
        setConnection(new Connection(xnft.connection.rpcEndpoint));
      });
    }, 0);
  }, []);

  const signTransaction = (tx: Transaction): Transaction => {
    return xnft.signTransaction(tx);
  };

  const sendAndConfirm = async (tx: Transaction, opts?: ConfirmOptions) => {
    if (!connection || !publicKey) throw Errors.WalletNotConnected;
    tx.feePayer = publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const signedTx = await signTransaction(tx);
    return sendAndConfirmRawTransaction(
      connection,
      signedTx.serialize(),
      opts || options
    );
  };

  return {
    detected,
    xnft: xnft || {},
    backpack: backpack || {},
    connection,
    publicKey,
    signTransaction,
    sendAndConfirm,
  };
}
