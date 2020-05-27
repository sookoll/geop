
export function b64encode (str) {
  return base64EncArr(strToUTF8Arr(str))
}

/* Base64 string to array encoding */
function uint6ToB64 (nUint6) {
  return nUint6 < 26
    ? nUint6 + 65 : nUint6 < 52
      ? nUint6 + 71 : nUint6 < 62
        ? nUint6 - 4 : nUint6 === 62
          ? 43 : nUint6 === 63
            ? 47 : 65
}
function base64EncArr (aBytes) {
  let nMod3 = 2
  let sB64Enc = ''

  for (let nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
    nMod3 = nIdx % 3
    if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) {
      sB64Enc += '\r\n'
    }
    nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24)
    if (nMod3 === 2 || aBytes.length - nIdx === 1) {
      sB64Enc += String.fromCharCode(
        uint6ToB64(nUint24 >>> 18 & 63),
        uint6ToB64(nUint24 >>> 12 & 63),
        uint6ToB64(nUint24 >>> 6 & 63),
        uint6ToB64(nUint24 & 63)
      )
      nUint24 = 0
    }
  }
  return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) +
    (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==')
}
function strToUTF8Arr (sDOMStr) {
  let nChr; const nStrLen = sDOMStr.length
  let nArrLen = 0
  /* mapping... */
  for (let nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
    nChr = sDOMStr.charCodeAt(nMapIdx)
    nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6
  }
  const aBytes = new Uint8Array(nArrLen)
  /* transcription... */
  for (let nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
    nChr = sDOMStr.charCodeAt(nChrIdx)
    if (nChr < 128) {
      /* one byte */
      aBytes[nIdx++] = nChr
    } else if (nChr < 0x800) {
      /* two bytes */
      aBytes[nIdx++] = 192 + (nChr >>> 6)
      aBytes[nIdx++] = 128 + (nChr & 63)
    } else if (nChr < 0x10000) {
      /* three bytes */
      aBytes[nIdx++] = 224 + (nChr >>> 12)
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63)
      aBytes[nIdx++] = 128 + (nChr & 63)
    } else if (nChr < 0x200000) {
      /* four bytes */
      aBytes[nIdx++] = 240 + (nChr >>> 18)
      aBytes[nIdx++] = 128 + (nChr >>> 12 & 63)
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63)
      aBytes[nIdx++] = 128 + (nChr & 63)
    } else if (nChr < 0x4000000) {
      /* five bytes */
      aBytes[nIdx++] = 248 + (nChr >>> 24)
      aBytes[nIdx++] = 128 + (nChr >>> 18 & 63)
      aBytes[nIdx++] = 128 + (nChr >>> 12 & 63)
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63)
      aBytes[nIdx++] = 128 + (nChr & 63)
    } else /* if (nChr <= 0x7fffffff) */ {
      /* six bytes */
      aBytes[nIdx++] = 252 + /* (nChr >>> 32) is not possible in ECMAScript! So...: */ (nChr / 1073741824)
      aBytes[nIdx++] = 128 + (nChr >>> 24 & 63)
      aBytes[nIdx++] = 128 + (nChr >>> 18 & 63)
      aBytes[nIdx++] = 128 + (nChr >>> 12 & 63)
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63)
      aBytes[nIdx++] = 128 + (nChr & 63)
    }
  }
  return aBytes
}
