import React from "react";
import { Button, Text, View } from "react-xnft";

interface Props {
  txID: string;
  setTxID: React.Dispatch<React.SetStateAction<string>>;
  setShowTxId: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function SuccessModal(props: Props) {
  const handleClose = () => {
    props.setTxID("");
    props.setShowTxId(false);
  };

  return (
    <View
      style={{
        padding: 15,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        width: "100vw",
      }}
    >
      <Text>Transaction Successful. </Text>
      <Text>Your Transaction ID is: </Text>
      <Text
        style={{
          width: "100%",
          wordWrap: "break-word",
          textAlign: "center",
          color: "red",
        }}
      >
        {props.txID}
      </Text>
      <Button style={{ marginTop: 10 }} onClick={() => handleClose()}>
        Close
      </Button>
    </View>
  );
}
