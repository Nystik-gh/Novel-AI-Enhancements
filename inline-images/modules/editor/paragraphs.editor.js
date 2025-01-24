const handleParagraphStyling = async (proseMirror) => {
    let styleTag = document.querySelector('style[data-naie-image-positions]')

    // Create style tag if it doesn't exist
    if (!styleTag) {
        styleTag = document.createElement('style')
        styleTag.setAttribute('data-naie-image-positions', 'true')
        document.head.appendChild(styleTag)
    }

    // Clear existing styles
    styleTag.innerHTML = ''

    const containers = document.querySelectorAll('.naie-image-container')

    const paragraphsToAdjust = []

    const loadPromises = Array.from(containers).map((container) => {
        return new Promise((resolve) => {
            const image = container.querySelector('img')

            const handleLoad = () => {
                const editorRect = proseMirror.getBoundingClientRect()
                const imageWidthPercent = container.dataset.widthPercent
                const alignment = container.dataset.alignment || 'left'

                const paragraphs = findOverlappingParagraphs(container)
                paragraphsToAdjust.push(...paragraphs)
                resolve(paragraphs)
            }

            if (image.complete) {
                handleLoad()
            } else {
                image.onload = handleLoad
            }
        })
    })

    await Promise.all(loadPromises)

    const allParagraphs = Array.from(proseMirror.children)

    for (let i = 0; i < allParagraphs.length; i++) {
        const p = allParagraphs[i]
        const ovPidx = paragraphsToAdjust.indexOf(p)
        if (ovPidx !== -1) {
            const overlapping = paragraphsToAdjust[ovPidx]
            const imgOverlapping = overlapping.imgOverlap

            const nthChildSelector = `.ProseMirror p:nth-child(${i + 1})`
            styleTag.innerHTML += `${nthChildSelector} { background: teal; }\n`
        }
    }
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

/*

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

    const containers = document.querySelectorAll('.naie-image-container')

    containers.forEach((container) => {
        const image = container.querySelector('img')
        image.onload = () => {
            const editorRect = proseMirror.getBoundingClientRect()
            const imageRect = image.getBoundingClientRect()
            const imageWidthPercent = container.dataset.widthPercent
            const alignment = container.dataset.alignment || 'left'

            // Use raw viewport-relative positions
            const adjustedImageRect = {
                top: imageRect.top,
                bottom: imageRect.bottom,
                height: imageRect.height,
            }

            const paragraphs = proseMirror.querySelectorAll('p')

            paragraphs.forEach((p, i) => {
                const rect = p.getBoundingClientRect()
                const adjustedParagraphRect = {
                    top: rect.top,
                    bottom: rect.bottom,
                    height: rect.height,
                }

                // Add a small buffer to prevent edge-case overlaps
                const buffer = 5
                const verticalOverlap = !(
                    adjustedParagraphRect.bottom + buffer < adjustedImageRect.top ||
                    adjustedParagraphRect.top - buffer > adjustedImageRect.bottom
                )

                if (verticalOverlap) {
                    console.log('\n=== Overlap Check ===')
                    console.log('Editor rect:', editorRect)
                    console.log(`Paragraph ${i + 1} raw rect:`, rect)
                    console.log('Image raw rect:', imageRect)
                    console.log(`Adjusted Paragraph ${i + 1}:`, adjustedParagraphRect)
                    console.log('Adjusted Image:', adjustedImageRect)
                    console.log('Vertical Overlap:', verticalOverlap)

                    // Add CSS for this specific <p> tag by targeting nth-child
                    const nthChildSelector = `.ProseMirror p:nth-child(${i + 1})`
                    const margin = alignment === 'left' ? 'margin-right' : 'margin-left'
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

*/
