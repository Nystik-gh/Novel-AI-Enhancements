/**
 * Simulates a click event on the specified element.
 *
 * @param {HTMLElement} element - The element on which to simulate the click event.
 */
const dom_simulateClick = (element) => {
    if (element) {
        element.click()
    }
}

/**
 * Simulates a right-click (context menu) event on the specified element.
 *
 * @param {HTMLElement} element - The element on which to simulate the right-click event.
 */
const dom_simulateRightClick = (element) => {
    const evt = new Event('contextmenu', { bubbles: true, cancelable: false })
    element.dispatchEvent(evt)
}

/**
 * Simulates an input event on the specified element.
 *
 * @param {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} element - The element on which to simulate the input event.
 */
const dom_simulateInputEvent = (element) => {
    element.dispatchEvent(new Event('input', { bubbles: true }))
}
