let paragraphObserver = null

const initInlineImages = (proseMirror) => {
    console.log('Initializing inline images for editor')
    injectImageLayer()
    // TODO: Initialize drag-drop zones and image handling
}

const observeParagraphs = (proseMirror) => {
    if (paragraphObserver) {
        return
    }

    paragraphObserver = new MutationObserver(() => {
        // TODO: Handle paragraph mutations (image insertion, deletion, etc)
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
