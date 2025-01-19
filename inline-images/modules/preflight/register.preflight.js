const registerPreflight = async () => {
    // Register preflight hooks
    NAIE.PREFLIGHT.registerHook('early', 'inline-images-init-early', 10, async () => {
        storyImagesState = createStoryImageState()
    })

    NAIE.PREFLIGHT.registerHook('main', 'inline-images-init-main', 10, async () => {
        NAIE.SERVICES.statusIndicator.displayMessage('Inline Images initialized')
    })
}
