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
            const alignment = container.dataset.alignment || 'left'

            const paragraphs = proseMirror.querySelectorAll('p') // Inner loop for paragraphs

            paragraphs.forEach((p, i) => {
                const rect = p.getBoundingClientRect()

                // For proper intersection, we need to check if one rectangle is not entirely
                // above or below the other. This is the correct way to check for overlap.
                const verticalOverlap = !(
                    (
                        rect.bottom < imageRect.top || // paragraph ends before image starts
                        rect.top > imageRect.bottom
                    ) // paragraph starts after image ends
                )

                console.log(`Paragraph ${i + 1} rect:`, {
                    top: rect.top,
                    bottom: rect.bottom,
                    height: rect.height,
                })
                console.log(`Image rect:`, {
                    top: imageRect.top,
                    bottom: imageRect.bottom,
                    height: imageRect.height,
                })
                console.log(`Overlap:`, verticalOverlap)

                if (verticalOverlap) {
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
