const SCRIPT_READY_TIMEOUT = 1000 // Max wait time for scripts

const core_checkAllScriptsReady = () => {
    const { readyScripts, registeredScripts, isPreflightStarted } = NAIE._internal
    return readyScripts.size === registeredScripts.size
}

const core_startPreflightWhenReady = async () => {
    const { isPreflightStarted } = NAIE._internal
    if (isPreflightStarted) return

    // First script to call markScriptReady starts the wait
    if (NAIE._internal.readyScripts.size === 1) {
        const logger = NAIE.LOGGING.getLogger()
        const startTime = Date.now()
        
        while (Date.now() - startTime < SCRIPT_READY_TIMEOUT) {
            if (core_checkAllScriptsReady()) {
                NAIE._internal.isPreflightStarted = true
                await NAIE._internal.preflight.runStages()
                return
            }
            await new Promise(r => setTimeout(r, 50))
        }

        // Timeout reached, run preflight anyway
        logger.warn(
            'Preflight timeout reached. Some scripts may not be ready:',
            {
                registered: Array.from(NAIE._internal.registeredScripts),
                ready: Array.from(NAIE._internal.readyScripts)
            }
        )
        NAIE._internal.isPreflightStarted = true
        await NAIE._internal.preflight.runStages()
    }
}

const core_registerScript = (scriptId) => {
    if (NAIE._internal.isPreflightStarted) {
        throw new Error(`Script ${scriptId} tried to register after preflight started`)
    }
    NAIE._internal.registeredScripts.add(scriptId)
}

const core_markScriptReady = async (scriptId) => {
    if (!NAIE._internal.registeredScripts.has(scriptId)) {
        throw new Error(`Script ${scriptId} not registered`)
    }
    NAIE._internal.readyScripts.add(scriptId)
    await core_startPreflightWhenReady()
}

/***
 * @type {NAIECore}
 */
const CORE_UTILS = {
    registerScript: core_registerScript,
    markScriptReady: core_markScriptReady
}

let _modalObserver = null
let _statusIndicator = null

/***
 * @return {NAIE}
 */
const createNAIEInstance = () => {
    // Initialize modal observer
    _modalObserver = naie_initModalObserver()
    _statusIndicator = extensions_createNAIEIndicator()

    /***
     * @type {NAIEServices}
     */
    const NAIE_SERVICES = {
        statusIndicator: _statusIndicator,
        modalObserver: _modalObserver,
    }

    return {
        HOOKS,
        //SETTINGS,
        MISC: MISC_UTILS,
        DOM: DOM_UTILS,
        NAI: NAI_UTILS,
        EXTENSIONS,
        LOGGING: LOGGING_UTILS,
        PREFLIGHT: PREFLIGHT_UTILS,
        CORE: CORE_UTILS,
        SERVICES: {
            statusIndicator: _statusIndicator,
            modalObserver: _modalObserver,
        },
        _internal: {
            readyScripts: new Set(),
            registeredScripts: new Set(),
            isPreflightStarted: false,
            preflight: {
                runStages: preflight_runStages
            }
        }
    }
}
