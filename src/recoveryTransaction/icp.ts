import { Ed25519KeyIdentity } from '@dfinity/identity';
import { createAgent } from '@dfinity/utils';
import { LedgerCanister, AccountIdentifier } from '@dfinity/ledger-icp';

/**
 * Transfers ICP from the account controlled by `privateKeyHex` to a destination account.
 *
 * @param privateKeyHex       Hex‑encoded Ed25519 private key (64‑byte seed+pubkey).
 * @param destinationAccountHex  Hex string of the destination AccountIdentifier.
 * @param amount              Amount in whole ICP (e.g., 1.5 for 1.5 ICP).
 * @param host                URL of the IC host (defaults to mainnet).
 * @returns                   The block index of the submitted transaction.
 */
export async function transferICP(
  destinationAccountHex: string,
  privateKeyHex: string,
  amount: number,
  ledgerCanisterId: string = 'ryjl3-tyaaa-aaaaa-aaaba-cai',
  host: string = 'https://ic0.app',
): Promise<bigint> {
  // 1. Decode the hex private key into a Uint8Array
  const secretKey = Uint8Array.from(Buffer.from(privateKeyHex, 'hex'));
  // 2. Build an Ed25519 identity from that secret key
  const identity = Ed25519KeyIdentity.fromSecretKey(secretKey);
  
  const agent = await createAgent({ identity, host, retryTimes: 3, verifyQuerySignatures: true });
  
  const ledger = LedgerCanister.create({
    agent,
    canisterId: ledgerCanisterId,
  });
  
  const toAccount = AccountIdentifier.fromHex(destinationAccountHex);
  const fee = await ledger.transactionFee();
  const amountE8s = BigInt(Math.floor(amount * 1e8));
  
  const blockIndex = await ledger.transfer({
    to: toAccount,
    amount: amountE8s,
    fee,
    memo: 0n,
  });
  
  console.log(`Transfer sent at block index: ${blockIndex}`);
  return blockIndex;
}


if (require.main === module) {
    const args = process.argv.slice(2);
  
    if (args.length < 4) {
      console.log(
        'Usage: npx ts-node src/index.ts <receiver> <pvtKeyHex> <amount> <token>'
      );
      process.exit(1);
    }
  
    const [receiver, pvtKeyHex, amount, token] = args;
    let canisterId = 'ryjl3-tyaaa-aaaaa-aaaba-cai';
    if (token == 'ckbtc') {
      canisterId = 'mxzaz-hqaaa-aaaar-qaada-cai';
    }
  
    transferICP(
      receiver,
      pvtKeyHex,
      Number(amount),
      canisterId
    ).catch((error) => {
      console.error('Error executing transfer:', error);
      process.exit(1);
    });
  } else {
    module.exports = { transferICP };
  }
  