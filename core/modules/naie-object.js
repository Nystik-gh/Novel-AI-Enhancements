const _modalObserver = naie_initModalObserver()
const _statusIndicator = extensions_createNAIEIndicator()

/***
 * @type {NAIEServices}
 */
const NAIE_SERVICES = {
    statusIndicator: _statusIndicator,
    modalObserver: _modalObserver,
}

/***
 * @return {NAIE}
 */
const createNAIEInstance = () => {
    return {
        NETWORK,
        //SETTINGS,
        MISC: MISC_UTILS,
        DOM: DOM_UTILS,
        NAI: NAI_UTILS,
        EXTENSIONS,
        LOGGING: LOGGING_UTILS,
        PREFLIGHT: PREFLIGHT_UTILS,
        CORE: CORE_UTILS,
        SERVICES: NAIE_SERVICES,
        _internal: NAIE_INTERNAL
    }
}
