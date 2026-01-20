import { Actor, SignIdentity, Signature, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { Ed25519PublicKey } from '@dfinity/identity';
import { createAgent } from '@dfinity/utils';
import { LedgerCanister } from '@dfinity/ledger-icp';
import { eddsaSign } from './signature';

const TOKEN_CANISTERS: Record<string, string> = {
  icp: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
  ckbtc: 'mxzaz-hqaaa-aaaar-qaada-cai',
  cketh: 'ss2fx-dyaaa-aaaar-qacoq-cai',
  ckusdc: 'xevnm-gaaaa-aaaar-qafnq-cai',
  ckusdt: 'cngnf-vqaaa-aaaar-qag4q-cai',
};

class CustomSignerIdentity extends SignIdentity {
  private publicKey: Ed25519PublicKey;
  private privateKeyBytes: Uint8Array;

  constructor(privateKeyBytes: Uint8Array, publicKeyBytes: Uint8Array) {
    super();
    this.privateKeyBytes = privateKeyBytes;
    this.publicKey = Ed25519PublicKey.fromRaw(publicKeyBytes);
  }

  getPublicKey(): Ed25519PublicKey {
    return this.publicKey;
  }

  async sign(challenge: Uint8Array): Promise<Signature> {
    const pvtKey = BigInt(`0x${Buffer.from(this.privateKeyBytes).toString('hex')}`);
    const sig = await eddsaSign(pvtKey, challenge);
    Object.defineProperty(sig, '__signature__', { enumerable: false, value: undefined });
    return sig as Signature;
  }
}

const ED25519_DER_PREFIX = '302a300506032b6570032100';

function parseKeys(privateKeyHex: string, publicKeyHex: string) {
  const normHex = (h: string) => h.startsWith('0x') ? h.slice(2) : h;
  
  // Private key: 32 or 64 bytes
  const pvtBytes = Buffer.from(normHex(privateKeyHex), 'hex');
  const privateKeyBytes = pvtBytes.length === 64 ? pvtBytes.subarray(0, 32) : pvtBytes;
  if (privateKeyBytes.length !== 32) throw new Error(`Invalid private key length: ${pvtBytes.length}`);

  // Public key: DER-encoded, extract raw 32 bytes
  const pubNorm = normHex(publicKeyHex).toLowerCase();
  if (!pubNorm.startsWith(ED25519_DER_PREFIX)) throw new Error('Invalid public key: expected DER-encoded');
  const publicKeyBytes = Buffer.from(pubNorm.slice(ED25519_DER_PREFIX.length), 'hex');
  if (publicKeyBytes.length !== 32) throw new Error('Invalid public key: expected 32 bytes after DER prefix');

  return { privateKeyBytes, publicKeyBytes };
}

const icrc1FeeIdl = ({ IDL }: any) => IDL.Service({
  icrc1_fee: IDL.Func([], [IDL.Nat], ['query']),
});

async function getIcrc1Fee(agent: HttpAgent, canisterId: string): Promise<bigint> {
  const actor = Actor.createActor(icrc1FeeIdl, { agent, canisterId: Principal.fromText(canisterId) });
  return (await actor.icrc1_fee()) as bigint;
}

export async function transferICP(
  destinationPrincipal: string,
  privateKeyHex: string,
  publicKeyHex: string,
  amount: number,
  ledgerCanisterId: string,
  host: string = 'https://ic0.app'
): Promise<bigint> {
  const { privateKeyBytes, publicKeyBytes } = parseKeys(privateKeyHex, publicKeyHex);
  const identity = new CustomSignerIdentity(privateKeyBytes, publicKeyBytes);

  const agent = await createAgent({ identity, host, retryTimes: 3, verifyQuerySignatures: true });
  const ledger = LedgerCanister.create({ agent, canisterId: Principal.fromText(ledgerCanisterId) });

  const fee = await getIcrc1Fee(agent as HttpAgent, ledgerCanisterId);
  const amountE8s = BigInt(Math.floor(amount * 1e8));

  console.log(`Executing transfer (fee: ${fee})...`);
  const blockIndex = await ledger.icrc1Transfer({
    to: { owner: Principal.fromText(destinationPrincipal), subaccount: [] },
    amount: amountE8s,
    fee,
  });

  console.log(`Transfer sent at block index: ${blockIndex}`);
  return blockIndex;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 5) {
    console.log('Usage: npx tsx src/recoveryTransaction/icp.ts <destPrincipal> <pvtKeyHex> <pubKeyHex> <amount> <token>');
    process.exit(1);
  }

  const [dest, pvtKey, pubKey, amount, token] = args;
  const canisterId = TOKEN_CANISTERS[token.toLowerCase()];
  if (!canisterId) {
    console.error(`Invalid token: ${token}. Supported: ${Object.keys(TOKEN_CANISTERS).join(', ')}`);
    process.exit(1);
  }

  transferICP(dest, pvtKey, pubKey, Number(amount), canisterId);
} else {
  module.exports = { transferICP };
}
