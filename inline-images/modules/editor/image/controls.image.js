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
            width: 100%;
            height: auto;
            display: block;
        }

        .naie-modal.transparent {
            background: transparent;
            border: none;
            padding: 0;
            min-width: unset;
        }

        .naie-modal.transparent img {
            max-width: 90vw;
            max-height: 90vh;
            object-fit: contain;
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
            width: 24px;
            height: 24px;
            min-width: 24px;
            border: none;
            background: rgba(60,60,60,0.35);
            color: white;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            padding: 4px 8px;
            transition: background-color 0.2s;
        }

        .naie-control-button:hover {
            background: rgba(60,60,60,0.7);
        }

        .naie-control-button.edit {
            font-size: 12px;
        }

        .naie-control-button.fullscreen {
            font-size: 16px;
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
            background: rgba(60,60,60,0.7);
        }

        .naie-control-button.active {
            background: rgba(60,60,60,0.85);
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
    button.onclick = (e) => {
        onClick(e)
        // Trigger paragraph styling after alignment change
        const proseMirror = document.querySelector('.ProseMirror')
        if (proseMirror) {
            runParagraphStylingOnce(proseMirror)
        }
    }
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
        setContainerMode(container, 'locked')
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

        triggerSave()
    })

    const wrapper = document.createElement('div')
    wrapper.className = 'naie-alignment-controls'
    wrapper.append(lockButton, createFullscreenButton(container))

    controls.append(alignmentControls, wrapper)
    return controls
}

const createEditButton = (container) => {
    const button = document.createElement('button')
    button.className = 'naie-control-button edit'
    button.innerHTML = '✎'
    button.onclick = () => setContainerMode(container, 'editing')
    return button
}

const createFullscreenButton = (container) => {
    const button = document.createElement('button')
    button.className = 'naie-control-button fullscreen'
    button.innerHTML = '⤢'
    button.onclick = () => {
        const img = container.querySelector('img')
        if (img) {
            showImageModal(img.src)
        }
    }
    return button
}

const setContainerMode = (container, mode) => {
    injectControlStyles()

    // Remove existing controls
    const controls = container.querySelector('.naie-controls')
    controls?.remove()

    // Set the mode in the dataset for loader.image.js to check
    if (mode === 'editing') {
        pauseResizeObserver()
        container.dataset.mode = 'edit'
        container.classList.remove('locked')
        container.appendChild(createControls(container))
        setupImageInteractions(container)
    } else {
        // locked
        container.dataset.mode = 'locked'
        container.classList.add('locked')

        // Add edit button that shows on hover
        const controls = document.createElement('div')
        controls.className = 'naie-controls'
        controls.appendChild(createEditButton(container))
        controls.appendChild(createFullscreenButton(container))
        container.appendChild(controls)

        // Remove interactions
        removeImageInteractions(container)

        resumeResizeObserver()
    }
}

// Find nearest paragraph and calculate relative offset
const findNearestParagraph = (container) => {
    const proseMirror = document.querySelector('.ProseMirror')
    const paragraphs = proseMirror.querySelectorAll('p')
    const imageRect = container.getBoundingClientRect()
    const imageTop = imageRect.top
    const alignment = container.dataset.alignment || 'left'

    let nearestIndex = 0
    let nearestDistance = Infinity
    let nearestTop = 0

    paragraphs.forEach((p, i) => {
        const rect = p.getBoundingClientRect()
        if (rect.top <= imageTop) {
            const distance = Math.abs(rect.top - imageTop)
            if (distance < nearestDistance) {
                nearestDistance = distance
                nearestIndex = i
                nearestTop = rect.top
            }
        }
    })

    if (container.dataset.mode === 'edit' && alignment === 'center') {
        const rect = paragraphs[nearestIndex].getBoundingClientRect()
        if (rect.top <= imageTop && rect.bottom > imageTop && rect.bottom < imageRect.bottom) {
            if (nearestIndex + 1 < paragraphs.length) {
                nearestIndex += 1
                nearestTop = paragraphs[nearestIndex].getBoundingClientRect().top
            }
        }
    }

    /*if (alignment === 'center') {
        // For center alignment, find the paragraph with closest top that is above the image
        paragraphs.forEach((p, i) => {
            const rect = p.getBoundingClientRect()
            if (rect.top <= imageTop) {
                const distance = Math.abs(rect.top - imageTop)
                if (distance < nearestDistance) {
                    nearestDistance = distance
                    nearestIndex = i
                    nearestTop = rect.top
                }
            }
        })
    } else {
        // Default: closest top regardless of above/below
        paragraphs.forEach((p, i) => {
            const rect = p.getBoundingClientRect()
            const distance = Math.abs(rect.top - imageTop)
            if (distance < nearestDistance) {
                nearestDistance = distance
                nearestIndex = i
                nearestTop = rect.top
            }
        })
    }*/

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

const showImageModal = (imgSrc) => {
    injectModalStyles()

    const overlay = document.createElement('div')
    overlay.className = 'naie-modal-overlay'

    const modal = document.createElement('div')
    modal.className = 'naie-modal transparent'

    const closeButton = document.createElement('button')
    closeButton.className = 'close-button'
    const closeIcon = document.createElement('div')
    closeButton.appendChild(closeIcon)

    const img = document.createElement('img')
    img.src = imgSrc

    const handleClose = () => overlay.remove()

    closeButton.onclick = handleClose

    // Add keyboard support
    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') handleClose()
    })

    modal.append(closeButton, img)
    overlay.append(modal)
    document.body.append(overlay)

    // Prevent clicks on overlay from bubbling
    modal.addEventListener('click', (e) => e.stopPropagation())
    overlay.addEventListener('click', handleClose)
}
