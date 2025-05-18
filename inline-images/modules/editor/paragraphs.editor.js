// --- Paragraph styling handler with run-once-at-a-time logic ---
let paragraphStylingBusy = false
let paragraphStylingQueued = false

async function runParagraphStylingOnce(proseMirror) {
    console.log('attempt to run paragraph styling', !paragraphStylingBusy)
    if (paragraphStylingBusy) {
        paragraphStylingQueued = true
        return
    }
    paragraphStylingBusy = true
    try {
        console.log('running paragraph styling')
        await handleParagraphStyling(proseMirror)
        console.log('paragraph styling complete')
    } finally {
        console.log('unlocking paragraph styling')
        paragraphStylingBusy = false
        if (paragraphStylingQueued) {
            paragraphStylingQueued = false
            // Run again for any missed updates
            console.log('re-running paragraph styling due to queue')
            runParagraphStylingOnce(proseMirror)
        }
    }
}

const handleParagraphStyling = (proseMirror) => {
    return new Promise((resolve) => {
        let styleTag = document.querySelector('style[data-naie-image-positions]')

        // Create style tag if it doesn't exist
        if (!styleTag) {
            styleTag = document.createElement('style')
            styleTag.setAttribute('data-naie-image-positions', 'true')
            document.head.appendChild(styleTag)
        }

        console.log('styleTag', styleTag)

        // Clear existing styles

        const containers = document.querySelectorAll('.naie-image-container')

        // Sort containers by anchor index (or expected anchor index)
        const containersWithAnchor = Array.from(containers).map((container) => {
            const alignment = container.dataset.alignment || 'left'
            let anchorIdx = container.dataset.anchorIndex !== undefined ? parseInt(container.dataset.anchorIndex) : -1
            let calcIdx = findNearestParagraph(container).index
            if (container.dataset.mode === 'edit') {
                anchorIdx = calcIdx
            }

            return { container, alignment, anchorIdx }
        })

        styleTag.innerHTML = ''

        containersWithAnchor.sort((a, b) => a.anchorIdx - b.anchorIdx)

        const editorRect = proseMirror.getBoundingClientRect()
        const scrollTop = proseMirror.scrollTop
        const paragraphs = Array.from(proseMirror.children)

        // Handle containers in anchor order
        containersWithAnchor.forEach(({ container, alignment, anchorIdx }) => {
            const containerRect = container.getBoundingClientRect()
            const containerWidthPercent = parseFloat(container.dataset.widthPercent || '0')
            const containerHeight = containerRect.height

            if (alignment === 'center') {
                // Center-aligned: margin/padding logic for anchor paragraph only
                if (anchorIdx >= 0 && anchorIdx < paragraphs.length) {
                    const nthChildSelector = `.ProseMirror p:nth-child(${anchorIdx + 1})`
                    styleTag.innerHTML += `${nthChildSelector} { padding-top: calc(${containerHeight}px + 2rem) !important; background: rgba(128, 0, 128, 0.1) !important; }\n`
                }
            } else {
                // Left/right-aligned: loop paragraphs from anchorIdx
                for (let i = anchorIdx; i < paragraphs.length; i++) {
                    const p = paragraphs[i]
                    const pRect = p.getBoundingClientRect()
                    let isOverlapping = !(
                        pRect.right < containerRect.left ||
                        pRect.left > containerRect.right ||
                        pRect.bottom < containerRect.top ||
                        pRect.top > containerRect.bottom
                    )
                    let isAnchor = i === anchorIdx
                    const nthChildSelector = `.ProseMirror p:nth-child(${i + 1})`
                    if (isOverlapping) {
                        if (alignment === 'left') {
                            styleTag.innerHTML += `${nthChildSelector} { padding-left: calc(${containerWidthPercent}% + 4rem); background: ${
                                isAnchor ? 'rgba(128, 0, 128, 0.1) !important;' : 'rgba(0, 128, 128, 0.1) !important;'
                            }  }\n`
                        } else if (alignment === 'right') {
                            styleTag.innerHTML += `${nthChildSelector} { padding-right: calc(${containerWidthPercent}% + 4rem); background: ${
                                isAnchor ? 'rgba(128, 0, 128, 0.1) !important;' : 'rgba(0, 128, 128, 0.1) !important;'
                            } }\n`
                        }
                    }

                    // Stop if paragraph is no longer vertically overlapping
                    if (pRect.top > containerRect.bottom) break
                }
            }

            /*const imgState = storyImagesState.getImageState(currentStoryId, container.dataset.id)
            const pos = calculateAbsolutePosition(paragraphs[anchorIdx], editorRect, scrollTop)
            paragraphPositionState.updatePosition(anchorIdx, paragraphs[anchorIdx], anchorIdx, pos, imgState.offset)*/
        })

        resolve()
    })
}

const findOverlappingParagraphs = (imgC) => {
    const imageRect = imgC.getBoundingClientRect()

    // First get paragraphs by vertical sampling
    const paragraphs = new Set()
    const points = 20 // Number of vertical points
    const dy = imageRect.height / points
    const x = imageRect.left + imageRect.width / 2

    for (let i = 0; i <= points; i++) {
        const y = imageRect.top + i * dy
        const elements = document.elementsFromPoint(x, y)
        elements.forEach((el) => {
            if (el.tagName === 'P') {
                paragraphs.add(el)
            }
        })
    }

    if (paragraphs.size === 0) return []

    // Convert to array and sort by DOM order
    const sampledParagraphs = Array.from(paragraphs)

    // Extend backwards and forwards
    const allParagraphsToCheck = new Set(sampledParagraphs)

    // Get previous 10 paragraphs from first sampled paragraph
    let current = sampledParagraphs[0]
    for (let i = 0; i < 10; i++) {
        current = current.previousElementSibling
        if (!current || current.tagName !== 'P') break
        allParagraphsToCheck.add(current)
    }

    // Get next 10 paragraphs from last sampled paragraph
    current = sampledParagraphs[sampledParagraphs.length - 1]
    for (let i = 0; i < 10; i++) {
        current = current.nextElementSibling
        if (!current || current.tagName !== 'P') break
        allParagraphsToCheck.add(current)
    }

    //console.log('paragraphs', sampledParagraphs, allParagraphsToCheck)

    // Check each paragraph for actual rect overlap
    const overlappingParagraphs = Array.from(allParagraphsToCheck)
        .filter((p) => {
            const pRect = p.getBoundingClientRect()

            // Convert rects to editor-relative coordinates
            const relImageRect = {
                top: imageRect.top,
                bottom: imageRect.bottom,
                left: imageRect.left,
                right: imageRect.right,
            }

            const relPRect = {
                top: pRect.top,
                bottom: pRect.bottom,
                left: pRect.left,
                right: pRect.right,
            }

            console.log('rects', relImageRect, relPRect)

            // Check for vertical overlap
            const verticalOverlap = !(relImageRect.bottom < relPRect.top || relImageRect.top > relPRect.bottom)

            // Check for horizontal overlap
            const horizontalOverlap = !(relImageRect.right < relPRect.left || relImageRect.left > relPRect.right)

            return verticalOverlap && horizontalOverlap
        })
        .map((p) => {
            p.imgOverlap = imgC
            return p
        })

    return overlappingParagraphs
}
