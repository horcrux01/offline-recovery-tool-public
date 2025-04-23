import { connect, keyStores, transactions, utils } from 'near-api-js';
import { PublicKey } from 'near-api-js/lib/utils';
import { KeyType } from 'near-api-js/lib/utils/key_pair';
import { randomBytes } from 'crypto';
import { sha256 } from 'js-sha256';
import bs58 from 'bs58';
import {
  bytesToNumberLE,
  concatBytes,
  numberToBytesLE,
} from '@noble/curves/abstract/utils';

const sha512 = async (...messages: Uint8Array[]) => {
  const buffer = concatBytes(...messages);
  const digest = await crypto.subtle.digest('SHA-512', buffer);
  return new Uint8Array(digest);
};

export async function eddsaSign(
  privateKey: bigint,
  message: Uint8Array | string,
  hasher: (...msgs: Uint8Array[]) => Promise<Uint8Array> = sha512
): Promise<Uint8Array> {
  const { ExtendedPoint, CURVE: edCURVE, etc } = await import('@noble/ed25519');

  const messagesBytes =
    typeof message === 'string' ? Buffer.from(message, 'hex') : message;
  const messageBytes = concatBytes(messagesBytes);
  const seed = randomBytes(32);
  const privateKeyBytes = numberToBytesLE(privateKey, 32);

  const nonceDigest = await hasher(seed, privateKeyBytes, messageBytes);
  const nonce = etc.mod(bytesToNumberLE(nonceDigest), edCURVE.n);

  const PK = ExtendedPoint.BASE.mul(privateKey);
  const serializedPK = PK.toRawBytes();

  const R = ExtendedPoint.BASE.mul(nonce);
  const serializedR = R.toRawBytes();

  const hramDigest = await hasher(serializedR, serializedPK, messageBytes);
  const hram = etc.mod(bytesToNumberLE(hramDigest), edCURVE.n);

  const s = etc.mod(hram * privateKey + nonce, edCURVE.n);
  return concatBytes(serializedR, numberToBytesLE(s, 32));
}

/**
 * Gets the latest nonce for a given public key by directly querying the RPC endpoint
 * This ensures we have the most up-to-date nonce value
 */
async function getLatestNonce(
  accountId: string,
  publicKey: PublicKey,
  provider: any
): Promise<bigint> {
  try {
    // Get the current access key info directly from the RPC endpoint
    const accessKeyResponse = await provider.query({
      request_type: 'view_access_key',
      account_id: accountId,
      public_key: publicKey.toString(),
      finality: 'optimistic', // Use optimistic finality for the most recent state
    });

    // Extract and log the nonce
    const currentNonce = BigInt(accessKeyResponse.nonce);

    // Always increment by 1 to get the next nonce
    const nextNonce = currentNonce + BigInt(1);
    console.log(`Using nonce for transaction: ${nextNonce}`);

    return nextNonce;
  } catch (error) {
    console.error('Error getting latest nonce:', error);
    throw new Error(
      `Failed to get nonce for ${publicKey.toString()}: ${error}`
    );
  }
}

async function buildUnsignedTx(
  senderId: string,
  receiverId: string,
  amountYocto: string,
  publicKeyHex: string,
  near: any
) {
  console.log('publicKeyHex', publicKeyHex);

  // Convert hex to Buffer then to base58
  const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
  const publicKeyBase58 = bs58.encode(publicKeyBytes);

  // Create proper NEAR public key with ed25519: prefix
  const publicKey = PublicKey.fromString(`ed25519:${publicKeyBase58}`);

  const { provider } = near.connection;

  // Get the latest nonce using our new method
  const nonce = await getLatestNonce(senderId, publicKey, provider);

  // Get the latest block hash
  const { hash } = (await provider.block({ finality: 'final' })).header;
  console.log('block hash:', hash);

  const actions = [transactions.transfer(BigInt(amountYocto))];
  return transactions.createTransaction(
    senderId,
    publicKey,
    receiverId,
    nonce, // Using latest nonce from network
    actions,
    bs58.decode(hash)
  );
}

async function sign(txnMessage: string, pvtKeyHex: string) {
  const pvtKey = BigInt(`0x${pvtKeyHex}`);
  const signature = await eddsaSign(pvtKey, txnMessage);
  return {
    signature: {
      keyType: 0, // ED25519
      data: Buffer.from(signature).toString('base64'),
    },
  };
}

async function broadcastTx(
  tx: transactions.Transaction,
  signature: any,
  provider: any
) {
  const signatureBytes = Buffer.from(signature.data, 'base64');

  const nearSignature = new transactions.Signature({
    keyType: KeyType.ED25519,
    data: signatureBytes,
  });

  const signedTx = new transactions.SignedTransaction({
    transaction: tx,
    signature: nearSignature,
  });

  const serialized = signedTx.encode();
  const txBase64 = Buffer.from(serialized).toString('base64');

  const result = await provider.sendJsonRpc('broadcast_tx_commit', [txBase64]);
  return result.transaction.hash;
}

/**
 * Execute a transfer of NEAR or tokens
 * @param publicKeyHex Public key in hex format
 * @param sender Sender account ID
 * @param receiver Receiver account ID
 * @param pvtKeyHex Private key in hex format
 * @param amount Amount to transfer
 * @param tokenContractId Optional token contract ID. If provided, executes a token transfer instead of NEAR transfer
 */
async function executeTransfer(
  publicKeyHex: string,
  sender: string,
  receiver: string,
  pvtKeyHex: string,
  amount: string,
  tokenContractId?: string
) {
  const config = {
    networkId: 'mainnet',
    nodeUrl: 'https://rpc.mainnet.near.org',
    keyStore: new keyStores.InMemoryKeyStore(),
  };

  console.log(`Sender: ${sender}`);
  console.log(`Receiver: ${receiver}`);
  console.log(`Amount: ${amount} ${tokenContractId ? 'tokens' : 'yoctoNEAR'}`);
  if (tokenContractId) console.log(`Token Contract: ${tokenContractId}`);

  const near = await connect(config);
  const { provider } = near.connection;

  try {
    // Determine if this is a token transfer or a native NEAR transfer
    let tx;
    if (tokenContractId) {
      // Token transfer (NEP-141)
      console.log('Executing token transfer...');
      tx = await buildTokenTransferTx(
        sender,
        receiver,
        tokenContractId,
        amount,
        publicKeyHex,
        near
      );
    } else {
      // Native NEAR transfer
      console.log('Executing NEAR transfer...');
      tx = await buildUnsignedTx(sender, receiver, amount, publicKeyHex, near);
    }

    // Sign the transaction
    const txnMessage = sha256(tx.encode());
    const { signature } = await sign(txnMessage, pvtKeyHex);

    // Broadcast the transaction
    console.log('Broadcasting transaction...');
    const broadcastResult = await broadcastTx(tx, signature, provider);
    console.log('Transaction broadcast complete. Result:', broadcastResult);

    const txHash =
      typeof broadcastResult === 'string'
        ? broadcastResult
        : broadcastResult.transaction?.hash;

    if (!txHash) {
      console.error(
        'Failed to get transaction hash from result:',
        broadcastResult
      );
      return;
    }

    console.log('Transaction hash for status checking:', txHash);

    // Wait for transaction to complete
    console.log('Waiting for transaction to complete...');
    try {
      const finalResult = await waitForTransaction(
        txHash,
        provider,
        sender,
        20,
        2000
      );
      console.log('Transaction final status:', finalResult.status);

      if (finalResult.status && finalResult.status.SuccessValue !== undefined) {
        console.log('Transaction completed successfully!');
      } else if (finalResult.status && finalResult.status.Failure) {
        console.log('Transaction failed:', finalResult.status.Failure);
      }
    } catch (error) {
      console.error('Error while waiting for transaction:', error);
    }
  } catch (error) {
    console.error('Error during transaction process:', error);
  }
}

async function waitForTransaction(
  txHash: string,
  provider: any,
  accountId: string,
  maxAttempts: number = 10,
  interval: number = 1000
): Promise<any> {
  let attempts = 0;

  const formattedHash = txHash.startsWith('0x') ? txHash.substring(2) : txHash;

  console.log(`Waiting for transaction with hash: ${formattedHash}`);

  while (attempts < maxAttempts) {
    try {
      console.log(
        `Checking transaction status (attempt ${
          attempts + 1
        }/${maxAttempts})...`
      );

      const status = await provider.txStatus(formattedHash, accountId);

      console.log(
        'Transaction status response:',
        JSON.stringify(status, null, 2)
      );

      if (status.status) {
        if (status.status.SuccessValue !== undefined) {
          console.log('Transaction succeeded!');
          return status;
        }
        if (status.status.Failure) {
          console.error('Transaction failed:', status.status.Failure);
          return status;
        }
      }
    } catch (error: any) {
      console.error('Error checking transaction:', error);
    }

    // Wait before next attempt
    await new Promise((resolve) => setTimeout(resolve, interval));
    attempts++;
  }

  throw new Error(`Transaction did not complete after ${maxAttempts} attempts`);
}

/**
 * Build an unsigned transaction for transferring NEP-141 tokens (like USDC, USDT, etc.)
 * @param senderId Account ID of the sender
 * @param receiverId Account ID of the receiver
 * @param tokenContractId Contract ID of the token (e.g., "usdt.near")
 * @param amount Amount of tokens to send (in the token's smallest unit)
 * @param publicKeyHex Hex public key of the sender
 * @param near NEAR connection object
 * @param memo Optional memo to include with the transfer
 * @returns Unsigned transaction object
 */
async function buildTokenTransferTx(
  senderId: string,
  receiverId: string,
  tokenContractId: string,
  amount: string,
  publicKeyHex: string,
  near: any
) {
  console.log('Building token transfer transaction...');
  console.log('Token contract:', tokenContractId);
  console.log('Amount:', amount);

  const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
  const publicKeyBase58 = bs58.encode(publicKeyBytes);

  const publicKey = PublicKey.fromString(`ed25519:${publicKeyBase58}`);

  const { provider } = near.connection;

  const nonce = await getLatestNonce(senderId, publicKey, provider);
  const { hash } = (await provider.block({ finality: 'final' })).header;

  // Prepare arguments for the ft_transfer function
  const ftTransferArgs = {
    receiver_id: receiverId,
    amount,
  };

  // Create function call action
  const actions = [
    transactions.functionCall(
      'ft_transfer', // Method name
      Buffer.from(JSON.stringify(ftTransferArgs)), // Arguments as buffer
      BigInt(200000000000000), // Gas (200 TGas)
      BigInt(1) // Deposit (1 yoctoNEAR required for ft_transfer)
    ),
  ];

  // The receiver of this transaction is the token contract
  return transactions.createTransaction(
    senderId,
    publicKey,
    tokenContractId, // Token contract is the receiver
    nonce, // Using latest nonce from network
    actions,
    bs58.decode(hash)
  );
}

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 4) {
    console.log(
      'Usage: npx ts-node src/index.ts <sender> <receiver> <privateKeyHex> <amount> [tokenContractId]'
    );
    console.log(
      'Example: npx ts-node src/index.ts 8fa58e9a13ee47fb74106d565f6c500f6f5b881a7085adc443800204a63f21a1 receiver.testnet xxx 1000000'
    );
    process.exit(1);
  }

  const [sender, receiver, pvtKeyHex, amount, tokenContractId] =
    args;

  executeTransfer(
    sender,
    sender,
    receiver,
    pvtKeyHex,
    amount,
    tokenContractId
  ).catch((error) => {
    console.error('Error executing transfer:', error);
    process.exit(1);
  });
} else {
  // Export the function for use as a module
  module.exports = { executeTransfer };
}
