/**
 * Get the decryption token from localStorage
 * @returns {string}
 */
const getDecryptToken = () => {
    const sessionData = JSON.parse(localStorage.getItem("session"));
    return sessionData.encryption_key;
}
