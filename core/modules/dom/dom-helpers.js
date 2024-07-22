/**
 * Creates a new HTML element with the specified tag and applies the given styles.
 *
 * @param {string} tag - The tag name for the element (e.g., 'div', 'span').
 * @param {Object} [styles={}] - An object containing CSS properties and values to apply to the element.
 * @returns {HTMLElement} The newly created HTML element with applied styles.
 */
const dom_createElement = (tag, styles = {}) => {
    const element = document.createElement(tag)
    Object.assign(element.style, styles)
    return element
}

/**
 * Finds elements with a mask image that includes all specified URL substrings.
 *
 * @param {HTMLElement[]} elements - An array of elements to search.
 * @param {string[]} urlSubstrings - An array of substrings to check for in the mask-image property.
 * @returns {HTMLElement[]} An array of elements that match the criteria.
 */
const dom_findElementWithMaskImage = (elements, urlSubstrings) => {
    return [...elements].filter((element) => {
        if (!element) return false

        const computedStyle = window.getComputedStyle(element)
        const maskImageValue = computedStyle.getPropertyValue('mask-image') || computedStyle.getPropertyValue('-webkit-mask-image')

        return maskImageValue && urlSubstrings.every((sub) => maskImageValue.includes(sub))
    })
}

/**
 * Sets the value of an input element using native value setter methods.
 *
 * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} element - The input element to set the value for.
 * @param {string|number} value - The value to set on the input element.
 */
const dom_setNativeValue = (element, value) => {
    const descriptor = Object.getOwnPropertyDescriptor(element, 'value')
    const valueSetter = descriptor ? descriptor.set : null

    if (!valueSetter) {
        throw new Error('No value setter found on element')
    }

    const prototype = Object.getPrototypeOf(element)
    const prototypeDescriptor = Object.getOwnPropertyDescriptor(prototype, 'value')
    const prototypeValueSetter = prototypeDescriptor ? prototypeDescriptor.set : null

    if (prototypeValueSetter && prototypeValueSetter !== valueSetter) {
        prototypeValueSetter.call(element, value)
    } else {
        valueSetter.call(element, value)
    }
}
