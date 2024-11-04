import JSZip from 'jszip';

export const hexStringToUint8Array = (hexString: string) => {
  // convert a hex string to a Uint8Array
  if (hexString.length % 2 !== 0) {
    throw new Error('Invalid hexString');
  }
  const byteArray = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    byteArray[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
  }
  return byteArray;
};

export const uint8ArrayToBigInt = (uintArray: Uint8Array): BigInt => {
  let result = BigInt(0);
  for (let i = 0; i < uintArray.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    result = (result << BigInt(8)) + BigInt(uintArray[i]);
  }
  return result;
};

export const hexStringToArrayBuffer = (hexString: string) => {
  // convert a hex string to an ArrayBuffer
  const byteArray = hexStringToUint8Array(hexString);
  return byteArray.buffer;
};

export const arrayBufferToHexString = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

export const readZipFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (loadEvent) => {
      try {
        const zip = new JSZip();
        if (!loadEvent?.target?.result) {
          throw new Error('Invalid file format. Unable to read file');
        }
        const content = await zip.loadAsync(loadEvent?.target?.result);
        const fileName = Object.keys(content.files)[0];
        const fileData = await content.files[fileName].async('string');
        resolve(fileData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (errorEvent) => {
      reject(errorEvent);
    };

    reader.readAsArrayBuffer(file);
  });

export const hashPassphrase = async (passphrase: string) => {
  // compute the SHA-256 hash of the passphrase and return it as a hex string
  const encoder = new TextEncoder();
  const data = encoder.encode(passphrase);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

export function bigIntToHex(bigIntStr: string) {
  // convert a bigInt string to a 64-byte hex string
  const bigInt = BigInt(bigIntStr);
  let hex = bigInt.toString(16);
  if (hex.length < 64) {
    hex = hex.padStart(64, '0');
  }
  return hex;
}
