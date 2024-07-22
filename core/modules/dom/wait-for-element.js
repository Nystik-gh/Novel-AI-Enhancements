/**
 * Waits for an element to appear in the DOM.
 *
 * @param {string} selector - The CSS selector of the element to wait for.
 * @param {number} timeout - The maximum time to wait for the element in milliseconds.
 * @param {HTMLElement} [rootElement=document.body] - The element to observe for mutations. Defaults to document.body.
 * @returns {Promise<HTMLElement|null>} A promise that resolves with the element if found, or null if not found within the timeout.
 */
const dom_waitForElement = (selector, timeout, rootElement = document.body) => {
    const getElement = () => document.querySelector(selector)

    return new Promise((resolve) => {
        const element = getElement()
        if (element) {
            resolve(element)
        } else {
            const observer = new MutationObserver((mutationsList, observer) => {
                const element = getElement()
                if (element) {
                    observer.disconnect()
                    resolve(element)
                }
            })

            observer.observe(rootElement, { childList: true, subtree: true, attributes: true })

            if (timeout) {
                setTimeout(() => {
                    observer.disconnect()
                    const element = getElement()
                    resolve(element || null)
                }, timeout)
            }
        }
    })
}
