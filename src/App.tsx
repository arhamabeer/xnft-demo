import React, { useCallback, useEffect, useState } from "react";
import ReactXnft, { Button, Text, TextField, View, Loading } from "react-xnft";
import * as styles from "./styles";

import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import useXnft from "./hooks/useXnft";
import SuccessModal from "./components/successModal";
import ConfirmationModal from "./components/confirmationModal";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Metaplex } from "@metaplex-foundation/js";
import { web3 } from "@project-serum/anchor";
import * as metaplexMetaData from "@metaplex-foundation/mpl-token-metadata";

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
  const [token, setToken] = useState([] as any);
  const [loading, setLoading] = useState(false);
  const [showTxId, setShowTxId] = useState(false);
  const [confirmation, setConfirmation] = useState(false);

  const xnft = useXnft();

  const fetchBalance = useCallback(async () => {
    if (!xnft.publicKey || !xnft.connection) return;
    const balance = await xnft.connection.getBalance(xnft.publicKey);

    setBalance(balance / LAMPORTS_PER_SOL);
    const tokens = (
      await xnft.connection.getParsedTokenAccountsByOwner(xnft.publicKey, {
        programId: TOKEN_PROGRAM_ID,
      })
    ).value.map((data) => data.account.data.parsed.info.mint);
    setToken(tokens);
  }, [xnft.publicKey, xnft.connection]);

  const fetchNFTs = useCallback(async () => {
    if (!xnft.connection || !xnft.publicKey || !token.length) return;
    const music = await Promise.all(
      token.map(async (mintStr: string) => {
        const mint = new web3.PublicKey(mintStr);

        const [metadataAddress] = await web3.PublicKey.findProgramAddress(
          [
            Buffer.from("metadata", "utf8"),
            metaplexMetaData.PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
          ],
          metaplexMetaData.PROGRAM_ID
        );

        try {
          const metadata = await metaplexMetaData.Metadata.fromAccountAddress(
            xnft.connection,
            metadataAddress
          );
          return metadata;
        } catch (e) {
          console.log("catch", e);
        }
      })
    );
    // const metaplex = new Metaplex(xnft.connection);
    // const nft = await metaplex.nfts().findByMint({ mintAddress: token });
  }, [token.length]);

  useEffect(() => {
    fetchBalance();
    fetchNFTs();
  }, [fetchBalance, fetchNFTs]);

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

  // console.log(token.value && token.value);

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
                {/* Tokens: {token.length || 0} */}
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
