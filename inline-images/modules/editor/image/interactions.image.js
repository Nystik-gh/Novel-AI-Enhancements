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

                if (event.edges.left || event.edges.right) {
                    // Apply width constraints
                    newWidth = Math.min(Math.max(newWidth, 50), maxWidth)
                }

                // Update width and position
                const editor = document.querySelector('.ProseMirror')
                if (editor) {
                    const position = calculatePosition(alignment, newWidth, target._parentWidth)

                    // Apply new width and position
                    target.style.width = `${newWidth}px`
                    Object.assign(target.style, position)
                }
            },
        },
        modifiers: [
            interact.modifiers.aspectRatio({
                ratio: 'preserve',
            }),
        ],
        inertia: true,
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
