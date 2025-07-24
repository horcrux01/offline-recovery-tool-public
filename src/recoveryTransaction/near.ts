import { connect, keyStores, transactions } from 'near-api-js';
import { PublicKey } from 'near-api-js/lib/utils';
import { KeyType } from 'near-api-js/lib/utils/key_pair';
import { sha256 } from 'js-sha256';
import bs58 from 'bs58';
import { eddsaSign } from './signature';


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
 * Convert NEAR to yoctoNEAR
 * 1 NEAR = 10^24 yoctoNEAR
 * @param nearAmount String representation of NEAR amount (e.g. "1.5")
 * @returns String representation of the amount in yoctoNEAR
 */
function convertNearToYocto(nearAmount: string): string {
  // Convert to a decimal number first
  const nearDecimal = parseFloat(nearAmount);
  if (isNaN(nearDecimal)) {
    throw new Error(`Invalid NEAR amount: ${nearAmount}`);
  }

  // Multiply by 10^24 to get yoctoNEAR
  const yoctoNearDecimal = nearDecimal * 1e24;

  // Convert to a string without scientific notation
  return yoctoNearDecimal.toLocaleString('fullwide', { useGrouping: false });
}

/**
 * Get token metadata from the contract
 * @param tokenContractId The token contract ID
 * @param provider NEAR provider instance
 * @returns Token metadata including name, symbol, and decimals
 */
async function getTokenMetadata(
  tokenContractId: string,
  provider: any
): Promise<any> {
  try {
    console.log(`Fetching token metadata for ${tokenContractId}...`);

    // Call the ft_metadata view function on the token contract
    const result = await provider.query({
      request_type: 'call_function',
      account_id: tokenContractId,
      method_name: 'ft_metadata',
      args_base64: Buffer.from(JSON.stringify({})).toString('base64'),
      finality: 'optimistic',
    });

    // Decode the result
    if (result && result.result) {
      const metadata = JSON.parse(Buffer.from(result.result).toString());
      console.log(`Token metadata for ${tokenContractId}:`, metadata);
      return metadata;
    }

    throw new Error(`Failed to get metadata for ${tokenContractId}`);
  } catch (error) {
    console.error(`Error fetching token metadata:`, error);
    throw error;
  }
}

/**
 * Convert human-readable token amount to token base units based on decimals
 * @param amount Human-readable amount (e.g., "10.5")
 * @param decimals Number of decimal places for the token
 * @returns Amount in token base units
 */
function convertToTokenBaseUnits(amount: string, decimals: number): string {
  // Convert to a decimal number first
  const decimalAmount = parseFloat(amount);
  if (isNaN(decimalAmount)) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  // Multiply by 10^decimals to get the amount in token base units
  const baseUnitAmount = decimalAmount * 10 ** decimals;

  // Convert to a string without scientific notation
  return baseUnitAmount.toLocaleString('fullwide', { useGrouping: false });
}

/**
 * Execute a transfer of NEAR or tokens
 * @param publicKeyHex Public key in hex format
 * @param sender Sender account ID
 * @param receiver Receiver account ID
 * @param pvtKeyHex Private key in hex format
 * @param amount Amount to transfer (in NEAR for native transfers, or token units for token transfers)
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

  const near = await connect(config);
  const { provider } = near.connection;

  let amountToSend = amount;

  // For native NEAR transfers, convert from NEAR to yoctoNEAR
  if (!tokenContractId) {
    amountToSend = convertNearToYocto(amount);
    console.log(`Amount: ${amount} NEAR (${amountToSend} yoctoNEAR)`);
  } else {
    // For token transfers, get the metadata to find out decimals
    try {
      const metadata = await getTokenMetadata(tokenContractId, provider);
      const decimals = metadata.decimals || 0;

      // Convert the amount to token base units
      amountToSend = convertToTokenBaseUnits(amount, decimals);
      console.log(`Decimals: ${decimals}`);
      console.log(
        `Amount: ${amount} ${metadata.symbol} (${amountToSend} base units)`
      );
    } catch (error) {
      console.error(
        `Failed to get token metadata. Assuming raw units for amount ${amount}.`
      );
      amountToSend = amount; // Fallback to using the raw amount
    }
  }

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
        amountToSend, // Use the converted amount
        publicKeyHex,
        near
      );
    } else {
      // Native NEAR transfer (using the converted yoctoNEAR amount)
      console.log('Executing NEAR transfer...');
      console.log('amountToSend', amountToSend);
      tx = await buildUnsignedTx(
        sender,
        receiver,
        amountToSend,
        publicKeyHex,
        near
      );
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
      'Example for NEAR transfer: npx ts-node src/index.ts sender.near receiver.near privateKeyHex 1.5'
    );
    console.log(
      'Example for token transfer: npx ts-node src/index.ts sender.near receiver.near privateKeyHex 10 usdc.near'
    );
    process.exit(1);
  }

  const [sender, receiver, pvtKeyHex, amount, tokenContractId] = args;

  // Extract public key from private key (first parameter should be publicKeyHex)
  // For this simplified version, we'll just use the sender as both the publicKeyHex and first parameter
  executeTransfer(
    sender, // This should be publicKeyHex, but we're using sender as a placeholder
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
