// Predicate for identifying shelf settings modals
const isShelfSettingsModal = ({ modal }) => {
    const title = modal.querySelector('input')
    const description = modal.querySelector('textarea')
    console.log("isShelfSettingsModal", title, description)
    return title && description
}

// Handle shelf settings modal event
const handleShelfSettingsModal = ({ modal, overlay }) => {
    const fields = {
        title: modal.querySelector('input'),
        description: modal.querySelector('textarea')
    }
    constructShelfSettingModal({ modal, overlay, fields })
}

// Wait for a shelf settings modal to appear
const waitForShelfSettingsModal = async (timeout) => {
    const { waitForSpecificModal } = NAIE.SERVICES.modalObserver
    const modalData = await waitForSpecificModal(isShelfSettingsModal, timeout)
    
    return {
        ...modalData,
        fields: {
            title: modalData.modal.querySelector('input'),
            description: modalData.modal.querySelector('textarea')
        }
    }
}

// Construct the shelf settings modal UI
const constructShelfSettingModal = ({ fields: { title, description }, modal, ...rest }) => {
    const cleanMetadata = (text) => {
        return writeMetadata(text, {})
    }

    const restoreMetadata = (text, metadata) => {
        return writeMetadata(text, metadata)
    }

    modal.setAttribute('data-proxied', true)

    // Clone the original textarea
    const clonedTextarea = description.cloneNode(true)

    // Hide the original textarea
    description.style.display = 'none'

    // Insert the cloned textarea into the DOM
    description.parentNode.insertBefore(clonedTextarea, description.nextSibling)

    const descriptionMetadata = parseMetadata(description.value)

    const updateNativeTextbox = (text) => {
        NAIE.DOM.setNativeValue(description, restoreMetadata(text, descriptionMetadata))
        NAIE.DOM.simulateInputEvent(description)
    }

    // Initialize the cloned textarea with sanitized content
    clonedTextarea.value = cleanMetadata(description.value)

    // Add an event listener to proxy the input
    clonedTextarea.addEventListener('input', (event) => {
        // Update the original textarea with unsanitized value
        updateNativeTextbox(event.target.value)
    })

    // insert a dropdown with shelves
    const shelfPickerTitle = getTitleHeader(title, 'Parent shelf')
    const selectableShelves = shelfState
        .getNonDescendants(descriptionMetadata.shelf_id)
        .map((s) => ({ title: s.data.title, value: s.meta }))
        .sort((a, b) => a.title.localeCompare(b.title))

    selectableShelves.unshift({ title: 'No shelf', value: 'noshelf' })
    const selectedValue =
        descriptionMetadata.parent_id && shelfState?.getMap()?.has(descriptionMetadata.parent_id)
            ? descriptionMetadata.parent_id
            : 'noshelf'
    const dropdown = NAIE.EXTENSIONS.Controls.Select.constructSelectControl(selectableShelves, selectedValue, (value) => {
        if (value === 'noshelf') {
            delete descriptionMetadata.parent_id
        } else {
            descriptionMetadata.parent_id = value
        }

        updateNativeTextbox(clonedTextarea.value)
    })
    insertShelfPicker(title, shelfPickerTitle, dropdown)

    return { ...rest, modal, fields: { title, description: clonedTextarea, rawDescription: description } }
}

// Helper functions for shelf settings modal
const getTitleHeader = (titleInputElement, newTitle) => {
    const clone = titleInputElement.previousSibling.cloneNode(true)
    clone.textContent = newTitle
    return clone
}

const insertShelfPicker = (textarea, title, dropdown) => {
    textarea.parentNode.insertBefore(dropdown, textarea.nextSibling)
    textarea.parentNode.insertBefore(title, dropdown)
}
