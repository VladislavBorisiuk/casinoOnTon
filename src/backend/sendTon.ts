import { TonClient, WalletContractV4, internal, fromNano, toNano } from "ton";
import { mnemonicToPrivateKey } from "ton-crypto";
import { config } from "dotenv";
config();

const client = new TonClient({ endpoint: "https://toncenter.com/api/v2/jsonRPC" });

export async function sendTon(destination: string, amountTon: number) {
  const mnemonic = process.env.TON_WALLET_PRIVATE_KEY!.split(" ");
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });

  const walletContract = client.open(wallet);

  const seqno = await walletContract.getSeqno();

  console.log("Начинаем транзакцию с seqno:", seqno);

  await walletContract.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        to: destination,
        value: toNano(amountTon),
        body: "Withdraw from Casino App",
      }),
    ],
  });

  console.log(`${amountTon} TON отправлено на ${destination}`);
}
