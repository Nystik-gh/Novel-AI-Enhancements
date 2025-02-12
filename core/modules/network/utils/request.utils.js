/**
 * Extracts fetch options from a request object
 *
 * @param {Request} request - The request to extract options from
 * @returns {Object} The fetch options
 */
const network_getFetchOptions = (request) => {
    return {
        method: request.method,
        headers: request.headers,
        body: request.body,
        timeout: request.timeout,
        credentials: request.withCredentials ? 'include' : 'same-origin',
    }
}
