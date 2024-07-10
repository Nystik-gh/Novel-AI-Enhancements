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

    const updateNativeTextbox = (text) => {
        setNativeValue(description, restoreMetadata(text, descriptionMetadata))
        simulateInputEvent(description)
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
    const dropdown = constructSelectControl(selectableShelves, selectedValue, (value) => {
        console.log('old meta', { ...descriptionMetadata })
        if (value === 'noshelf') {
            delete descriptionMetadata.parent_id
        } else {
            descriptionMetadata.parent_id = value
        }
        console.log('new meta', descriptionMetadata)

        updateNativeTextbox(clonedTextarea.value)
    })
    insertShelfPicker(title, shelfPickerTitle, dropdown)

    // Return the modified fields with proxied description
    return { ...rest, modal, fields: { title, description: clonedTextarea, rawDescription: description } }
}

const getTitleHeader = (titleInputElement, newTitle) => {
    const clone = titleInputElement.previousSibling.cloneNode(true)
    clone.textContent = newTitle
    return clone
}

const insertShelfPicker = (textarea, title, dropdown) => {
    textarea.parentNode.insertBefore(dropdown, textarea.nextSibling)
    textarea.parentNode.insertBefore(title, dropdown)
}
