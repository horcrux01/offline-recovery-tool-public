const powMod = (base: bigint, exponent: bigint, modulus: bigint): bigint => {
  if (modulus === BigInt(1)) return BigInt(0);
  let currentBase = base % modulus;
  let currentExponent = exponent;
  let result = BigInt(1);
  currentBase %= modulus;
  while (currentExponent > 0) {
    if (currentExponent % BigInt(2) === BigInt(1)) {
      result = (result * currentBase) % modulus;
    }
    // eslint-disable-next-line
    currentExponent >>= BigInt(1);
    currentBase = (currentBase * currentBase) % modulus;
  }
  return result;
};

const primeModInverse = (x: bigint, p: bigint) => powMod(x, p - BigInt(2), p);

export const computeLagrangeCoefficient = (
  curShareId: bigint,
  shareIds: bigint[],
  field: bigint
): bigint => {
  let lCoefficient: bigint = BigInt(1);
  shareIds.forEach((shareId) => {
    if (shareId === curShareId) {
      return;
    }
    let temp: bigint = primeModInverse((shareId - curShareId) % field, field);
    temp = (temp * shareId) % field;
    lCoefficient *= temp;
  });
  return lCoefficient;
};

const computePrivateKey = (
  xiInts: bigint[],
  shareIdInts: bigint[],
  field: bigint
): bigint => {
  let finalPrivKey: bigint = BigInt(0);
  for (let i = 0; i < xiInts.length; i += 1) {
    const coefficient: bigint = computeLagrangeCoefficient(
      shareIdInts[i],
      shareIdInts,
      field
    );
    finalPrivKey += xiInts[i] * coefficient;
    finalPrivKey %= field;
  }
  return finalPrivKey;
};

const reCreatePrivateKey = (
  xiInts: bigint[],
  shareIdInts: bigint[],
  signatureScheme: string
): bigint => {
  let field: bigint;
  if (signatureScheme === 'MPC_ECDSA') {
    field = BigInt(
      '115792089237316195423570985008687907852837564279074904382605163141518161494337'
    );
  } else if (signatureScheme === 'MPC_EDDSA') {
    field = BigInt(
      '7237005577332262213973186563042994240857116359379907606001950938285454250989'
    );
  } else {
    throw new Error('Invalid signature scheme');
  }
  return computePrivateKey(xiInts, shareIdInts, field);
};

export const reCreatePrivateKeyFromKeyShares = (keySharesData: string[]) => {
  const xiInts: bigint[] = [];
  const shareIdInts: bigint[] = [];
  let signatureSchemeData: string;
  keySharesData.forEach((share) => {
    const { signatureScheme, xi, shareId } = JSON.parse(share);
    signatureSchemeData = signatureScheme;
    xiInts.push(BigInt(xi));
    shareIdInts.push(BigInt(shareId));
  });
  return reCreatePrivateKey(xiInts, shareIdInts, signatureSchemeData);
};
