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

    const getAuthToken = () => {
        const sessionData = JSON.parse(localStorage.getItem('session'))
        return sessionData.auth_token
    }

    const fetchKeystoreManually = async () => {
        try {
            const authToken = getAuthToken()
            const response = await fetch(`${API_BASE_URL}/user/keystore`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch keystore')
            }

            const data = await response.json()
            if (data) {
                keystoreData = data
                return true
            }
            return false
        } catch (error) {
            console.error('Error fetching keystore:', error)
            return false
        }
    }

    const getKey = async (keyId) => {
        if (!keystoreData.keystore) {
            console.log('Keystore is empty, attempting to fetch manually')
            const success = await fetchKeystoreManually()
            if (!success) {
                throw new Error('Failed to fetch keystore')
            }
        }

        const keys = await decryptKeyStore(keystoreData.keystore)
        return keys[keyId]
    }

    return {
        getKeystore,
        setKeystore,
        getKey,
    }
}
