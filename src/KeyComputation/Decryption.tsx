import { entropyToMnemonic, mnemonicToSeedSync } from 'bip39';
import init, * as ecies from 'ecies-wasm';
import {
  hashPassphrase,
  hexStringToArrayBuffer,
  hexStringToUint8Array,
  uint8ArrayToBigInt,
} from './utils';
import { ENGLISH_WORD_LIST } from './wordList';

init();

export const deriveKey = async (
  password: string,
  saltHex: string,
  iterations = 100000
) => {
  // derive a key from the password and salt using PBKDF2 AES-GCM
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = hexStringToArrayBuffer(saltHex);
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations,
      hash: { name: 'SHA-256' },
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const exportedKey = await window.crypto.subtle.exportKey('raw', key);
  return new Uint8Array(exportedKey);
};

export const deriveKeyUsingBIP39 = async (passphrase: string) => {
  // compute SHA-256 hash of the passphrase
  const passphraseHash = await hashPassphrase(passphrase);
  const entropy = Buffer.from(passphraseHash, 'hex');
  const mnemonic = entropyToMnemonic(entropy, ENGLISH_WORD_LIST);
  return mnemonicToSeedSync(mnemonic);
};

export const decryptDataUsingBIP39 = async (
  encryptedDataHex: string,
  passphrase: string
) => {
  const privateKey = await deriveKeyUsingBIP39(passphrase);
  let privateKeyHex = privateKey.toString('hex').slice(0, 64);
  privateKeyHex = `${privateKeyHex}`;
  const encryptedData = hexStringToUint8Array(encryptedDataHex);
  const privateKeyUint8Array = hexStringToUint8Array(privateKeyHex);
  const decryptedData = ecies.decrypt(privateKeyUint8Array, encryptedData);
  return uint8ArrayToBigInt(decryptedData);
};

export const decryptData = async (
  encryptedDataHex: string,
  passphrase: string,
  saltHex: string
) => {
  // decrypt the encrypted data using the passphrase and salt
  const key = await deriveKey(passphrase, saltHex);
  const encryptedData = hexStringToArrayBuffer(encryptedDataHex);
  const iv = encryptedData.slice(0, 12);
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    cryptoKey,
    encryptedData.slice(12)
  );
  return new TextDecoder().decode(decryptedData);
};
