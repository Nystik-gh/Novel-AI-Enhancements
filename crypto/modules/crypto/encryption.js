const encryptObject = async (obj) => {
    const sodium = CRYPTO_UTILS.sodiumInstance

    const key = keystoreState.getKey(obj.meta)
    const nonce = sodium.crypto_generichash(24, sodium.from_string(obj.meta))

    const encrypted = sodium.crypto_secretbox_easy(sodium.from_string(JSON.stringify(obj.data)), nonce, new Uint8Array(key))

    const combined = new Uint8Array([...nonce, ...encrypted])
    return btoa(String.fromCharCode.apply(null, combined))
}

const encryptCompressObject = async (obj) => {
    const sodium = CRYPTO_UTILS.sodiumInstance

    const key = keystoreState.getKey(obj.meta)
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)

    // Convert data to string and compress
    const jsonString = JSON.stringify(obj.data)
    const compressed = pako.deflate(new TextEncoder().encode(jsonString), {
        windowBits: -15,
    })

    // Encrypt the compressed data
    const encrypted = sodium.crypto_secretbox_easy(compressed, nonce, new Uint8Array(key))

    // Add compression prefix
    const COMPRESSION_PREFIX = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])
    const finalData = new Uint8Array([...COMPRESSION_PREFIX, ...nonce, ...encrypted])

    return btoa(String.fromCharCode.apply(null, finalData))
}
