// Track which images are currently being loaded
const loadingImages = new Set()

const loadImagesFromState = async () => {
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

                // Get the target paragraph position
                const proseMirror = document.querySelector('.ProseMirror')
                const paragraphs = proseMirror.querySelectorAll('p')
                const targetParagraph = paragraphs[imageData.anchorIndex]

                console.log('targetParagraph', targetParagraph, imageData.anchorIndex)

                if (!targetParagraph) {
                    console.error('Target paragraph not found for image:', imageData.id)
                    return null
                }

                const paragraphRect = targetParagraph.getBoundingClientRect()
                const editorRect = proseMirror.getBoundingClientRect()
                const scrollTop = proseMirror.scrollTop

                // Calculate position relative to the editor's top, accounting for scroll
                const relativeTop = paragraphRect.top - editorRect.top + scrollTop
                const absoluteOffset = relativeTop + (imageData.offset || 0)

                console.log('paragraphRect', paragraphRect)
                console.log('editorRect', editorRect)
                console.log('scrollTop', scrollTop)
                console.log('absoluteOffset', absoluteOffset)

                // Create container with calculated absolute position
                const container = await createImageContainer(imageData.url, imageData.width, absoluteOffset, imageData.align)

                // Override the generated ID with the stored one
                container.dataset.id = imageData.id

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
