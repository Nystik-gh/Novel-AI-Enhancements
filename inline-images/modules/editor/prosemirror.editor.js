let paragraphObserver = null
let resizeTimeout = null
let resizeObserver = null
let resizeObserverPaused = false

const pauseResizeObserver = () => {
    resizeObserverPaused = true
    console.log('ResizeObserver paused')
}

const resumeResizeObserver = () => {
    resizeObserverPaused = false
    console.log('ResizeObserver resumed')
}

const initInlineImages = (proseMirror) => {
    console.log('Initializing inline images for editor')
    injectImageLayer()

    // Clean up any existing observer
    if (resizeObserver) {
        resizeObserver.disconnect()
    }

    // Create new resize observer with debouncing
    resizeObserver = new ResizeObserver((entries) => {
        if (resizeObserverPaused) {
            console.log('ResizeObserver is paused, skipping update')
            return
        }
        // Use debounce to avoid excessive updates
        clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(() => {
            console.log('Editor resized, updating paragraph positions')
            const editorRect = proseMirror.getBoundingClientRect()
            const scrollTop = proseMirror.scrollTop

            // Get currently tracked paragraphs
            const positions = paragraphPositionState.getAllPositions()

            // Update only tracked paragraphs that need updating
            for (const [index, state] of positions) {
                // Only update if element is no longer connected or exists
                if (!state.element.isConnected) {
                    // Try to find the paragraph at this index
                    const paragraph = proseMirror.querySelector(`p:nth-child(${index + 1})`)
                    if (paragraph) {
                        state.element = paragraph
                    } else {
                        // Paragraph no longer exists at this index
                        paragraphPositionState.removePosition(index)
                        continue
                    }
                }

                // Update position for the paragraph
                const position = calculateAbsolutePosition(state.element, editorRect, scrollTop, 0)
                paragraphPositionState.updatePosition(index, state.element, index, position, state.offset)
                runParagraphStylingOnce(proseMirror)
            }
        }, 50) // Debounce set to 50ms for smooth visual updates while maintaining performance
    })

    // Start observing the editor
    resizeObserver.observe(proseMirror)
}

const observeParagraphs = (proseMirror) => {
    if (paragraphObserver) {
        return
    }

    // Create a debounced version of runParagraphStylingOnce
    let mutationTimeout = null
    const debouncedRunParagraphStylingOnce = () => {
        clearTimeout(mutationTimeout)
        mutationTimeout = setTimeout(() => {
            runParagraphStylingOnce(proseMirror)
            console.log('Paragraph mutation handled')
        }, 100) // 100ms debounce
    }

    paragraphObserver = new MutationObserver((mutations) => {
        // Check if the mutation is relevant before handling
        const relevantMutation = mutations.some((mutation) => {
            // Potentially add optimizations
            return true
        })
        if (relevantMutation) {
            debouncedRunParagraphStylingOnce()
        }
    })

    paragraphObserver.observe(proseMirror, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
    })

    // Create event handlers with named functions so they can be removed later
    pasteHandler = () => {
        setTimeout(() => runParagraphStylingOnce(proseMirror), 50)
    }

    inputHandler = () => {
        setTimeout(() => runParagraphStylingOnce(proseMirror), 50)
    }

    keydownHandler = (e) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            setTimeout(() => runParagraphStylingOnce(proseMirror), 50)
        }
    }

    proseMirror.addEventListener('paste', pasteHandler)
    proseMirror.addEventListener('input', inputHandler)
    proseMirror.addEventListener('keydown', keydownHandler)

    undoRedoHandler = (e) => {
        if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
            console.log('Undo detected')
            //setTimeout(() => runParagraphStylingOnce(document.querySelector('.ProseMirror')), 50)
        }
        if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && !e.shiftKey && e.key === 'y')) {
            console.log('Redo detected')
            //setTimeout(() => runParagraphStylingOnce(document.querySelector('.ProseMirror')), 50)
        }
    }
    document.addEventListener('keydown', undoRedoHandler)
}

// Store references to event handler functions so we can remove them later
let pasteHandler = null
let inputHandler = null
let keydownHandler = null
let undoRedoHandler = null

const destroyParagraphObserver = () => {
    if (paragraphObserver) {
        paragraphObserver.disconnect()
        paragraphObserver = null
    }

    if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
    }

    // Remove event listeners from ProseMirror
    const proseMirror = document.querySelector('.ProseMirror')
    if (proseMirror) {
        if (pasteHandler) proseMirror.removeEventListener('paste', pasteHandler)
        if (inputHandler) proseMirror.removeEventListener('input', inputHandler)
        if (keydownHandler) proseMirror.removeEventListener('keydown', keydownHandler)
    }

    // Remove global undo/redo event listener
    if (undoRedoHandler) document.removeEventListener('keydown', undoRedoHandler)

    // Reset event handler references
    pasteHandler = null
    inputHandler = null
    keydownHandler = null
    undoRedoHandler = null
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

// Keep a reference to the editor observer so we can clean it up when needed
let editorObserver = null

const watchForEditor = () => {
    // Clean up any existing observer
    if (editorObserver) {
        editorObserver.disconnect()
    }

    editorObserver = new MutationObserver(() => {
        const proseMirror = document.querySelector('.ProseMirror:not([data-shadowed]):not([data-shadow-editor])')

        if (proseMirror && !proseMirror.hasAttribute('data-naie-images-initialized')) {
            console.log('Found ProseMirror editor, initializing')
            initInlineImages(proseMirror)
            proseMirror.setAttribute('data-naie-images-initialized', 'true')
            observeParagraphs(proseMirror)
            handleStoryChange() // Load images when editor is initialized
        }
    })

    editorObserver.observe(document.body, {
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
    }
}

// Function to clean up all observers when the script is unloaded
const cleanupAllObservers = () => {
    if (paragraphObserver) {
        paragraphObserver.disconnect()
        paragraphObserver = null
    }

    if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
    }

    if (editorObserver) {
        editorObserver.disconnect()
        editorObserver = null
    }

    // Remove event listeners
    destroyParagraphObserver()

    // Clear any pending timeouts
    if (resizeTimeout) {
        clearTimeout(resizeTimeout)
        resizeTimeout = null
    }
}

// Export the cleanup function to the global scope
if (typeof window !== 'undefined') {
    window.NAIE_cleanupInlineImagesObservers = cleanupAllObservers
}
