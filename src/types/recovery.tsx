export interface FileHeader {
  orgId: string;
  index0: string;
  index1: string;
  passwordHash: string;
  publicKey: string;
}

export interface FileLine {
  vaultName: string;
  chain: string;
  address: string;
  signatureScheme: string;
  encryptedKeyShare0Xi: string;
  encryptedKeyShare0ShareID: string;
  encryptedKeyShare1Xi: string;
  encryptedKeyShare1ShareID: string;
  publicKeyHex?: string;
}
