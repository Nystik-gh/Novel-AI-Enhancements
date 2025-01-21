// ==UserScript==
// @name         NAIE Inline Images
// @namespace    https://github.com/Nystik-gh/Novel-AI-Enhancements
// @version      0.1.0
// @description  Adds support for inline images in stories
// @author       Nystik
// @match        https://novelai.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=novelai.net
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/refs/heads/inline-images/core/dist/naie-core.user.js?version=9
// @require      https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/refs/heads/inline-images/crypto/dist/naie-crypto.user.js?version=5
// @require      https://unpkg.com/interactjs/dist/interact.min.js
// @run-at       document-start
// ==/UserScript==
'use strict'
// state vars
/** @type {StoryImageState} */
let storyImagesState = null
let currentStoryId = null

let scriptInit = false
const wRef = unsafeWindow ? unsafeWindow : window

/** @type {NAIEWithCrypto} */
let NAIE = wRef.NAIE_INSTANCE

// Initialize everything
const init = () => {
    currentStoryId = getStoryIdFromUrl()
    if (scriptInit) return

    initializeNetworkHooks()
    setupUrlChangeListener()

    document.addEventListener('DOMContentLoaded', async () => {
        if (scriptInit) return
        scriptInit = true
        try {
            NAIE.CORE.registerScript('inline-images')
            await registerPreflight()
            NAIE.CORE.markScriptReady('inline-images')
        } catch (e) {
            NAIE.LOGGING.getLogger().error(e)
            alert('Failed to initialize inline images script.\n\nDisable the script and report the issue.')
        }
    })
}

/* ############ align.svg.js ########### */

const centerAlignIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <path fill="currentColor" d="M136,40V216a8,8,0,0,1-16,0V40a8,8,0,0,1,16,0ZM69.65723,90.34277A8.00066,8.00066,0,0,0,56,96v24H16a8,8,0,0,0,0,16H56v24a8.00053,8.00053,0,0,0,13.65723,5.65723l32-32a8.00122,8.00122,0,0,0,0-11.31446ZM240,120H200V96a8.00066,8.00066,0,0,0-13.65723-5.65723l-32,32a8.00122,8.00122,0,0,0,0,11.31446l32,32A8.00066,8.00066,0,0,0,200,160V136h40a8,8,0,0,0,0-16Z"/>
</svg>
`

const leftAlignIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="67.248 31.9884 128.0116 192.0233">
  <path fill="currentColor" d="M 83.248 40 L 83.248 216 C 83.248 222.158 76.581 226.007 71.248 222.928 C 68.773 221.499 67.248 218.858 67.248 216 L 67.248 40 C 67.248 33.842 73.915 29.993 79.248 33.072 C 81.723 34.501 83.248 37.142 83.248 40 Z M 187.248 120 L 147.248 120 L 147.248 96 C 147.247 89.841 140.58 85.992 135.246 89.072 C 134.641 89.422 134.085 89.849 133.591 90.343 L 101.591 122.343 C 98.467 125.467 98.467 130.533 101.591 133.657 L 133.591 165.657 C 137.946 170.012 145.382 168.018 146.976 162.069 C 147.156 161.394 147.248 160.699 147.248 160 L 147.248 136 L 187.248 136 C 193.406 136 197.255 129.333 194.176 124 C 192.747 121.525 190.106 120 187.248 120 Z"/>
</svg>
`

const rightAlignIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="63.98 31.9884 128.0116 192.0233">
  <path fill="currentColor" d="M 79.98 216 L 79.98 40 C 79.98 33.842 73.313 29.993 67.98 33.072 C 65.505 34.501 63.98 37.142 63.98 40 L 63.98 216 C 63.98 222.158 70.647 226.007 75.98 222.928 C 78.455 221.499 79.98 218.858 79.98 216 Z M 183.98 136 L 143.98 136 L 143.98 160 C 143.979 166.159 137.312 170.008 131.978 166.928 C 131.373 166.578 130.817 166.151 130.323 165.657 L 98.323 133.657 C 95.199 130.533 95.199 125.467 98.323 122.343 L 130.323 90.343 C 134.678 85.988 142.114 87.982 143.708 93.931 C 143.888 94.606 143.98 95.301 143.98 96 L 143.98 120 L 183.98 120 C 190.138 120 193.987 126.667 190.908 132 C 189.479 134.475 186.838 136 183.98 136 Z" style="transform-origin: 127.986px 128px;" transform="matrix(-1, 0, 0, -1, 0.000003814275, 0.000003814698)"/>
</svg>
`


/* -------- end of align.svg.js -------- */


/* ############ image.svg.js ########### */

const getImageIconSvg = () => {
    // Define your SVG as a string
    const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 16 16" fill="none">
            <path fill-rule="evenodd" clip-rule="evenodd"
                d="M1 1H15V15H1V1ZM6 9L8 11L13 6V13H3V12L6 9ZM6.5 7C7.32843 7 8 6.32843 8 5.5C8 4.67157 7.32843 4 6.5 4C5.67157 4 5 4.67157 5 5.5C5 6.32843 5.67157 7 6.5 7Z"
                fill="#000000" />
        </svg>
    `

    // Create a data URL for the SVG
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`

    return svgDataUrl
}


/* -------- end of image.svg.js -------- */


/* ############ lock.svg.js ############ */

const lockIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path fill="currentColor" d="M52,24h-4v-8c0-8.836-7.164-16-16-16S16,7.164,16,16v8h-4c-2.211,0-4,1.789-4,4v32c0,2.211,1.789,4,4,4h40  c2.211,0,4-1.789,4-4V28C56,25.789,54.211,24,52,24z M32,48c-2.211,0-4-1.789-4-4s1.789-4,4-4s4,1.789,4,4S34.211,48,32,48z M40,24  H24v-8c0-4.418,3.582-8,8-8s8,3.582,8,8V24z"/>
</svg>
`


/* --------- end of lock.svg.js -------- */


/* ######### controls.image.js ######### */

const injectControlStyles = () => {
    if (document.querySelector('style[data-naie-control-styles]')) return

    const styleTag = document.createElement('style')
    styleTag.setAttribute('data-naie-control-styles', 'true')
    styleTag.innerHTML = `
        .naie-image-container {
            display: inline-block;
            position: absolute;
            min-width: 50px;
            min-height: 50px;
            cursor: move;
            z-index: 1;
            pointer-events: all;
        }


        .naie-image-container img {
            max-width: 100%;
            height: auto;
            display: block;
        }

        .naie-image-container .naie-image-remove {
            position: absolute;
            top: -8px;
            right: -8px;
            width: 16px;
            height: 16px;
            background: #4a4a4a;
            border-radius: 50%;
            display: none;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            cursor: pointer;
            z-index: 1;
        }

        .naie-image-container:not(.locked) .naie-image-remove {
            display: flex;
        }

        .naie-image-container.locked {
            cursor: default;
        }

        .naie-controls {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            padding: 8px;
        }

        .naie-image-container.locked .naie-controls {
            flex-direction: row-reverse;
            opacity: 0;
            transition: opacity 0.2s ease 300ms;
        }

        .naie-image-container.locked:hover .naie-controls {
            opacity: 1;
        }

        .naie-alignment-controls {
            display: flex;
            gap: 4px;
        }

        .naie-control-button {
            background: none;
            border: none;
            color: white;
            padding: 4px 8px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 24px;
        }

        .naie-control-button svg {
            width: 1rem;
            height: 1rem;
            display: block;
        }

        .naie-control-button[data-alignment="center"] svg {
            transform: scale(1.4);
        }

        .naie-control-button:hover {
            background: rgba(0,0,0,0.2);
        }

        .naie-control-button.active {
            background: rgba(0,0,0,0.5);
        }
    `
    document.head.appendChild(styleTag)
}

const createAlignmentButton = (alignment, isActive, onClick) => {
    const button = document.createElement('button')
    button.className = 'naie-control-button' + (isActive ? ' active' : '')
    button.dataset.alignment = alignment
    button.innerHTML = {
        left: leftAlignIcon,
        center: centerAlignIcon,
        right: rightAlignIcon,
    }[alignment]
    button.onclick = onClick
    return button
}

const createLockButton = (onClick) => {
    const button = document.createElement('button')
    button.className = 'naie-control-button lock'
    button.innerHTML = lockIcon
    button.onclick = onClick
    return button
}

const createControls = (container) => {
    const controls = document.createElement('div')
    controls.className = 'naie-controls'

    // Alignment controls group
    const alignmentControls = document.createElement('div')
    alignmentControls.className = 'naie-alignment-controls'

    const currentAlignment = container.dataset.alignment || 'left'

    // Create alignment buttons
    const alignments = ['left', 'center', 'right']
    alignments.forEach((alignment) => {
        const button = createAlignmentButton(alignment, alignment === currentAlignment, () => {
            // Update active state
            alignmentControls.querySelectorAll('.naie-control-button').forEach((btn) => {
                btn.classList.toggle('active', btn.dataset.alignment === alignment)
            })
            // Update container alignment
            container.dataset.alignment = alignment
            const position = calculatePosition(alignment, parseInt(container.style.width), container._parentWidth)
            Object.assign(container.style, position)
        })
        alignmentControls.appendChild(button)
    })

    // Lock button
    const lockButton = createLockButton(async () => {
        const { index, offset } = findNearestParagraph(container)

        const imageRecord = {
            id: container.dataset.id,
            url: container.dataset.url,
            align: container.dataset.alignment,
            anchorIndex: index,
            offset: offset,
            width: parseInt(container.style.width),
        }

        await storyImagesState.upsertImageInStory(currentStoryId, imageRecord.id, imageRecord)

        console.log('state', storyImagesState.getMap())
        setContainerMode(container, 'locked')
        triggerSave()
    })

    controls.append(alignmentControls, lockButton)
    return controls
}

const createEditButton = (container) => {
    const button = document.createElement('button')
    button.className = 'naie-control-button edit'
    button.innerHTML = '✎'
    button.onclick = () => setContainerMode(container, 'editing')
    return button
}

const setContainerMode = (container, mode) => {
    injectControlStyles()

    // Remove existing controls
    container.querySelectorAll('.naie-controls, .naie-control-button.edit').forEach((el) => el.remove())

    if (mode === 'editing') {
        container.classList.remove('locked')
        container.appendChild(createControls(container))
        setupImageInteractions(container)
    } else {
        // locked
        container.classList.add('locked')

        // Add edit button that shows on hover
        const controls = document.createElement('div')
        controls.className = 'naie-controls'
        controls.appendChild(createEditButton(container))
        container.appendChild(controls)

        // Remove interactions
        removeImageInteractions(container)
    }
}

// Find nearest paragraph and calculate relative offset
const findNearestParagraph = (container) => {
    const proseMirror = document.querySelector('.ProseMirror')
    const paragraphs = proseMirror.querySelectorAll('p')
    const imageRect = container.getBoundingClientRect()
    const imageTop = imageRect.top

    let nearestIndex = 0
    let nearestDistance = Infinity
    let nearestTop = 0

    paragraphs.forEach((p, i) => {
        const rect = p.getBoundingClientRect()
        const distance = Math.abs(rect.top - imageTop)
        if (distance < nearestDistance) {
            nearestDistance = distance
            nearestIndex = i
            nearestTop = rect.top
        }
    })

    // Calculate relative offset from the nearest paragraph
    const relativeOffset = imageTop - nearestTop

    return {
        index: nearestIndex,
        offset: Math.round(relativeOffset),
    }
}

// Initialize container with specified mode
const initializeImageControls = (container, startLocked = false) => {
    injectControlStyles()
    setContainerMode(container, startLocked ? 'locked' : 'editing')
}


/* ------ end of controls.image.js ----- */


/* ########## image.editor.js ########## */

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

const createImageContainer = async (url, width = 30, y = 0, alignment = 'left') => {
    const container = document.createElement('div')
    container.className = 'naie-image-container'
    container.style.width = `${width}%`  // Use percentage for width
    container.style.top = `${y}px`
    container.dataset.alignment = alignment
    container.dataset.url = url
    container.dataset.id = crypto.randomUUID()
    container.dataset.widthPercent = width.toString()

    const editor = document.querySelector('.ProseMirror')
    if (editor) {
        const editorWidth = editor.getBoundingClientRect().width
        const pixelWidth = (width / 100) * editorWidth
        const position = calculatePosition(alignment, pixelWidth, editorWidth)
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

const addImageToLayer = async (url, width = 30, y = 0, alignment = 'left', startLocked = false) => {
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


/* ------- end of image.editor.js ------ */


/* ####### interactions.image.js ####### */

const PADDING = 40 // Padding for the draggable area

const setupDraggable = (container) => {
    interact(container).draggable({
        inertia: true,
        lockAxis: 'y',
        listeners: {
            start(event) {
                const target = event.target
                const rect = target.getBoundingClientRect()
                const parentRect = document.querySelector('.ProseMirror').getBoundingClientRect()
                target._dragStartY = rect.top - parentRect.top
                target._parentHeight = parentRect.height
            },
            move(event) {
                const target = event.target
                const newY = (parseFloat(target.style.top) || 0) + event.dy

                // Apply vertical bounds without padding
                const minY = 0
                const maxY = target._parentHeight - target.offsetHeight

                target.style.top = `${Math.min(Math.max(newY, minY), maxY)}px`
            },
        },
        modifiers: [
            interact.modifiers.restrictRect({
                restriction: '.ProseMirror',
                elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
                endOnly: true,
            }),
        ],
    })
}

const setupResizable = (container) => {
    interact(container).resizable({
        edges: { left: true, right: true },
        listeners: {
            start(event) {
                const target = event.target
                const rect = target.getBoundingClientRect()
                const parentRect = document.querySelector('.ProseMirror').getBoundingClientRect()
                const safeRect = {
                    left: parentRect.left + PADDING,
                    right: parentRect.right - PADDING,
                    width: parentRect.width - PADDING * 2,
                }
                target._resizeStartX = rect.left - parentRect.left
                target._resizeStartWidth = rect.width
                target._safeBounds = safeRect
                target._parentWidth = parentRect.width
            },
            move(event) {
                const target = event.target
                const alignment = target.dataset.alignment
                let newWidth = event.rect.width

                // Handle resize based on alignment
                const maxWidth = target._safeBounds.width
                const minWidthPercent = 10 // Minimum 10% width
                const maxWidthPercent = 100 - ((PADDING * 2) / target._parentWidth) * 100 // Max width accounting for padding

                if (event.edges.left || event.edges.right) {
                    // Convert pixel width to percentage
                    let widthPercent = (newWidth / target._parentWidth) * 100
                    widthPercent = Math.min(Math.max(widthPercent, minWidthPercent), maxWidthPercent)
                    newWidth = (widthPercent / 100) * target._parentWidth
                }

                // Update width and position
                const editor = document.querySelector('.ProseMirror')
                if (editor) {
                    const position = calculatePosition(alignment, newWidth, target._parentWidth)
                    const widthPercent = (newWidth / target._parentWidth) * 100

                    // Store the percentage in the dataset for persistence
                    target.dataset.widthPercent = widthPercent.toFixed(2)

                    // Apply new width and position
                    target.style.width = `${widthPercent}%`
                    Object.assign(target.style, position)
                }
            },
        },
        modifiers: [
            interact.modifiers.aspectRatio({
                ratio: 'preserve',
            }),
        ],
        inertia: false,
    })
}

const calculatePosition = (alignment, width, editorWidth) => {
    switch (alignment) {
        case 'left':
            return {
                left: `${PADDING}px`,
                right: 'auto',
                margin: '0',
            }
        case 'right':
            return {
                left: 'auto',
                right: `${PADDING}px`,
                margin: '0',
            }
        case 'center':
            return {
                left: '0',
                right: '0',
                margin: '0 auto',
            }
        default:
            return {
                left: `${PADDING}px`,
                right: 'auto',
                margin: '0',
            }
    }
}

const setupImageInteractions = (container) => {
    setupDraggable(container)
    setupResizable(container)
}

const removeImageInteractions = (container) => {
    interact(container).unset()
}


/* ---- end of interactions.image.js --- */


/* ########## loader.image.js ########## */

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


/* ------- end of loader.image.js ------ */


/* ######### actions.editor.js ######### */

const SAVE_CHARACTER_SEQUENCE = ';;|💾|;;'

let memoryLock = null

const getMemoryInput = () => {
    const expandButton = document.querySelector('button[aria-label="expand memory"]')
    if (!expandButton) return null
    return expandButton.parentElement.querySelector('textarea')
}

const lockMemoryInput = () => {
    if (memoryLock) {
        console.warn('Memory input already locked')
        return memoryLock
    }

    const memory = getMemoryInput()
    if (!memory) {
        console.error('Memory input not found')
        return null
    }

    const clone = memory.cloneNode(true)
    clone.id = 'memory-input-lock'
    clone.disabled = true

    // Hide original
    memory.style.display = 'none'

    // Insert clone
    memory.parentNode.insertBefore(clone, memory.nextSibling)

    return {
        unlock: () => {
            // Remove clone and restore original
            clone.remove()
            memory.style.removeProperty('display')
        },
    }
}

const triggerSave = () => {
    console.log('triggering save')
    const memory = getMemoryInput()
    if (!memory) return

    memoryLock = lockMemoryInput()
    NAIE.DOM.setNativeValue(memory, memory.value + SAVE_CHARACTER_SEQUENCE)
    NAIE.DOM.simulateInputEvent(memory)
}


/* ------ end of actions.editor.js ----- */


/* ####### imagebutton.editor.js ####### */

const LOREBOOK_BUTTON_SELECTOR = 'button[aria-label="Lorebook"]'
const IMAGE_BUTTON_ID = 'naie-image-button'

const injectModalStyles = () => {
    if (document.querySelector('style[data-naie-modal-styles]')) return

    const styleTag = document.createElement('style')
    styleTag.setAttribute('data-naie-modal-styles', 'true')
    styleTag.innerHTML = `
        .naie-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }

        .naie-modal {
            background: rgb(25, 27, 49);
            padding: 20px;
            min-width: 300px;
            border: 1px solid rgb(34, 37, 63);
            position: relative;
        }

        .naie-modal .close-button {
            position: absolute;
            right: 18px;
            top: 20px;
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: auto;
            height: auto;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }

        .naie-modal .close-button:hover {
            background: none;
        } 

        .naie-modal .close-button > div {
            width: 1rem;
            height: 1rem;
            background: currentColor;
            mask-image: url("/_next/static/media/cross.fac5a02a.svg");
            mask-size: contain;
            mask-repeat: no-repeat;
            mask-position: center;
            -webkit-mask-image: url("/_next/static/media/cross.fac5a02a.svg");
            -webkit-mask-size: contain;
            -webkit-mask-repeat: no-repeat;
            -webkit-mask-position: center;
        }

        .naie-modal-title {
            color: rgb(245, 243, 194);
            margin-bottom: 0.8rem;
            font-size: 1.1em;
            padding-right: 24px;
            font-family: Eczar;
        }

        .naie-modal-content {
            display: flex;
            gap: 8px;
        }

        .naie-modal input {
            background: rgb(14, 15, 33);
            border: 0px;
            color: rgb(255, 255, 255);
            font-size: 0.875rem;
            padding: 10px 0px 10px 10px;
            resize: none;
            flex: 1;
            touch-action: pan-y;
            box-sizing: border-box;
        }

        .naie-modal input:focus {
            outline-width: 0px;
        }

        .naie-modal button {
            font-family: "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
            background-color: rgb(19, 21, 44);
            border: 1px solid transparent;
            color: rgb(255, 255, 255);
            cursor: pointer;
            padding: 10px;
            transition: background 0.08s ease-in-out;
            flex-shrink: 0;
            display: flex;
            flex-direction: row;
            -webkit-box-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            align-items: center;
            outline: transparent solid 1px;
            user-select: none;
            font-weight: 600;
            gap: 5px;
        }

        .naie-modal button:hover {
            background: rgb(14, 15, 33);
        }

        .naie-modal button.primary {
            color: rgb(245, 243, 194);
        }
    `
    document.head.appendChild(styleTag)
}

const showImageUrlModal = () => {
    injectModalStyles()

    const overlay = document.createElement('div')
    overlay.className = 'naie-modal-overlay'

    const modal = document.createElement('div')
    modal.className = 'naie-modal'

    const closeButton = document.createElement('button')
    closeButton.className = 'close-button'
    const closeIcon = document.createElement('div')
    closeButton.appendChild(closeIcon)

    const title = document.createElement('div')
    title.className = 'naie-modal-title'
    title.textContent = 'Insert Image'

    const contentContainer = document.createElement('div')
    contentContainer.className = 'naie-modal-content'

    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = 'Enter image URL'

    const insertButton = document.createElement('button')
    insertButton.className = 'primary'
    insertButton.textContent = 'Insert'

    const handleInsert = () => {
        if (input.value) {
            addImageToLayer(input.value, 30, 0, 'right')
            console.log('Insert image:', input.value)
        }
        overlay.remove()
    }

    const handleCancel = () => overlay.remove()

    insertButton.onclick = handleInsert
    closeButton.onclick = handleCancel

    // Add keyboard support
    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            handleCancel()
        } else if (e.key === 'Enter' && !e.shiftKey) {
            handleInsert()
        }
    })

    contentContainer.append(input, insertButton)
    modal.append(closeButton, title, contentContainer)
    overlay.append(modal)
    document.body.append(overlay)

    // Prevent clicks on overlay from bubbling
    modal.addEventListener('click', (e) => e.stopPropagation())
    overlay.addEventListener('click', handleCancel)

    input.focus()
}

const getLorebookButton = () => document.querySelector(LOREBOOK_BUTTON_SELECTOR)

const hasImageButton = () => document.getElementById(IMAGE_BUTTON_ID) !== null

const injectImageButton = () => {
    const lorebookButton = getLorebookButton()
    if (!lorebookButton || hasImageButton()) return

    // Clone the lorebook button
    const imageButton = lorebookButton.cloneNode(true)
    imageButton.id = IMAGE_BUTTON_ID
    imageButton.setAttribute('aria-label', 'Insert Image')
    imageButton.onclick = showImageUrlModal

    // Insert after lorebook button
    lorebookButton.parentNode.append(imageButton)

    const iconEl = NAIE.DOM.findElementWithMaskImage(imageButton.querySelectorAll('div'), ['book', '.svg'])[0]

    if (iconEl) {
        iconEl.style.maskImage = `url(${getImageIconSvg()})`
        const textSpan = iconEl.previousElementSibling || iconEl.nextElementSibling
        if (textSpan && textSpan.tagName === 'SPAN') {
            textSpan.textContent = 'Insert Image'
        }
    }
}

const setupImageButtonObserver = () => {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                const lorebookButton = getLorebookButton()
                if (lorebookButton) {
                    injectImageButton()
                }
            }
        }
    })

    // Start observing the document for added nodes
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    })

    // Also try to inject immediately in case button already exists
    injectImageButton()

    return observer
}


/* ---- end of imagebutton.editor.js --- */


/* ######## paragraphs.editor.js ####### */

const handleParagraphStyling = (proseMirror) => {
    let styleTag = document.querySelector('style[data-naie-image-positions]')

    // Create style tag if it doesn't exist
    if (!styleTag) {
        styleTag = document.createElement('style')
        styleTag.setAttribute('data-naie-image-positions', 'true')
        document.head.appendChild(styleTag)
    }

    // Clear existing styles
    styleTag.innerHTML = ''

    const containers = document.querySelectorAll('.naie-image-container') // Outer loop for containers

    containers.forEach((container) => {
        const image = container.querySelector('img')
        // Wait for the image to be loaded before checking its dimensions
        image.onload = () => {
            const imageRect = image.getBoundingClientRect()
            const imageWidthPercent = container.dataset.widthPercent

            const paragraphs = proseMirror.querySelectorAll('p') // Inner loop for paragraphs

            paragraphs.forEach((p, i) => {
                const rect = p.getBoundingClientRect()

                // Check if the <p> intersects with the image
                const intersects = !(rect.top > imageRect.bottom || rect.bottom < imageRect.top)

                if (intersects) {
                    // Add CSS for this specific <p> tag by targeting nth-child
                    const nthChildSelector = `.ProseMirror p:nth-child(${i + 1})`
                    styleTag.innerHTML += `${nthChildSelector} { width: calc(${100 - imageWidthPercent}% - 4rem); background: teal; }\n`
                }
            })
        }

        // If the image is already loaded, trigger the onload function manually
        if (image.complete) {
            image.onload() // Trigger it immediately if the image is cached or already loaded
        }
    })
}


/* ---- end of paragraphs.editor.js ---- */


/* ####### prosemirror.editor.js ####### */

let paragraphObserver = null
let resizeObserver = null

const initInlineImages = (proseMirror) => {
    console.log('Initializing inline images for editor')
    injectImageLayer()
    // TODO: Initialize drag-drop zones and image handling

    // Set up resize observer
    if (resizeObserver) {
        resizeObserver.disconnect()
    }
    
    resizeObserver = new ResizeObserver(() => {
        console.log('Editor resized, reloading images and updating styles')
        loadImagesFromState()
        handleParagraphStyling(proseMirror)
    })
    
    resizeObserver.observe(proseMirror)
}

const observeParagraphs = (proseMirror) => {
    if (paragraphObserver) {
        return
    }

    paragraphObserver = new MutationObserver(() => {
        // TODO: Handle paragraph mutations (image insertion, deletion, etc)
        handleParagraphStyling(proseMirror)
        console.log('Paragraph mutation detected')
    })

    paragraphObserver.observe(proseMirror, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
    })
}

const destroyParagraphObserver = () => {
    if (paragraphObserver) {
        paragraphObserver.disconnect()
        paragraphObserver = null
    }
    
    if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
    }
}

const injectImageLayer = () => {
    // Check if the image layer is already present
    const existingImageLayer = document.querySelector('.naie-image-layer')
    if (existingImageLayer) return // If it exists, do nothing

    const proseMirror = document.querySelector('.ProseMirror')
    if (proseMirror) {
        const parent = proseMirror.parentElement

        if (parent) {
            // Set the parent's position to relative and add the class naie-prose-wrapper
            parent.style.position = 'relative'
            parent.classList.add('naie-prose-wrapper')

            // Create the image layer div
            const imageLayer = document.createElement('div')
            imageLayer.classList.add('naie-image-layer')

            // Insert the image layer after .ProseMirror
            parent.insertBefore(imageLayer, proseMirror.nextSibling)

            // Check if the styles are already added
            const existingStyleTag = document.querySelector('style[data-naie-image-layer-styles]')
            if (!existingStyleTag) {
                // Inject the styles only once
                const styleTag = document.createElement('style')
                styleTag.setAttribute('data-naie-image-layer-styles', 'true') // Mark it as injected
                styleTag.innerHTML = `
                    .naie-image-layer {
                        pointer-events: none;
                    }
                `
                document.head.appendChild(styleTag)
            }
        }
    }
}

const watchForEditor = () => {
    const domObserver = new MutationObserver(() => {
        const proseMirror = document.querySelector('.ProseMirror:not([data-shadowed]):not([data-shadow-editor])')

        if (proseMirror && !proseMirror.hasAttribute('data-naie-images-initialized')) {
            console.log('Found ProseMirror editor, initializing')
            initInlineImages(proseMirror)
            proseMirror.setAttribute('data-naie-images-initialized', 'true')
            observeParagraphs(proseMirror)
            handleStoryChange() // Load images when editor is initialized
        }
    })

    domObserver.observe(document.body, {
        childList: true,
        subtree: true,
    })

    // Initial check
    const proseMirror = document.querySelector('.ProseMirror:not([data-shadowed]):not([data-shadow-editor])')
    if (proseMirror && !proseMirror.hasAttribute('data-naie-images-initialized')) {
        console.log('Found ProseMirror editor on initial check')
        initInlineImages(proseMirror)
        proseMirror.setAttribute('data-naie-images-initialized', 'true')
        observeParagraphs(proseMirror)
        handleStoryChange() // Load images on initial check
    }
}


/* ---- end of prosemirror.editor.js --- */


/* ######### create.lorebook.js ######## */

// Functions for creating lorebook entries and categories

const sortingPrefix = 'Ξ'
const NAIE_DATA_LB_CATEGORY_NAME = 'NAIE_data'
const NAIE_IMAGE_STORE_ENTRY_NAME = 'NAIE-inline-image-store'

/**
 * Creates a new NAIE data category
 * @returns {LorebookCategory}
 */
const createLorebookCategory = () => {
    const generateId = () => crypto.randomUUID()

    return {
        name: `${sortingPrefix}${NAIE_DATA_LB_CATEGORY_NAME}`,
        id: generateId(),
        enabled: false,
        createSubcontext: false,
        subcontextSettings: {
            text: '',
            contextConfig: {
                prefix: '',
                suffix: '\n',
                tokenBudget: 1,
                reservedTokens: 0,
                budgetPriority: 400,
                trimDirection: 'trimBottom',
                insertionType: 'newline',
                maximumTrimType: 'sentence',
                insertionPosition: -1,
            },
            lastUpdatedAt: Date.now(),
            displayName: 'New Lorebook Entry',
            id: generateId(),
            keys: [],
            searchRange: 1000,
            enabled: true,
            forceActivation: false,
            keyRelative: false,
            nonStoryActivatable: false,
            category: '',
            loreBiasGroups: [
                {
                    phrases: [],
                    ensureSequenceFinish: false,
                    generateOnce: true,
                    bias: 0,
                    enabled: true,
                    whenInactive: false,
                },
            ],
        },
        useCategoryDefaults: false,
        categoryDefaults: {
            text: '',
            contextConfig: {
                prefix: '',
                suffix: '\n',
                tokenBudget: 1,
                reservedTokens: 0,
                budgetPriority: 400,
                trimDirection: 'trimBottom',
                insertionType: 'newline',
                maximumTrimType: 'sentence',
                insertionPosition: -1,
            },
            lastUpdatedAt: Date.now(),
            displayName: 'New Lorebook Entry',
            id: generateId(),
            keys: [],
            searchRange: 1000,
            enabled: true,
            forceActivation: false,
            keyRelative: false,
            nonStoryActivatable: false,
            category: '',
            loreBiasGroups: [
                {
                    phrases: [],
                    ensureSequenceFinish: false,
                    generateOnce: true,
                    bias: 0,
                    enabled: true,
                    whenInactive: false,
                },
            ],
        },
        categoryBiasGroups: [
            {
                phrases: [],
                ensureSequenceFinish: false,
                generateOnce: true,
                bias: 0,
                enabled: true,
                whenInactive: false,
            },
        ],
        open: false,
    }
}

/**
 * Creates a new image store entry
 * @param {string} categoryId - ID of the parent category
 * @returns {LoreEntry}
 */
const createLorebookImageStore = (categoryId) => {
    const generateId = () => crypto.randomUUID()

    return {
        text: JSON.stringify({ images: [] }),
        contextConfig: {
            prefix: '',
            suffix: '\n',
            tokenBudget: 1,
            reservedTokens: 0,
            budgetPriority: 400,
            trimDirection: 'trimBottom',
            insertionType: 'newline',
            maximumTrimType: 'sentence',
            insertionPosition: -1,
        },
        lastUpdatedAt: Date.now(),
        displayName: NAIE_IMAGE_STORE_ENTRY_NAME,
        id: generateId(),
        keys: [NAIE_IMAGE_STORE_ENTRY_NAME],
        searchRange: 1000,
        enabled: false,
        forceActivation: false,
        keyRelative: false,
        nonStoryActivatable: false,
        category: categoryId,
        loreBiasGroups: [
            {
                phrases: [],
                ensureSequenceFinish: false,
                generateOnce: true,
                bias: 0,
                enabled: false,
                whenInactive: false,
            },
        ],
        hidden: false,
    }
}


/* ----- end of create.lorebook.js ----- */


/* ##### get.storycontent.hooks.js ##### */

const registerStorycontentGetHooks = () => {
    NAIE.NETWORK.manager.registerHook({
        id: 'storycontent-get',
        priority: 10,
        urlPattern: '/user/objects/storycontent',
        methods: ['GET'],
        modifyResponse: async (response, request) => {
            console.log('intercept storycontent get (here we grab images for story)')
            const copy = response.clone()

            /** @type {EntityWrapper} */
            let data = await copy.json()

            //console.log('rawdata', data)

            const imageStore = await loadImagesFromLorebook(data)

            //console.log('waiting for early preflight finished')
            await waitForEarlyPreflight()
            //console.log('early preflight finished')

            storyImagesState.setStoryImages(data.meta, imageStore)

            console.log('story image data', imageStore, storyImagesState.getStoryImages(data.meta))

            return response
        },
    })
}


/* -- end of get.storycontent.hooks.js - */


/* #### patch.storycontent.hooks.js #### */

const registerStorycontentPatchHooks = () => {
    NAIE.NETWORK.manager.registerHook({
        id: 'storycontent-patch',
        priority: 10,
        urlPattern: '/user/objects/storycontent',
        methods: ['PATCH'],
        modifyRequest: async (request) => {
            console.log('intercept storydata patch (inject images into lorebook')
            const options = NAIE.NETWORK.getFetchOptions(request)

            /** @type {EntityWrapper} */
            const body = JSON.parse(options.body)
            //console.log('original body', body)

            let memoryInput = getMemoryInput()
            if (memoryInput) {
                // remove forced save character sequence from input
                NAIE.DOM.setNativeValue(memoryInput, memoryInput.value.replace(SAVE_CHARACTER_SEQUENCE, ''))
            }
            if (memoryLock) {
                memoryLock.unlock()
            }

            /** @type {StoryContent} */
            let storycontent = await NAIE.CRYPTO.decompressDecryptObject(body)

            //console.log('original content', JSON.stringify(storycontent))

            const memoryContext = storycontent.context?.[0] || null
            if (memoryContext?.text.includes(SAVE_CHARACTER_SEQUENCE)) {
                // remove forced save character sequence from data
                memoryContext.text = memoryContext.text.replace(SAVE_CHARACTER_SEQUENCE, '')
            }

            storycontent = updateLorebookImages(storycontent, storyImagesState.getStoryImages(body.meta))

            // Encrypt the modified entry
            //console.log('modified content', JSON.stringify(storycontent))

            const encrypted = await NAIE.CRYPTO.encryptCompressObject({ ...body, data: storycontent })
            const modifiedBody = {
                ...body,
                data: encrypted,
            }

            //const modifiedBody = await saveImagesToLorebook(body, storyImagesState.getStoryImages(body.meta))

            options.body = JSON.stringify(modifiedBody)
            //console.log('modified body', modifiedBody)
            return {
                type: 'request',
                value: new Request(request.url, options),
            }
        },
        modifyResponse: async (response, request) => {
            console.log('intercept storydata patch (load images from saved lorebook)')
            const copy = response.clone()

            /** @type {EntityWrapper} */
            let data = await copy.json()

            //console.log('rawdata', data)

            const imageStore = await loadImagesFromLorebook(data)

            storyImagesState.setStoryImages(data.meta, imageStore)

            console.log('story image data', imageStore, storyImagesState.getStoryImages(data.meta))

            return response
        },
    })
}


/* - end of patch.storycontent.hooks.js  */


/* ####### storycontent.hooks.js ####### */

const registerStorycontentHooks = () => {
    registerStorycontentGetHooks()
    registerStorycontentPatchHooks()
}


/* ---- end of storycontent.hooks.js --- */


/* ######### preflight.state.js ######## */

let earlyHookResolve
let mainHookResolve

const earlyHookPromise = new Promise((resolve) => {
    earlyHookResolve = resolve
})

const mainHookPromise = new Promise((resolve) => {
    mainHookResolve = resolve
})

const notifyEarlyHookComplete = () => {
    earlyHookResolve()
}

const notifyMainHookComplete = () => {
    mainHookResolve()
}

const waitForEarlyPreflight = () => earlyHookPromise
const waitForMainPreflight = () => mainHookPromise


/* ----- end of preflight.state.js ----- */


/* ####### register.preflight.js ####### */

const registerPreflight = async () => {
    console.log('register preflight inline images')
    // Register preflight hooks
    NAIE.PREFLIGHT.registerHook('early', 'inline-images-init-early', 10, async () => {
        storyImagesState = createStoryImageState()
        // Setup URL change monitoring
        setupUrlChangeListener()
        notifyEarlyHookComplete()
    })

    NAIE.PREFLIGHT.registerHook('main', 'inline-images-init-main', 10, async () => {
        setupImageButtonObserver()
        watchForEditor()
        NAIE.SERVICES.statusIndicator.displayMessage('Inline Images initialized')
        notifyMainHookComplete()
    })
}


/* ---- end of register.preflight.js --- */


/* ########## images.state.js ########## */

/** @returns {StoryImageState} */
const createStoryImageState = () => {
    const storyImageMap = new Map()

    const getMap = () => storyImageMap

    const getStoryImages = (storyId) => {
        return storyImageMap.get(storyId) || { images: [] }
    }

    const setStoryImages = (storyId, imageMeta) => {
        storyImageMap.set(storyId, imageMeta)
    }

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

    const upsertImageInStory = (storyId, imageId, newImageData) => {
        if (!storyImageMap.has(storyId)) {
            addImageToStory(storyId, newImageData)
            return
        }

        const currentMeta = storyImageMap.get(storyId)
        const existingImageIndex = currentMeta.images.findIndex(img => img.id === imageId)

        if (existingImageIndex === -1) {
            // Image doesn't exist, add it
            addImageToStory(storyId, newImageData)
        } else {
            // Image exists, update it
            const updatedImages = [...currentMeta.images]
            updatedImages[existingImageIndex] = { ...updatedImages[existingImageIndex], ...newImageData }
            storyImageMap.set(storyId, { images: updatedImages })
        }
    }

    return {
        getMap,
        getStoryImages,
        setStoryImages,
        deleteStoryImages,
        addImageToStory,
        removeImageFromStory,
        upsertImageInStory,
    }
}


/* ------- end of images.state.js ------ */


/* ############ story.url.js ########### */

const getStoryIdFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('id')
}

const handleUrlChange = () => {
    const new_id = getStoryIdFromUrl()

    if (new_id) {
        currentStoryId = new_id
    }

    console.log('current id', currentStoryId)
}

const setupUrlChangeListener = () => {
    // Create URL change observer using both popstate and pushstate
    window.addEventListener('popstate', handleUrlChange)

    // Intercept history.pushState
    const originalPushState = history.pushState
    history.pushState = function () {
        originalPushState.apply(this, arguments)
        handleUrlChange()
    }

    // Intercept history.replaceState
    const originalReplaceState = history.replaceState
    history.replaceState = function () {
        originalReplaceState.apply(this, arguments)
        handleUrlChange()
    }

    // Also watch for hash changes (just in case)
    window.addEventListener('hashchange', handleUrlChange)

    // Initial check
    handleUrlChange()
}


/* -------- end of story.url.js -------- */


/* ########## lorebook.mod.js ########## */

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


/* ------- end of lorebook.mod.js ------ */


/* ########### network.mod.js ########## */

/**
 * Network module for handling API requests
 * Registers hooks with NAIE.NETWORK for intercepting and modifying requests/responses
 */

const initializeNetworkHooks = () => {
    // Initialize hooks for each endpoint group
    registerStorycontentHooks()
}


/* ------- end of network.mod.js ------- */



// Only initialize on the stories page
if (window.location.pathname.startsWith('/stories')) {
    scriptInit = false
    init()
}

