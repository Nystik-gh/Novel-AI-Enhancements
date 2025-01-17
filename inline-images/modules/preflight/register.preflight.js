const registerPreflight = async () => {
    // Register preflight hooks
    NAIE.PREFLIGHT.registerHook('main', 'inline-images-init', 10, async () => {
        NAIE.SERVICES.statusIndicator.displayMessage('Inline Images initialized')
    })
}
