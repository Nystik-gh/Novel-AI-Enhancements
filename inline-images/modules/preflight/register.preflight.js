const registerPreflight = async () => {
    console.log('register preflight inline images')
    // Register preflight hooks
    NAIE.PREFLIGHT.registerHook('early', 'inline-images-init-early', 10, async () => {
        storyImagesState = createStoryImageState()
        // Setup URL change monitoring
        setupUrlChangeListener()
        notifyEarlyHookComplete()
    })

    NAIE.PREFLIGHT.registerHook('main', 'inline-images-init-main', 10, async () => {
        setupImageButtonObserver()
        NAIE.SERVICES.statusIndicator.displayMessage('Inline Images initialized')
        notifyMainHookComplete()
    })
}
