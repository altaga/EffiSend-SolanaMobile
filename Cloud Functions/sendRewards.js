const functions = require('@google-cloud/functions-framework');
const Firestore = require("@google-cloud/firestore");
const { fetchMint, findAssociatedTokenPda, getTransferCheckedInstruction, getCreateAssociatedTokenInstructionAsync, TOKEN_PROGRAM_ADDRESS } = require("@solana-program/token");
const {
    address,
    appendTransactionMessageInstructions,
    createKeyPairFromBytes,
    createSignerFromKeyPair,
    createSolanaRpcSubscriptions,
    createTransactionMessage,
    getBase58Encoder,
    getSignatureFromTransaction,
    pipe,
    sendAndConfirmTransactionFactory,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
    signTransactionMessageWithSigners,
} = require("@solana/kit");
const { parseUnits } = require("ethers");
const fs = require("node:fs");
const { createRpcProvider } = require("./transportsHelper.js");

const { privateKey: cloudPrivateKey } = JSON.parse(
    fs.readFileSync(
        "keypair.json",
        "utf8"
    )
);

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
const providerSubcription = createSolanaRpcSubscriptions(
    "ws://api.mainnet-beta.solana.com"
);

functions.http('helloHttp', async (req, res) => {
    try {
        const _address = req.body.address
        let query = await Accounts.where("address", "==", _address).get();
        if (!query.empty) {
            const { rewards, user } = query.docs[0].data();
            if (rewards <= 0) {
                throw "NO REWARDS"
            }
            const token = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";
            const keypairCloud = await createKeyPairFromBytes(
                getBase58Encoder().encode(cloudPrivateKey)
            );
            const signerCloud = await createSignerFromKeyPair(keypairCloud);
            const mint = await fetchMint(provider, token);
            const [authorityATA] = await findAssociatedTokenPda({
                mint: mint.address,
                owner: signerCloud.address,
                tokenProgram: TOKEN_PROGRAM_ADDRESS,
            });
            const [receiverATA] = await findAssociatedTokenPda({
                mint: mint.address,
                owner: address(_address),
                tokenProgram: TOKEN_PROGRAM_ADDRESS,
            });
            let txArray = [];
            const { value: receiverATAInfo } = await provider
                .getAccountInfo(address(receiverATA), {
                    encoding: "jsonParsed",
                })
                .send();
            if (receiverATAInfo === null) {
                const createAtaInstruction = await getCreateAssociatedTokenInstructionAsync(
                    {
                        payer: signerCloud.address,
                        mint: mint.address,
                        owner: address(_address),
                    }
                );
                txArray.push(createAtaInstruction);
                console.log("Create ATA instruction added.");
            }
            const transferIx = getTransferCheckedInstruction({
                source: authorityATA,
                mint,
                destination: receiverATA,
                authority: signerCloud.address,
                amount: parseUnits(rewards, mint.data.decimals), // 1 token
                decimals: mint.data.decimals,
            });
            txArray.push(transferIx);
            const { value: latestBlockhash } = await provider.getLatestBlockhash().send();
            const transactionMessage = pipe(
                createTransactionMessage({ version: 0 }),
                (tx) => setTransactionMessageFeePayerSigner(signerCloud, tx),
                (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
                (tx) => appendTransactionMessageInstructions(txArray, tx)
            );
            const signedTransaction = await signTransactionMessageWithSigners(
                transactionMessage
            );
            await sendAndConfirmTransactionFactory({
                rpc: provider,
                rpcSubscriptions: providerSubcription,
            })(signedTransaction, { commitment: "confirmed" });
            const txSignature = getSignatureFromTransaction(signedTransaction);
            console.log("Transaction Signature:", txSignature);
            const dataFrameTemp = query.docs[0].data();
            const dataframe = {
                ...dataFrameTemp,
                rewards: "0"
            }
            await Accounts.doc(user).set(dataframe);
            res.send({
                error: null,
                result: {
                    tx: txSignature
                }
            });
        } else {
            res.send({
                error: "BAD ADDRESS",
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