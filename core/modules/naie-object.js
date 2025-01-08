/***
 * @return {NAIE}
 */
const createNAIEInstance = () => {
    return {
        HOOKS,
        SETTINGS,
        MISC: MISC_UTILS,
        DOM: DOM_UTILS,
        NAI: NAI_UTILS,
        EXTENSIONS,
        LOGGING: LOGGING_UTILS,
        PREFLIGHT: PREFLIGHT_UTILS,
        statusIndicator: extensions_createNAIEIndicator()
    }
}
