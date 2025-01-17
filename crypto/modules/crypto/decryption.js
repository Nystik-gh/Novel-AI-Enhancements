const decryptObject = async (obj) => {
    const sodium = CRYPTO_UTILS.sodiumInstance

    const key = keystoreState.getKey(obj.meta)
    const data = Uint8Array.from(atob(obj.data), (c) => c.charCodeAt(0))

    const nonce = data.slice(0, sodium.crypto_secretbox_NONCEBYTES)
    const encrypted = data.slice(sodium.crypto_secretbox_NONCEBYTES)

    const decrypted = sodium.crypto_secretbox_open_easy(encrypted, nonce, new Uint8Array(key))

    return JSON.parse(new TextDecoder().decode(decrypted))
}

const decompressDecryptObject = async (obj) => {
    const sodium = CRYPTO_UTILS.sodiumInstance

    const key = keystoreState.getKey(obj.meta)
    const data = Uint8Array.from(atob(obj.data), (c) => c.charCodeAt(0))

    // Skip first 16 bytes (compression prefix)
    const encrypted = data.slice(16)
    const nonce = encrypted.slice(0, sodium.crypto_secretbox_NONCEBYTES)
    const ciphertext = encrypted.slice(sodium.crypto_secretbox_NONCEBYTES)

    const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, new Uint8Array(key))

    // Decompress using pako
    const decompressed = pako.inflate(decrypted, {
        windowBits: -15,
        to: 'string',
    })

    return {
        ...JSON.parse(decompressed),
        nonce: nonce,
    }
}
