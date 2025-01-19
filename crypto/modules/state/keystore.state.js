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
        console.log('keys', keys)
        return keys[keyId]
    }

    return {
        getKeystore,
        setKeystore,
        getKey,
    }
}
