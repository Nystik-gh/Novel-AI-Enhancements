/**
 * Represents a single image record in a story
 */
interface ImageRecord {
    id: string,
    url: string,
    align: string,
    offset: number,
    width: number
    margin: number
}

/**
 * Metadata containing an array of images associated with a story
 */
interface StoryImageMeta {
    images: ImageRecord[]
}

/**
 * Interface for managing story image state operations
 */
interface StoryImageState {
    /**
     * Retrieves the complete map of story images
     * @returns Map of story IDs to their image metadata
     */
    getMap: () => Map<string, StoryImageMeta>

    /**
     * Gets image metadata for a specific story
     * @param storyId - ID of the story to retrieve images for
     * @returns Image metadata for the specified story
     */
    getStoryImages: (storyId: string) => StoryImageMeta

    /**
     * Sets image metadata for a specific story
     * @param storyId - ID of the story to set images for
     * @param imageMeta - Image metadata to set for the specified story
     */
    setStoryImages: (storyId: string, imageMeta: StoryImageMeta) => void

    /**
     * Deletes all images associated with a story
     * @param storyId - ID of the story to delete images from
     */
    deleteStoryImages: (storyId: string) => void

    /**
     * Adds a new image to a story
     * @param storyId - ID of the story to add the image to
     * @param imageData - Image record data to add
     */
    addImageToStory: (storyId: string, imageData: ImageRecord) => void

    /**
     * Removes an image from a story
     * @param storyId - ID of the story containing the image
     * @param imageId - ID of the image to remove
     */
    removeImageFromStory: (storyId: string, imageId: string) => void

    /**
     * Updates properties of an existing image in a story
     * @param storyId - ID of the story containing the image
     * @param imageId - ID of the image to update
     * @param newImageData - Partial image data containing properties to update
     */
    updateImageInStory: (storyId: string, imageId: string, newImageData: Partial<ImageRecord>) => void
}