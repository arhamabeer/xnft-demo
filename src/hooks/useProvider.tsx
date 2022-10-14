import React from "react";
import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import { toast } from "react-toastify";
import useXnft from "./useXnft";

const defaultOpts: web3.ConfirmOptions = {
  preflightCommitment: "confirmed",
};

export default function useProvider(opts?: web3.ConfirmOptions) {
  const { publicKey, xnft, connection } = useXnft();

  const provider = React.useMemo(() => {
    if (!connection || !xnft || !opts) return;
    return new anchor.AnchorProvider(
      new web3.Connection(connection.rpcEndpoint),
      xnft as any,
      opts || defaultOpts
    );
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, xnft]);
  // const provider = React.useMemo(() => {
  //   if (!detected) return;
  //   connection
  //   return xnft;
  //   //eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [xnft]);

  const sendAndConfirm = React.useCallback(
    async (
      tx: anchor.web3.Transaction,
      toasts?: {
        loading: string;
        success?: string;
        error?: string;
      }
    ) => {
      if (!provider)
        throw new Error(
          "Provider not created yet!, Wait for connection to be established"
        );

      let toastId;
      if (toasts) {
        toastId = toast.loading(toasts.loading);
      }

      try {
        const txId = await provider.sendAndConfirm(tx);
        if (toasts?.success && toastId) {
          toast.update(toastId, {
            render: toasts.success,
            type: "success",
            isLoading: false,
            autoClose: 4000,
          });
        }
        return txId;
      } catch (e) {
        if (toasts?.error && toastId) {
          toast.update(toastId, {
            render: toasts.error,
            type: "error",
            isLoading: false,
            autoClose: 4000,
          });
        }
        throw e;
      }
    },
    [provider]
  );

  const sendAll = React.useCallback(
    async (
      txs: {
        tx: anchor.web3.Transaction;
        signers: anchor.web3.Keypair[];
      }[],
      toasts?: {
        loading: string;
        success?: string;
        error?: string;
      }
    ) => {
      if (!provider)
        throw new Error(
          "Provider not created yet!, Wait for connection to be established"
        );

      let toastId;
      if (toasts) {
        toastId = toast.loading(toasts.loading);
      }

      try {
        const txId = provider.sendAll(txs);
        if (toasts?.success && toastId) {
          toast.update(toastId, {
            render: toasts.success,
            type: "success",
            isLoading: false,
            autoClose: 4000,
          });
        }
        return txId;
      } catch (e) {
        if (toasts?.error && toastId) {
          toast.update(toastId, {
            render: toasts.error,
            type: "error",
            isLoading: false,
            autoClose: 4000,
          });
        }
        throw e;
      }
    },
    [provider]
  );

  const sendInBatches = React.useCallback(
    (
      data: any[],
      transactionCallback: (
        data: any,
        isFirst?: boolean
      ) =>
        | { tx: anchor.web3.Transaction; signers: anchor.web3.Keypair[] }
        | undefined,
      successCallback = () => {},
      actionText = "Work",
      batchSize = 5,
      opts?: web3.ConfirmOptions
    ) => {
      if (!provider)
        throw new Error(
          "Provider not created yet!, Wait for connection to be established"
        );

      const batches = Math.ceil(data.length / batchSize);

      // SENDING TRANSACTIONS IN BATCHES
      const sendTrasactionBatch = async (
        currentBatch: number,
        isFirst: boolean,
        opts: any
      ) => {
        if (currentBatch > batches) return;

        const batch = data.slice(
          batchSize * (currentBatch - 1),
          batchSize * currentBatch
        );

        if (opts === undefined) {
          opts = defaultOpts;
        }

        const blockhash = await provider.connection.getLatestBlockhash(
          opts.preflightCommitment
        );

        const txs: web3.Transaction[] = [];
        for (let part of batch) {
          const transaction = await transactionCallback(part, isFirst);
          isFirst = false;
          if (transaction) {
            let signers = transaction.signers;
            if (signers === undefined) {
              signers = [];
            }

            const tx = transaction.tx;
            tx.feePayer = provider.wallet.publicKey;
            tx.recentBlockhash = blockhash.blockhash;

            signers
              .filter((s: any) => s !== undefined)
              .forEach((kp: any) => {
                tx.partialSign(kp);
              });

            txs.push(tx);
          }
        }

        const message = toast.loading(
          `${actionText}ing batch ${currentBatch} / ${batches}`
        );

        try {
          const signedTxs = await provider.wallet.signAllTransactions(txs);
          new Promise(async (resolve, reject) => {
            const sigs: any = [];
            for (let k = 0; k < txs.length; k += 1) {
              const tx = signedTxs[k];
              const rawTx = tx.serialize();
              anchor.web3
                .sendAndConfirmRawTransaction(provider.connection, rawTx, opts)
                .then((sig) => {
                  sigs.push(sig);
                  if (sigs.length === txs.length) {
                    resolve(sigs);
                  }
                })
                .catch((e) => {
                  reject(e);
                });
            }
            return sigs;
          })
            .then((sigs) => {
              console.log(
                `${actionText}ed ${currentBatch} / ${batches}!`,
                sigs
              );
              toast.update(message, {
                render: `${actionText}ed ${currentBatch} / ${batches}!`,
                type: "success",
                isLoading: false,
                closeOnClick: true,
                closeButton: true,
                autoClose: 4000,
              });
            })
            .catch((e) => {
              console.error(e);
              toast.update(message, {
                render: `Batch ${currentBatch}/${batches} is failed`,
                type: "error",
                isLoading: false,
                closeOnClick: true,
                closeButton: true,
                autoClose: 4000,
              });
            });
        } catch (e) {
          console.error(`Batch ${currentBatch}/${batches} failed`, e);
          toast.update(message, {
            render: `Batch ${currentBatch}/${batches} is failed, Please reload and try again`,
            type: "error",
            isLoading: false,
            closeOnClick: true,
            closeButton: true,
            autoClose: 4000,
          });
        } finally {
          successCallback();
          sendTrasactionBatch(currentBatch + 1, false, opts);
        }
      };
      sendTrasactionBatch(1, true, opts);
    },
    [provider]
  );

  return {
    connection: xnft.connection,
    xnft,
    publicKey,
    provider,
    sendAndConfirm,
    sendAll,
    sendInBatches,
  };
}
