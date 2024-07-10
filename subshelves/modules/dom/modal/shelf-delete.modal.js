const waitForShelfDeleteModal = async (timeout) => {
    console.log('waitForShelfSettingsModal')
    let { modal, overlay } = await waitForModal(timeout)

    const buttons = modal.firstChild.lastChild.querySelectorAll('button')
    console.log('delete modal buttons', buttons, buttons.length)
    // Check if title or description is null
    if (buttons.length !== 1) {
        throw new Error('Not a delete modal')
    }

    const deleteButton = buttons[0]
    const closeButton = modal.querySelector('button[aria-label="Close Modal"]')

    return { modal, overlay, closeButton, deleteButton }
}

const OverlayClickListener = (overlay, modal, callback, oneShot = false) => {
    const outsideClickListener = (event) => {
        console.log('overlay listener', event.composedPath(), event.composedPath().includes(modal))
        if (!event.composedPath().includes(modal)) {
            if (oneShot) {
                removeClickListener()
            }
            callback()
        }
    }

    const removeClickListener = () => {
        console.log('removing outside listener')
        document.removeEventListener('click', outsideClickListener)
    }

    overlay.addEventListener('click', outsideClickListener)

    // Return a handle to manually remove the listener
    return { remove: removeClickListener }
}
