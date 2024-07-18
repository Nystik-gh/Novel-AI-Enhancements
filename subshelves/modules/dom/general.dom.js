const simulateClick = (element) => {
    if (element) {
        element.click()
    }
}

const simulateRightClick = (element) => {
    const evt = new Event('contextmenu', { bubbles: true, cancelable: false })
    element.dispatchEvent(evt)
}

const simulateInputEvent = (element) => {
    element.dispatchEvent(new Event('input', { bubbles: true }))
}

const createElement = (tag, styles = {}) => {
    const element = document.createElement(tag)
    Object.assign(element.style, styles)
    return element
}

const waitForElement = (selector, timeout) => {
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

            observer.observe(document.body, { childList: true, subtree: true, attributes: true })

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

const sleep = async (duration) => {
    await waitForElement('nullelement', duration)
}

const addEventListenerOnce = (element, event, handler) => {
    const flag = `listenerAdded_${event}_${handler.name}`

    if (!element.dataset[flag]) {
        element.addEventListener(event, handler)

        element.dataset[flag] = 'true'
    }
}

const OnClickOutside = (element, callback, oneShot = false) => {
    const outsideClickListener = (event) => {
        if (!event.composedPath().includes(element)) {
            if (oneShot) {
                removeClickListener()
            }
            callback()
        }
    }

    const removeClickListener = () => {
        document.removeEventListener('click', outsideClickListener)
    }

    document.addEventListener('click', outsideClickListener)

    // Return a handle to manually remove the listener
    return { remove: removeClickListener }
}

// not used, remove?
const removeEventListener = (element, event, handler) => {
    const flag = `listenerAdded_${event}_${handler.name}`

    if (element.dataset[flag]) {
        element.dataset[flag] = false
    }
}

const findTitleBar = () => {
    // Find the button with aria-label="Open Sort Settings"
    const sortSettingsButton = document.querySelector(filterButtonSelector)

    // manually traverse dom to expected home button
    const titleBarCandidate = sortSettingsButton?.parentNode?.parentNode

    if (titleBarCandidate && titleBarCandidate.tagName === 'DIV') {
        return titleBarCandidate
    }

    return null
}

const findElementWithMaskImage = (elements, urlSubstrings) => {
    const results = [...elements].filter((e) => {
        const computedStyle = e ? window.getComputedStyle(e) : null
        const maskImageValue = computedStyle ? computedStyle.getPropertyValue('mask-image') : null
        const finalMaskImageValue = maskImageValue || (computedStyle ? computedStyle.getPropertyValue('-webkit-mask-image') : null)

        return finalMaskImageValue && urlSubstrings.every((sub) => finalMaskImageValue.includes(sub))
    })
    return results
}

const setNativeValue = (element, value) => {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set
    const prototype = Object.getPrototypeOf(element)
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set

    if (valueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value)
    } else {
        valueSetter.call(element, value)
    }
}
