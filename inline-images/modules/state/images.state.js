/** @returns {StoryImageState} */
const createStoryImageState = () => {
    const storyImageMap = new Map()

    const getMap = () => storyImageMap

    const getStoryImages = (storyId) => {
        return storyImageMap.get(storyId) || { images: [] }
    }

    /**
     * @param {string} storyId
     */
    const deleteStoryImages = (storyId) => {
        if (!storyImageMap.has(storyId)) {
            return
        }
        storyImageMap.delete(storyId)
    }

    const addImageToStory = (storyId, imageData) => {
        if (!storyImageMap.has(storyId)) {
            storyImageMap.set(storyId, { images: [imageData] })
            return
        }
        const currentMeta = storyImageMap.get(storyId)
        storyImageMap.set(storyId, {
            images: [...currentMeta.images, imageData],
        })
    }

    const removeImageFromStory = (storyId, imageId) => {
        if (!storyImageMap.has(storyId)) {
            return
        }

        const currentMeta = storyImageMap.get(storyId)
        storyImageMap.set(storyId, {
            images: currentMeta.images.filter((img) => img.id !== imageId),
        })
    }

    const updateImageInStory = (storyId, imageId, newImageData) => {
        if (!storyImageMap.has(storyId)) {
            return
        }

        const currentMeta = storyImageMap.get(storyId)
        storyImageMap.set(storyId, {
            images: currentMeta.images.map((img) => {
                if (img.id === imageId) {
                    return { ...img, ...newImageData }
                }
                return img
            }),
        })
    }

    return {
        getMap,
        getStoryImages,
        deleteStoryImages,
        addImageToStory,
        removeImageFromStory,
        updateImageInStory,
    }
}
