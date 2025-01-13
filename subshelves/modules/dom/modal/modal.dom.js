const initModalObserver = () => {
    // Get the modal observer from NAIE services and subscribe to modal events
    const { emitter } = NAIE.SERVICES.modalObserver
    emitter.on('modal', handlePotentialShelfModal)
}

const handlePotentialShelfModal = async ({ modal, overlay }) => {
    console.log("modal event triggered", modal, overlay)
    // Skip if already handled
    if (modal.dataset['proxied']) {
        return
    }

    try {
        // Try to handle as shelf settings modal
        if (isShelfSettingsModal({ modal })) {
            handleShelfSettingsModal({ modal, overlay })
            return
        }
    } catch (error) {
        console.error("Error handling shelf modal:", error)
        // Not a shelf settings modal, ignore
    }
}

// Helper for handling overlay clicks
const createOverlayClickListener = (overlay, modal, callback, oneShot = false) => {
    const outsideClickListener = (event) => {
        if (!event.composedPath().includes(modal)) {
            if (oneShot) {
                removeClickListener()
            }
            callback()
        }
    }

    const removeClickListener = () => {
        document.removeEventListener('click', outsideClickListener)
    }

    overlay.addEventListener('click', outsideClickListener)

    // Return a handle to manually remove the listener
    return { remove: removeClickListener }
}