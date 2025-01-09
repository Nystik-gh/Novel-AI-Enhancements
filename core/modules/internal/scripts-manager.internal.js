const SCRIPT_READY_TIMEOUT = 1000 // Max wait time for scripts

const NAIE_INTERNAL = {
    readyScripts: new Set(),
    registeredScripts: new Set(),
    isPreflightStarted: false,
    preflight: {
        runStages: preflight_runStages
    }
}

const checkAllScriptsReady = () => {
    const { readyScripts, registeredScripts } = NAIE_INTERNAL
    return readyScripts.size === registeredScripts.size
}

const startPreflightWhenReady = async () => {
    const { isPreflightStarted } = NAIE_INTERNAL
    if (isPreflightStarted) return

    // First script to call markScriptReady starts the wait
    if (NAIE_INTERNAL.readyScripts.size === 1) {
        const logger = logging_getLogger()
        const startTime = Date.now()
        
        while (Date.now() - startTime < SCRIPT_READY_TIMEOUT) {
            if (checkAllScriptsReady()) {
                NAIE_INTERNAL.isPreflightStarted = true
                await NAIE_INTERNAL.preflight.runStages()
                return
            }
            await new Promise(r => setTimeout(r, 50))
        }

        // Timeout reached, run preflight anyway
        logger.warn(
            'Preflight timeout reached. Some scripts may not be ready:',
            {
                registered: Array.from(NAIE_INTERNAL.registeredScripts),
                ready: Array.from(NAIE_INTERNAL.readyScripts)
            }
        )
        NAIE_INTERNAL.isPreflightStarted = true
        await NAIE_INTERNAL.preflight.runStages()
    }
}

const registerScript = (scriptId) => {
    if (NAIE_INTERNAL.isPreflightStarted) {
        throw new Error(`Script ${scriptId} tried to register after preflight started`)
    }
    NAIE_INTERNAL.registeredScripts.add(scriptId)
}

const markScriptReady = async (scriptId) => {
    if (!NAIE_INTERNAL.registeredScripts.has(scriptId)) {
        throw new Error(`Script ${scriptId} not registered`)
    }
    NAIE_INTERNAL.readyScripts.add(scriptId)
    await startPreflightWhenReady()
}

const CORE_UTILS = {
    registerScript,
    markScriptReady
}
