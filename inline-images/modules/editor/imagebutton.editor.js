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
            const position = getVisibleEditorPosition()
            addImageToLayer(input.value, 30, position.y, 'right', 5)
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

const getVisibleEditorPosition = () => {
    const proseMirror = document.querySelector('.ProseMirror')
    if (!proseMirror) return { y: 0, paragraphIndex: 0 }

    // Get editor dimensions
    const editorRect = proseMirror.getBoundingClientRect()

    // Find all paragraphs
    const paragraphs = Array.from(proseMirror.children)

    // Find paragraphs that are visible in the viewport - much simpler!
    const visibleParagraphs = paragraphs.filter((p) => {
        const rect = p.getBoundingClientRect()

        // Paragraph is visible if it overlaps with the editor's visible area
        return rect.top > 0 && rect.bottom > 0
    })

    // If no paragraphs are visible, return default
    if (visibleParagraphs.length === 0) {
        return {
            y: editorRect.height / 3,
            paragraphIndex: 0,
        }
    }

    // Find the middle visible paragraph
    const paragraphIndex = 4
    const selectedParagraph = visibleParagraphs[paragraphIndex]

    // Calculate the Y position - we still need scrollTop here to get document coordinates
    const paragraphRect = selectedParagraph.getBoundingClientRect()
    const y = paragraphRect.top - editorRect.top + proseMirror.scrollTop

    return {
        y,
        paragraphIndex,
    }
}
