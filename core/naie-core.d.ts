interface NAIE {
    HOOKS
    SETTINGS
    MISC
    DOM
    NAI
    EXTENSIONS
}

/**
 * An interface defining common utility functions for NAIE
 *
 * @interface
 */
interface DOMUtils {
    /**
     * Waits for an element to appear in the DOM.
     *
     * @param {string} selector - The CSS selector of the element to wait for.
     * @param {number} timeout - The maximum time to wait for the element in milliseconds.
     * @param {HTMLElement} [rootElement=document.body] - The element to observe for mutations. Defaults to document.body.
     * @returns {Promise<HTMLElement|null>} A promise that resolves with the element if found, or null if not found within the timeout.
     */
    waitForElement(selector: string, timeout: number, rootElement?: HTMLElement): Promise<HTMLElement | null>

    /**
     * Creates a new HTML element with the specified tag and applies the given styles.
     *
     * @param {string} tag - The tag name for the element (e.g., 'div', 'span').
     * @param {Object} [styles={}] - An object containing CSS properties and values to apply to the element.
     * @returns {HTMLElement} The newly created HTML element with applied styles.
     */
    createElement(tag: string, styles?: Record<string, string>): HTMLElement

    /**
     * Finds elements with a mask image that includes all specified URL substrings.
     *
     * @param {HTMLElement[]} elements - An array of elements to search.
     * @param {string[]} urlSubstrings - An array of substrings to check for in the mask-image property.
     * @returns {HTMLElement[]} An array of elements that match the criteria.
     */
    findElementWithMaskImage(elements: HTMLElement[], urlSubstrings: string[]): HTMLElement[]

    /**
     * Sets the value of an input element using native value setter methods.
     *
     * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} element - The input element to set the value for.
     * @param {string|number} value - The value to set on the input element.
     */
    setNativeValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string | number): void

    /**
     * Simulates a click event on the specified element.
     *
     * @param {HTMLElement} element - The element on which to simulate the click event.
     */
    simulateClick(element: HTMLElement): void

    /**
     * Simulates a right-click (context menu) event on the specified element.
     *
     * @param {HTMLElement} element - The element on which to simulate the right-click event.
     */
    simulateRightClick(element: HTMLElement): void

    /**
     * Simulates an input event on the specified element.
     *
     * @param {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} element - The element on which to simulate the input event.
     */
    simulateInputEvent(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void
}

interface NAIUtils {}

interface Window {
    NAIE_INSTANCE: NAIE
}
