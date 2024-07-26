interface NAIE {
    HOOKS
    SETTINGS
    MISC
    DOM: DOMUtils
    NAI
    EXTENSIONS
    LOGGING: LoggingUtils
    statusIndicator: NAIEStatusIndicator
}

interface NAIUtils {}

interface Window {
    NAIE_INSTANCE: NAIE
}
