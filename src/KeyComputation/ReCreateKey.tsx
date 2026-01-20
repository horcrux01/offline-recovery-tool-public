import { hashPassphrase } from './utils';
import { decryptDataUsingBIP39 } from './Decryption';
import { reCreatePrivateKeyFromKeyShares } from './ComputePrivateKey';
import { FileHeader, FileLine } from '../types/recovery';

const parseFileContent = async (fileContent: string) => {
  const fileLines = fileContent.split('\n');
  const lines: Object[] = [];
  // eslint-disable-next-line
  fileLines.map((line) => {
    lines.push(JSON.parse(line));
  });
  return lines;
};

export const validateFileContentData = (fileLine: Object) => {
  const keys = [
    'vaultName',
    'chain',
    'address',
    'signatureScheme',
    'encryptedKeyShare0Xi',
    'encryptedKeyShare0ShareID',
    'encryptedKeyShare1Xi',
    'encryptedKeyShare1ShareID',
  ];
  for (let i = 0; i < keys.length; i += 1) {
    if (!Object.keys(fileLine).includes(keys[i])) {
      return false;
    }
  }
  return true;
};

export const validateFileHeaderData = (fileLine: Object) => {
  const keys = ['orgId', 'index0', 'index1', 'passwordHash', 'publicKey'];
  for (let i = 0; i < keys.length; i += 1) {
    if (!Object.keys(fileLine).includes(keys[i])) {
      return false;
    }
  }
  return true;
};

export const validateFile = async (
  fileContent: string,
  password: string,
  setValidatePasswordErrors: any,
  setValidateFileErrors: any,
  key: any
) => {
  let fileLines;
  try {
    fileLines = await parseFileContent(fileContent);
  } catch (e) {
    setValidateFileErrors((prevErrors: any) => ({
      ...prevErrors,
      [key]: 'Invalid file format. Content invalid',
    }));
    return false;
  }

  const headers: FileHeader = fileLines[0];
  if (!validateFileHeaderData(headers)) {
    setValidateFileErrors((prevErrors: any) => ({
      ...prevErrors,
      [key]: 'Invalid file format. Headers invalid',
    }));
    return false;
  }

  const storedPassphraseHash = headers.passwordHash;
  const computedPassphraseHash = await hashPassphrase(password);
  if (storedPassphraseHash !== computedPassphraseHash) {
    setValidatePasswordErrors((prevErrors: any) => ({
      ...prevErrors,
      [key]: 'Invalid password',
    }));
  }

  for (let i = 1; i < fileLines.length; i += 1) {
    try {
      if (!validateFileContentData(fileLines[i])) {
        setValidateFileErrors((prevErrors: any) => ({
          ...prevErrors,
          [key]: 'Invalid file format. Content invalid',
        }));
      }
    } catch (e) {
      setValidateFileErrors((prevErrors: any) => ({
        ...prevErrors,
        [key]: 'Invalid file format. Content invalid',
      }));
    }
  }

  return true;
};

export const reCreateKeys = async (
  fileContents: string[],
  passwords: string[],
  setRecreateError: (err: string) => void
) => {
  const keyToMetaDataDict: { [key: string]: string[] } = {};
  const allKeySharesPromises = fileContents.map(async (content, index) => {
    const fileLines: FileLine[] = await parseFileContent(content);
    const decryptedKeySharesData: { [key: string]: string[] } = {};
    for (let i = 1; i < fileLines.length; i += 1) {
      const {
        vaultName,
        chain,
        address,
        signatureScheme,
        encryptedKeyShare0Xi,
        encryptedKeyShare0ShareID,
        encryptedKeyShare1Xi,
        encryptedKeyShare1ShareID,
        publicKeyHex,
      } = fileLines[i];
      const key = `${vaultName}_${chain}_${address}`;
      keyToMetaDataDict[key] = [vaultName, chain, address, publicKeyHex || ''];
      // eslint-disable-next-line
      const sharesData = await Promise.all([
        decryptDataUsingBIP39(encryptedKeyShare0Xi, passwords[index]),
        decryptDataUsingBIP39(encryptedKeyShare0ShareID, passwords[index]),
        decryptDataUsingBIP39(encryptedKeyShare1Xi, passwords[index]),
        decryptDataUsingBIP39(encryptedKeyShare1ShareID, passwords[index]),
      ]);
      decryptedKeySharesData[key] = [
        JSON.stringify({
          signatureScheme,
          xi: sharesData[0].toString(),
          shareId: sharesData[1].toString(),
        }),
        JSON.stringify({
          signatureScheme,
          xi: sharesData[2].toString(),
          shareId: sharesData[3].toString(),
        }),
      ];
  } 
    return decryptedKeySharesData;
  });

  const resolvedKeySharesPromises = await Promise.all(allKeySharesPromises);
  const keyShares = resolvedKeySharesPromises.reduce((acc, current) => {
    Object.keys(current).forEach((key) => {
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key] = acc[key].concat(current[key]);
    });
    return acc;
  }, {});

  const finalPrivKeys = [];
  // eslint-disable-next-line
  for (const key in keyShares) {
    if (Object.hasOwnProperty.call(keyShares, key)) {
      const shares = keyShares[key];
      const uniqueShares = Array.from(new Set(shares));
      if (uniqueShares.length !== 3) {
        setRecreateError('Invalid key shares');
      }
      const finalPrivKey = reCreatePrivateKeyFromKeyShares(uniqueShares);
      finalPrivKeys.push(
        keyToMetaDataDict[key].concat(finalPrivKey.toString())
      );
    }
  }

  return finalPrivKeys;
};
