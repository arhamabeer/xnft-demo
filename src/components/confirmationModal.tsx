import { PublicKey } from "@solana/web3.js";
import React from "react";
import { Button, Text, View } from "react-xnft";
import * as styles from "../styles";

interface Props {
  sol: number;
  send: () => void;
  recWallet: string;
  currWallet: string | PublicKey | null;
}
export default function ConfirmationModal({
  sol,
  send,
  recWallet,
  currWallet,
}: Props) {
  return (
    <View
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: 5,
        flexDirection: "column",
        width: "100vw",
      }}
    >
      <Text style={{ ...styles.confTxt }}>Sol Amount: {sol}</Text>
      <Text style={{ ...styles.confTxt, color: "red" }}>
        Sender: {currWallet?.toString()}
      </Text>
      <Text style={{ ...styles.confTxt, color: "green" }}>
        Receiver: {recWallet}
      </Text>
      <Button
        onClick={() => send()}
        style={{ display: "flex", alignSelf: "center", marginTop: 15 }}
      >
        SEND
      </Button>
    </View>
  );
}
