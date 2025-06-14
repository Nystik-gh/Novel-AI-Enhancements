// Lorebook module for handling image operations

/**
 * Gets the image store entry from a decrypted lorebook
 * @param {Lorebook} lorebook - The decrypted lorebook
 * @returns {LoreEntry|undefined} The image store entry if found
 */
const findImageStoreEntry = (lorebook) => {
    return lorebook.entries?.find((e) => e.displayName === NAIE_IMAGE_STORE_ENTRY_NAME)
}

/**
 * Gets or creates the NAIE data category and image store entry
 * @param {Lorebook} lorebook - The decrypted lorebook
 * @returns {LoreEntry} The category and entry
 */
const getOrCreateImageStore = (lorebook) => {
    // Find or create the category
    let dataCategory = lorebook.categories?.find((c) => c.name.includes(NAIE_DATA_LB_CATEGORY_NAME))
    if (!dataCategory) {
        dataCategory = createLorebookCategory()
        lorebook.categories = lorebook.categories || []
        lorebook.categories.push(dataCategory)
    }

    // Find or create the entry
    let imageStore = lorebook.entries?.find((e) => e.displayName === NAIE_IMAGE_STORE_ENTRY_NAME)
    if (!imageStore) {
        imageStore = createLorebookImageStore(dataCategory.id)
        lorebook.entries = lorebook.entries || []
        lorebook.entries.push(imageStore)
    }

    return imageStore
}

/**
 * Loads images from a lorebook entry
 * @param {EntityWrapper} entityWrapper - The wrapped lorebook entry
 * @returns {Promise<StoryImageMeta>} Object containing array of image records
 */
const loadImagesFromLorebook = async (entityWrapper) => {
    try {
        /** @type {StoryContent} */
        let decrypted = await NAIE.CRYPTO.decompressDecryptObject(entityWrapper)

        const imageStore = findImageStoreEntry(decrypted.lorebook)
        if (!imageStore) {
            return { images: [] }
        }

        try {
            return JSON.parse(imageStore.text)
        } catch (e) {
            console.error('Failed to parse image store data:', e)
            return { images: [] }
        }
    } catch (error) {
        console.error('Failed to load images from lorebook:', error)
        throw error
    }
}

/**
 * Updates the lorebook images
 * @param {StoryContent} decrypted - The decrypted lorebook content
 * @param {StoryImageMeta} imageMeta - The image metadata to save
 * @returns {StoryContent} The updated lorebook content
 */
const updateLorebookImages = (decrypted, imageMeta) => {
    // If there are no images, remove any existing image store
    if (!imageMeta.images?.length) {
        const existingStore = findImageStoreEntry(decrypted.lorebook)
        if (existingStore) {
            decrypted.lorebook.entries = decrypted.lorebook.entries.filter((e) => e.displayName !== NAIE_IMAGE_STORE_ENTRY_NAME)
        }
    } else {
        // Only create/update image store if we have images
        const imageStore = getOrCreateImageStore(decrypted.lorebook)
        imageStore.text = JSON.stringify(imageMeta)
    }
    return decrypted
}

/**
 * Saves images to a lorebook entry
 * @param {EntityWrapper} entityWrapper - The wrapped lorebook entry
 * @param {StoryImageMeta} imageMeta - The image metadata to save
 * @returns {Promise<EntityWrapper>} The updated lorebook entry
 */
const saveImagesToLorebook = async (entityWrapper, imageMeta) => {
    try {
        /** @type {StoryContent} */
        let decrypted = await NAIE.CRYPTO.decompressDecryptObject(entityWrapper)

        decrypted = updateLorebookImages(decrypted, imageMeta)

        // Encrypt the modified entry
        //console.log('modified content', decrypted)
        const encrypted = await NAIE.CRYPTO.encryptCompressObject({ ...entityWrapper, data: decrypted })
        return {
            ...entityWrapper,
            data: encrypted,
        }
    } catch (error) {
        console.error('Failed to save images to lorebook:', error)
        throw error
    }
}
