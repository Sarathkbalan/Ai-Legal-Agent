const crypto = require('crypto');

/**
 * 64-bit SimHash implementation for detecting near-duplicate legal documents.
 */
class SimHash {
  /**
   * Generates a 64-bit hash for a token string.
   */
  static hash64(str) {
    const md5 = crypto.createHash('md5').update(str).digest();
    // Use first 8 bytes for 64-bit representation (as BigInt)
    return md5.readBigUInt64BE(0);
  }

  /**
   * Tokenizes text into normalized word 3-grams.
   */
  static tokenize(text) {
    const clean = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = clean.split(' ').filter(w => w.length > 2);
    if (words.length < 3) return words;

    const shingles = [];
    for (let i = 0; i <= words.length - 3; i++) {
      shingles.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
    return shingles;
  }

  /**
   * Calculates the 64-bit SimHash hex string for a document.
   */
  static calculate(text) {
    const tokens = this.tokenize(text);
    if (!tokens.length) return '0000000000000000';

    const v = new Array(64).fill(0);

    for (const token of tokens) {
      const hash = this.hash64(token);
      for (let i = 0; i < 64; i++) {
        const bit = (hash >> BigInt(63 - i)) & 1n;
        v[i] += bit === 1n ? 1 : -1;
      }
    }

    let fingerprint = 0n;
    for (let i = 0; i < 64; i++) {
      if (v[i] > 0) {
        fingerprint |= 1n << BigInt(63 - i);
      }
    }

    return fingerprint.toString(16).padStart(16, '0');
  }

  /**
   * Computes Hamming distance between two 64-bit hex strings.
   */
  static hammingDistance(hex1, hex2) {
    const b1 = BigInt(`0x${hex1}`);
    const b2 = BigInt(`0x${hex2}`);
    let xor = b1 ^ b2;

    let distance = 0;
    while (xor > 0n) {
      distance += Number(xor & 1n);
      xor >>= 1n;
    }
    return distance;
  }

  /**
   * Returns similarity percentage between 0.0 and 1.0.
   */
  static similarity(hex1, hex2) {
    const distance = this.hammingDistance(hex1, hex2);
    return 1 - (distance / 64);
  }
}

module.exports = SimHash;
