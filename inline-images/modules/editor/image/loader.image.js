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
    const loadPromises = storyImages.images.map(async (imageData) => {
        const container = await createImageContainer(imageData.url, imageData.width, imageData.offset, imageData.align)

        // Override the generated ID with the stored one
        container.dataset.id = imageData.id

        // Append to image layer and set to locked mode
        imageLayer.appendChild(container)
        setContainerMode(container, 'locked')
        return container
    })

    // Fire and forget loading - will trigger effect when all images are loaded
    Promise.all(loadPromises)
        .then((containers) => {
            console.log('All images loaded successfully:', containers.length)
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
