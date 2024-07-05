const waitForShelfSettingsModal = async (timeout) => {
    console.log('waitForShelfSettingsModal')
    let { modal, overlay, closeButton } = await waitForModal(timeout)

    const title = modal.querySelector('input')
    const description = modal.querySelector('textarea')

    // Check if title or description is null
    if (!title || !description) {
        throw new Error('Title or description is null')
    }

    return { modal, overlay, closeButton, fields: { title, description } }
}

const constructShelfSettingModal = ({ fields: { title, description }, modal, ...rest }) => {
    console.log('constructShelfSettingModal')
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

    // Insert the cloned textarea into the DOM, right after the original one
    description.parentNode.insertBefore(clonedTextarea, description.nextSibling)

    const descriptionMetadata = parseMetadata(description.value)

    // Initialize the cloned textarea with sanitized content
    clonedTextarea.value = cleanMetadata(description.value)

    // Add an event listener to proxy the input
    clonedTextarea.addEventListener('input', (event) => {
        // Update the original textarea with unsanitized value
        setNativeValue(description, restoreMetadata(event.target.value, descriptionMetadata))
        simulateInputEvent(description)
    })

    // Return the modified fields with proxied description
    return { ...rest, modal, fields: { title, description: clonedTextarea, rawDescription: description } }
}
