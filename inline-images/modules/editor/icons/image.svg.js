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
