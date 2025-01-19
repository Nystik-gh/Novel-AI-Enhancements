// ==UserScript==
// @name         NAIE Crypto
// @namespace    https://github.com/Nystik-gh/Novel-AI-Enhancements
// @version      1.0.0
// @description  Cryptography functions
// @author       Nystik
// @run-at       document-start
// ==/UserScript==
'use strict'
;(() => {
    let scriptInit = false
    const wRef = unsafeWindow ? unsafeWindow : window

    /** @type {NAIE} */
    let NAIE = wRef.NAIE_INSTANCE

    const init = async () => {
        if (NAIE) {
            console.log('initialize network hooks')
            initializeNetworkHooks()
            NAIE.CRYPTO = await initNAIECrypto()
        } else {
            console.warn('NAIE not initialized')
        }

        scriptInit = true
    }

/* ########### decryption.js ########### */

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


/* -------- end of decryption.js ------- */


/* ########### encryption.js ########### */

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


/* -------- end of encryption.js ------- */


/* ########### sodium.init.js ########## */

const sodiumUrl = 'https://raw.githubusercontent.com/jedisct1/libsodium.js/refs/heads/master/dist/browsers-sumo/sodium.js'

const initSodium = async () => {
    return new Promise((resolve, reject) => {
        unsafeWindow.sodium = {
            onload: function (sodium) {
                console.log('sodium loaded', sodium)
                resolve(sodium)
            },
        }

        GM_xmlhttpRequest({
            method: 'GET',
            url: sodiumUrl,
            onload: function (response) {
                const script = document.createElement('script')
                script.textContent = response.responseText
                document.head.appendChild(script)
            },
            onerror: function (error) {
                console.error('Failed to load script:', error)
                reject(error)
            },
        })
    })
}


/* ------- end of sodium.init.js ------- */


/* ####### put.keystore.hooks.js ####### */

const registerKeystoreHooks = () => {
    console.log('registerKeystoreHooks')
    NAIE.NETWORK.manager.registerHook({
        id: 'keystore-put',
        priority: 10,
        urlPattern: '/user/keystore',
        methods: ['PUT'],
        modifyRequest: async (request) => {
            console.log('intercept keystore put (update keystore)')

            const options = NAIE.NETWORK.getFetchOptions(request)

            /** @type {UserKeystore} */
            const keystore = JSON.parse(options.body)

            keystoreState.setKeystore(keystore)

            return {
                type: 'request',
                value: request,
            }
        },
        modifyResponse: async (response, request) => {
            console.log('intercept keystore put (update keystore)')

            try {
                const copy = response.clone()

                /** @type {UserKeystore} */
                let keystore = await copy.json()

                keystoreState.setKeystore(keystore)

                return response
            } catch (e) {
                return response
            }
        },
    })
}


/* ---- end of put.keystore.hooks.js --- */


/* ######### get.user.hooks.js ######### */

const registerUserDataHooks = () => {
    console.log('registerUserDataHooks')
    NAIE.NETWORK.manager.registerHook({
        id: 'user-data-get',
        priority: 10,
        urlPattern: '/user/data',
        methods: ['GET'],
        modifyResponse: async (response, request) => {
            console.log('intercept data get (here we grab initial keystore)')
            const copy = response.clone()

            /** @type {UserData} */
            let data = await copy.json()

            const keystore = data.keystore

            keystoreState.setKeystore(keystore)

            const modifiedData = data

            return response
        },
    })
}


/* ------ end of get.user.hooks.js ----- */


/* ######### keystore.state.js ######### */

/** @returns {KeystoreState} */
const createKeystoreState = () => {
    /** @type {UserKeystore} */
    let keystoreData = {
        keystore: '',
        changeIndex: 0,
    }

    const getKeystore = () => keystoreData

    const setKeystore = (newKeystore) => {
        keystoreData = newKeystore
    }

    const getKey = async (keyId) => {
        const keys = await decryptKeyStore(keystoreData.keystore)
        return keys[keyId]
    }

    return {
        getKeystore,
        setKeystore,
        getKey,
    }
}


/* ------ end of keystore.state.js ----- */


/* ########## crypto.utils.js ########## */

/**
 * Get the decryption token from localStorage
 * @returns {string}
 */
const getDecryptToken = () => {
    const sessionData = JSON.parse(localStorage.getItem("session"));
    return sessionData.encryption_key;
}


/* ------- end of crypto.utils.js ------ */


/* ########### crypto.mod.js ########### */

/** @type {KeystoreState} */
let keystoreState = null

/** @type {NAIECrypto} */
const CRYPTO_UTILS = {
    sodiumInstance: null,
    decryptObject,
    decompressDecryptObject,
    encryptObject,
    encryptCompressObject,
}

const initNAIECrypto = async () => {
    keystoreState = createKeystoreState()
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


/* -------- end of crypto.mod.js ------- */


/* ########### network.mod.js ########## */

const initializeNetworkHooks = () => {
    console.log('initializeNetworkHooks')
    registerUserDataHooks()
    registerKeystoreHooks()
}


/* ------- end of network.mod.js ------- */



    init()
})()

