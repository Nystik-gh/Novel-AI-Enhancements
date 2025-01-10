const _modalObserver = naie_initModalObserver()
let _statusIndicator = null;

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
        NETWORK: NERWORK_UTILS,
        //SETTINGS,
        MISC: MISC_UTILS,
        DOM: DOM_UTILS,
        NAI: NAI_UTILS,
        EXTENSIONS,
        LOGGING: LOGGING_UTILS,
        PREFLIGHT: PREFLIGHT_UTILS,
        CORE: CORE_UTILS,
        SERVICES: NAIE_SERVICES,
    }
}
