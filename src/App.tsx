import React, { useCallback, useEffect, useState } from "react";
import ReactXnft, {
  Button,
  Text,
  TextField,
  usePublicKey,
  View,
  useConnection,
  Loading,
} from "react-xnft";
import base58 from "bs58";
import * as styles from "./styles";

import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  Keypair,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import useProvider from "./hooks/useProvider";
import useXnft from "./hooks/useXnft";
import SuccessModal from "./components/successModal";
import ConfirmationModal from "./components/confirmationModal";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

//
// On connection to the host environment, warm the cache.
//
ReactXnft.events.on("connect", () => {
  // no-op
});

// 65rDwXFEQRiP9TidqHm1bZAd9Fr1LahiFbyswnFEkWos

export function App() {
  const [balance, setBalance] = useState(0);
  const [receiverWallet, setReceiverWallet] = useState("");
  const [solAmount, setSolAmount] = useState(0);
  const [txID, setTxId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTxId, setShowTxId] = useState(false);
  const [confirmation, setConfirmation] = useState(false);

  const xnft = useXnft();

  const fetchBalance = useCallback(async () => {
    if (!xnft.publicKey || !xnft.connection) return;
    const balance = await xnft.connection.getBalance(xnft.publicKey);
    setBalance(balance / LAMPORTS_PER_SOL);
    const tokens = await xnft.connection.getTokenAccountsByOwner(
      xnft.publicKey,
      { programId: TOKEN_PROGRAM_ID }
    );
    console.log("tokens => ", tokens);
  }, [xnft.publicKey, xnft.connection]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const sendTransaction = async () => {
    if (
      !xnft.connection ||
      !xnft.publicKey ||
      balance < solAmount ||
      solAmount < 1 ||
      !receiverWallet
    )
      return;
    setConfirmation(true);
  };

  const send = async () => {
    if (
      !xnft.connection ||
      !xnft.publicKey ||
      balance < solAmount ||
      solAmount < 1 ||
      !receiverWallet
    )
      return;
    setConfirmation(!confirmation);
    setLoading(true);
    const tx = new Transaction().add(
      SystemProgram.transfer({
        toPubkey: new PublicKey(receiverWallet),
        fromPubkey: xnft.publicKey,
        lamports: solAmount * LAMPORTS_PER_SOL,
      })
    );
    const txId = await xnft.sendAndConfirm(tx);
    fetchBalance();
    setLoading(false);
    setTxId(txId);
    setShowTxId(true);
  };

  return (
    <View style={styles.view}>
      {!showTxId ? (
        <>
          {!confirmation ? (
            <>
              <Text
                style={{
                  ...styles.text,
                  textAlign: "center",
                }}
              >
                {/* Wallet: {provider.publicKey?.toString().slice(0, 7)}...! */}
              </Text>
              <Text
                style={{
                  ...styles.text,
                  textAlign: "center",
                }}
              >
                Balance: {balance.toString().substring(0, 6) || 0}
              </Text>
              <View
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <TextField
                  placeholder="enter receiver's wallet key"
                  style={{ width: "75%" }}
                  onChange={(e: any) => setReceiverWallet(e.data.value)}
                />
                <TextField
                  placeholder="enter SOL amount to send"
                  style={{ width: "75%" }}
                  onChange={(e: any) => setSolAmount(e.data.value)}
                />
              </View>
              <Button
                disabled={loading && true}
                onClick={sendTransaction}
                style={{
                  ...styles.button,
                  width: "55%",
                  marginTop: 10,
                }}
                className={"abcd"}
              >
                {loading ? <Loading /> : "Click for Transactions"}
              </Button>
            </>
          ) : (
            <ConfirmationModal
              currWallet={xnft.publicKey}
              recWallet={receiverWallet}
              sol={solAmount}
              send={send}
            />
          )}
        </>
      ) : (
        <SuccessModal txID={txID} setTxID={setTxId} setShowTxId={setShowTxId} />
      )}
    </View>
  );
}
