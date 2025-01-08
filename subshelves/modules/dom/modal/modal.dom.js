let shelfModalHandler = null

const setupShelfModalHandler = () => {
    if (shelfModalHandler) {
        return
    }

    // Get the modal observer from core
    const { emitter } = NAIE.NAI.initModalObserver()
    
    // Subscribe to modal events
    emitter.on('modal', handlePotentialShelfModal)
    shelfModalHandler = emitter
}

const handlePotentialShelfModal = async ({ modal, overlay }) => {
    // Skip if already handled
    if (modal.dataset['proxied']) {
        return
    }

    try {
        const modalData = await identifyShelfSettingsModal(modal, overlay)
        if (modalData) {
            constructShelfSettingModal(modalData)
        }
    } catch (error) {
        // Not a shelf settings modal, ignore
    }
}

const identifyShelfSettingsModal = async (modal, overlay) => {
    // Check if this is a shelf settings modal by looking for specific elements
    const descriptionField = modal.querySelector('textarea[placeholder*="description"]')
    if (!descriptionField) {
        return null
    }

    const titleField = modal.querySelector('input[placeholder*="title"]')
    if (!titleField) {
        return null
    }

    // If we found both fields, this is a shelf settings modal
    return {
        modal,
        overlay,
        fields: {
            title: titleField,
            description: descriptionField
        }
    }
}

// Helper function to create modal predicates
const isShelfSettingsModal = ({ modal }) => {
    const title = modal.querySelector('input[placeholder*="title"]')
    const description = modal.querySelector('textarea[placeholder*="description"]')
    return title && description
}

const isShelfDeleteModal = ({ modal }) => {
    const buttons = modal.firstChild?.lastChild?.querySelectorAll('button')
    return buttons?.length === 1 && modal.querySelector('button[aria-label="Close Modal"]')
}

// New wait functions using core modal observer
const waitForShelfSettingsModal = async (timeout) => {
    const { waitForSpecificModal } = NAIE.NAI.initModalObserver()
    const modalData = await waitForSpecificModal(isShelfSettingsModal, timeout)
    
    return {
        ...modalData,
        fields: {
            title: modalData.modal.querySelector('input'),
            description: modalData.modal.querySelector('textarea')
        }
    }
}

const waitForShelfDeleteModal = async (timeout) => {
    const { waitForSpecificModal } = NAIE.NAI.initModalObserver()
    const modalData = await waitForSpecificModal(isShelfDeleteModal, timeout)

    return {
        ...modalData,
        deleteButton: modalData.modal.firstChild.lastChild.querySelector('button'),
    }
}
