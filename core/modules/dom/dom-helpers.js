const dom_createElement = (tag, styles = {}) => {
    const element = document.createElement(tag)
    Object.assign(element.style, styles)
    return element
}

const dom_findElementWithMaskImage = (elements, urlSubstrings) => {
    return [...elements].filter((element) => {
        if (!element) return false

        const computedStyle = window.getComputedStyle(element)
        const maskImageValue = computedStyle.getPropertyValue('mask-image') || computedStyle.getPropertyValue('-webkit-mask-image')

        return maskImageValue && urlSubstrings.every((sub) => maskImageValue.includes(sub))
    })
}

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
