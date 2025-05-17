// Track which images are currently being loaded
const loadingImages = new Set()

/**
 * Calculate absolute positions of an element relative to the editor
 * @param {HTMLElement} element - Element to calculate positions for
 * @param {DOMRect} editorRect - Editor's bounding client rect
 * @param {number} scrollTop - Editor's scroll top position
 * @returns {{top: number, bottom: number, left: number, right: number}} Absolute positions
 */
const calculateAbsolutePosition = (element, editorRect, scrollTop) => {
    const rect = element.getBoundingClientRect()
    return {
        top: rect.top - editorRect.top + scrollTop,
        bottom: rect.bottom - editorRect.top + scrollTop,
        left: rect.left - editorRect.left,
        right: rect.right - editorRect.right,
    }
}

const loadImagesFromState = async () => {
    console.log('loadImagesFromState')
    if (!currentStoryId) {
        console.log('No story ID available, skipping image load')
        return
    }

    const imageLayer = document.querySelector('.naie-image-layer')
    if (!imageLayer) {
        console.error('Image layer not found')
        return
    }

    const storyImages = await storyImagesState.getStoryImages(currentStoryId)
    if (!storyImages || !storyImages.images || storyImages.images.length === 0) {
        console.log('No images found for story', currentStoryId)
        return
    }

    // Clear existing images first
    imageLayer.querySelectorAll('.naie-image-container').forEach((container) => container.remove())

    await NAIE.MISC.sleep(100)

    // Get the target paragraph positions
    const proseMirror = document.querySelector('.ProseMirror')
    const paragraphs = proseMirror.querySelectorAll('p')
    const editorRect = proseMirror.getBoundingClientRect()
    const scrollTop = proseMirror.scrollTop

    // Clear existing position state
    paragraphPositionState.clear()

    // Store positions for all paragraphs
    /*paragraphs.forEach((paragraph, index) => {
        const rect = paragraph.getBoundingClientRect()
        const position = {
            top: rect.top - editorRect.top + scrollTop,
            bottom: rect.bottom - editorRect.top + scrollTop,
            left: rect.left - editorRect.left,
            right: rect.right - editorRect.left
        }
        paragraphPositionState.updatePosition(index, paragraph, index, position)
    })*/

    // Create array of promises for loading all images
    const loadPromises = storyImages.images
        .map(async (imageData) => {
            // Skip if this image is already being loaded
            if (loadingImages.has(imageData.id)) {
                console.log('Image already being loaded, skipping:', imageData.id)
                return null
            }

            // Mark this image as being loaded
            loadingImages.add(imageData.id)

            try {
                // Remove any existing instances of this image
                const existingContainer = imageLayer.querySelector(`.naie-image-container[data-id="${imageData.id}"]`)
                if (existingContainer) {
                    console.log('Removing existing instance of image:', imageData.id)
                    existingContainer.remove()
                }

                // Clamp anchorIndex to valid range
                let anchorIndex = imageData.anchorIndex
                if (anchorIndex < 0) anchorIndex = 0
                if (anchorIndex >= paragraphs.length) anchorIndex = paragraphs.length - 1

                const targetParagraph = paragraphs[anchorIndex]

                if (!targetParagraph) {
                    console.warn('Target paragraph not found:', anchorIndex)
                    return null
                }

                const position = calculateAbsolutePosition(targetParagraph, editorRect, scrollTop)
                paragraphPositionState.updatePosition(anchorIndex, targetParagraph, anchorIndex, position)
                const container = await createImageContainer(imageData.url, imageData.width, position.top, imageData.align)

                // Override the generated ID with the stored one
                container.dataset.id = imageData.id

                // Listen for position changes of the target paragraph
                paragraphPositionState.onKey('positionChanged', anchorIndex, (key, newState) => {
                    console.log('positionChanged', key, newState)
                    container.style.top = `${newState.position.top}px`
                })

                // Append to image layer and set to locked mode
                imageLayer.appendChild(container)
                setContainerMode(container, 'locked')

                return container
            } finally {
                // Always remove from loading set, even if there was an error
                loadingImages.delete(imageData.id)
            }
        })
        .filter(Boolean) // Filter out any null containers from failed loads

    // Fire and forget loading - will trigger effect when all images are loaded
    Promise.all(loadPromises)
        .then((containers) => {
            console.log('All images loaded successfully:', containers.length)
            handleParagraphStyling(document.querySelector('.ProseMirror'))
            // You can trigger additional actions here when all images are loaded
        })
        .catch((error) => {
            console.error('Failed to load some images:', error)
        })
}

// Function to handle story changes
const handleStoryChange = async () => {
    if (!currentStoryId) {
        console.log('No story ID available')
        return
    }

    // Wait for image layer to be ready
    await NAIE.DOM.waitForElement('.naie-image-layer', 1000)
    await loadImagesFromState()
}
