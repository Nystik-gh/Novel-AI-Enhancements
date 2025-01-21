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
        const imageRecord = {
            id: container.dataset.id,
            url: container.dataset.url,
            align: container.dataset.alignment,
            offset: parseInt(container.style.top),
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

// Initialize container with specified mode
const initializeImageControls = (container, startLocked = false) => {
    injectControlStyles()
    setContainerMode(container, startLocked ? 'locked' : 'editing')
}
