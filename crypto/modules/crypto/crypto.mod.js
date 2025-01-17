let keystoreState = null

/** @type {NAIECrypto} */
const CRYPTO_UTILS = {
    sodiumInstance: null,
    decryptObject,
    decompressDecryptObject,
    encryptObject,
    compressEncryptObject,
}

initNAIECrypto = async () => {
    keystoreState = createKeystoreState
    CRYPTO_UTILS.sodiumInstance = await initSodium()

    return CRYPTO_UTILS
}

async function decryptKeyStore(keystore) {
    const sodium = await CRYPTO_UTILS.sodiumInstance
    const decryptToken = getDecryptToken()

    const key = decryptToken.replace('=', '')

    const { sdata, nonce } = JSON.parse(atob(keystore))

    const encryptedData = new Uint8Array(sdata)
    const nonceArray = new Uint8Array(nonce)

    const derivedKey = sodium.crypto_generichash(32, key)

    const decrypted = sodium.crypto_secretbox_open_easy(encryptedData, nonceArray, derivedKey)

    return JSON.parse(new TextDecoder().decode(decrypted)).keys
}
