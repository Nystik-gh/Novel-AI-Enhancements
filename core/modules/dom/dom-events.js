const dom_onClickOutside = (element, callback, oneShot = false) => {
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

const dom_addEventListenerOnce = (element, event, handler) => {
    const flag = `listenerAdded_${event}_${handler.name}`

    if (!element.dataset[flag]) {
        element.addEventListener(event, handler)

        element.dataset[flag] = 'true'
    }
}
