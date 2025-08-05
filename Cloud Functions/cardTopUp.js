const functions = require('@google-cloud/functions-framework');
const Firestore = require("@google-cloud/firestore");
const { fetchMint, findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } = require("@solana-program/token");
const { address, getBase58Encoder } = require("@solana/kit");
const { parseUnits } = require("ethers");
const { createRpcProvider } = require("./transportsHelper.js");
const { V1ApiClient } = require("./jupiterHelper");
const { VersionedTransaction, Connection, Keypair } = require("@solana/web3.js");

const db = new Firestore({
  projectId: "effisend",
  keyFilename: "credential.json",
});

const Accounts = db.collection("AccountsSolana");

const rpcs = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-api.projectserum.com",
  "https://rpc.ankr.com/solana",
  "https://solana.api.onfinality.io/public",
  "https://solana.drpc.org",
];

const provider = createRpcProvider(rpcs);
const connection = new Connection(
  rpcs[0],
  "confirmed"
);

functions.http('helloHttp', async (req, res) => {
  try {
    const user = req.body.user
    let query = await Accounts.where("user", "==", user).get();
    if (!query.empty) {
      // Loading User Signer
      const { privateKey: userPrivateKey } = query.docs[0].data();
      const inputToken = address(req.body.inputToken);
      const outputToken = address(req.body.outputToken);
      const amountOut = req.body.amountOut; // amountOut USD
      const to = address(req.body.to); // Destination Address
      // User Wallet
      const signerUser = Keypair.fromSecretKey(
        getBase58Encoder().encode(userPrivateKey)
      );
      // Jupiter Client
      const client = new V1ApiClient();
      // Mints
      const inputMint = await fetchMint(provider, inputToken);
      const outputMint = await fetchMint(provider, outputToken);
      const [destinationTokenAccount] = await findAssociatedTokenPda({
        mint: outputMint.address,
        owner: to,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      });
      const quoteParams = {
        inputMint: inputMint.address, // ANY SPL TOKEN
        outputMint: outputMint.address, // ANY SPL TOKEN - USDC for Kast Card
        amount: parseUnits(amountOut, outputMint.data.decimals).toString(),
      };
      const quote = await client.getQuote(quoteParams);
      console.log("Quote Response:");
      console.log(JSON.stringify(quote, null, 2));
      const executeResponse = await client.executeSwap({
        quoteResponse: quote,
        userPublicKey: signerUser.publicKey.toString(),
        destinationTokenAccount,
      });
      if (executeResponse.simulationError === null) {
        console.log("Swap Response:");
        console.log(JSON.stringify(executeResponse, null, 2));
        const transaction = VersionedTransaction.deserialize(
          Buffer.from(executeResponse.swapTransaction, "base64")
        );
        transaction.sign([signerUser]);
        const transactionBinary = transaction.serialize();
        const signature = await connection.sendRawTransaction(transactionBinary, {
          skipPreflight: true,
        });
        console.log("Transaction Signature:", signature);
        res.send({
          error: null,
          result: {
            hash: signature
          }
        });
      }
      else {
        throw "Simulation Error"
      }
    } else {
      res.send({
        error: "BAD USER",
        result: null
      });
    }
  }
  catch (e) {
    console.log(e)
    res.send({
      error: "BAD REQUEST",
      result: null
    });
  }
});