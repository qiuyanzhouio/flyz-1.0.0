import { decrypt, encrypt } from 'crypto-js/aes'
import UTF8, { parse } from 'crypto-js/enc-utf8'
import pkcs7 from 'crypto-js/pad-pkcs7'
import ECB from 'crypto-js/mode-ecb'
import md5 from 'crypto-js/md5'
import Base64 from 'crypto-js/enc-base64'
import Hex from 'crypto-js/enc-hex'

const cipherKey = 'EY8WePvjM5GGwQzn' // 加密key

export class AesEncryption {
  constructor(opt) {
    const { key = cipherKey, iv, useHex } = opt
    if (key) {
      this.key = parse(key)
    }
    if (iv) {
      this.iv = parse(iv)
    }
    if (useHex) {
      this.useHex = !!useHex
    }
  }

  get getOptions() {
    return {
      mode: ECB,
      padding: pkcs7,
      iv: this.iv,
    }
  }

  encryptByAES(cipherText) {
    const result = encrypt(cipherText, this.key, this.getOptions).toString()
    return this.useHex ? Hex.stringify(Base64.parse(result)) : result
  }

  decryptByAES(cipherText) {
    const realCipherText = this.useHex ? Base64.stringify(Hex.parse(cipherText)) : cipherText
    return decrypt(realCipherText, this.key, this.getOptions).toString(UTF8)
  }
}

export function encryptByBase64(cipherText) {
  return UTF8.parse(cipherText).toString(Base64)
}

export function decodeByBase64(cipherText) {
  return Base64.parse(cipherText).toString(UTF8)
}

export function encryptByMd5(password) {
  return md5(password).toString()
}
