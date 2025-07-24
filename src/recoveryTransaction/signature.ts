import { bytesToNumberLE, concatBytes, numberToBytesLE } from '@noble/curves/abstract/utils';
import { randomBytes } from 'crypto';

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
  
  