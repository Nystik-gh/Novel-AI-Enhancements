

/***
 * @type {NAIEServices}
 */
const NAIE_SERVICES = {
    statusIndicator: null,
    modalObserver: naie_initModalObserver(),
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
