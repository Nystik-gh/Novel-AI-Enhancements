const getImageDataUrl = (url) =>
    new Promise((resolve, reject) => {
        // Convert Google Drive URLs to direct download links
        const googleDriveRegex = /https:\/\/drive\.google\.com\/file\/d\/([^/]+)\/view/
        const match = url.match(googleDriveRegex)
        if (match) {
            const fileId = match[1]
            url = `https://drive.usercontent.google.com/download?id=${fileId}`
        }

        // Prefix the URL key with 'naie_inline_image_'
        const prefixedUrl = `naie_inline_image_${url}`

        // Check if the data URL is already stored using GM_getValue with the prefixed key
        const cachedDataUrl = GM_getValue(prefixedUrl)
        if (cachedDataUrl) {
            // Return the cached data URL if available
            resolve(cachedDataUrl)
            return
        }

        // Use GM_xmlhttpRequest to download the image
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            responseType: 'arraybuffer', // We will work with the binary data
            onload: (response) => {
                if (response.status === 200) {
                    // Create a Blob from the response array buffer
                    const arrayBufferView = new Uint8Array(response.response)
                    const blob = new Blob([arrayBufferView], { type: 'image/png' })

                    // Convert the Blob to a Data URL
                    const reader = new FileReader()
                    reader.onloadend = () => {
                        const dataUrl = reader.result

                        // Store the data URL using GM_setValue with the prefixed key
                        GM_setValue(prefixedUrl, dataUrl)

                        // Resolve with the data URL
                        resolve(dataUrl)
                    }
                    reader.onerror = () => reject('Failed to convert image to data URL')
                    reader.readAsDataURL(blob)
                } else {
                    reject(`Failed to load image from URL: ${url}`)
                }
            },
            onerror: (err) => {
                reject(`Failed to download image: ${err}`)
            },
        })
    })

const createImageContainer = async (url, width = 200, y = 0, alignment = 'left') => {
    const container = document.createElement('div')
    container.className = 'naie-image-container'
    container.style.width = `${width}px`
    container.style.top = `${y}px`
    container.dataset.alignment = alignment
    container.dataset.url = url
    container.dataset.id = crypto.randomUUID()

    const editor = document.querySelector('.ProseMirror')
    if (editor) {
        const position = calculatePosition(alignment, width, editor.getBoundingClientRect().width)
        Object.assign(container.style, position)
    }

    const img = document.createElement('img')
    img.draggable = false

    try {
        // Wait for the image data URL to be loaded
        const dataUrl = await getImageDataUrl(url)
        img.src = dataUrl
    } catch (error) {
        console.error('Failed to load image:', error)
        img.src = url // Fallback to direct URL if data URL fails
    }

    const removeButton = document.createElement('div')
    removeButton.className = 'naie-image-remove'
    removeButton.innerHTML = '×'
    removeButton.onclick = async (e) => {
        e.stopPropagation()

        await storyImagesState.removeImageFromStory(currentStoryId, container.dataset.id)

        container.remove()
        triggerSave()
    }

    container.append(img, removeButton)

    // Return a promise that resolves when the image is loaded
    return new Promise((resolve, reject) => {
        img.onload = () => resolve(container)
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    })
}

const addImageToLayer = async (url, width = 200, y = 0, alignment = 'left', startLocked = false) => {
    const imageLayer = document.querySelector('.naie-image-layer')
    if (!imageLayer) {
        console.error('Image layer not found')
        return null
    }

    try {
        // Wait for the container with loaded image
        const container = await createImageContainer(url, width, y, alignment)
        imageLayer.appendChild(container)
        initializeImageControls(container, startLocked)
        return container
    } catch (error) {
        console.error('Failed to add image to layer:', error)
        return null
    }
}
