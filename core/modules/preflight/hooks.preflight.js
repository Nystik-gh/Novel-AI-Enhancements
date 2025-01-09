const STAGES = {
    EARLY: 'early',
    MAIN: 'main',
    LATE: 'late'
}

const DEFAULT_TIMEOUT = 10000 // 10 seconds
let currentStage = null

// Initialize hook storage
const hooks = new Map()
for (const stage of Object.values(STAGES)) {
    hooks.set(stage, [])
}

const runHookWithTimeout = async (hook) => {
    try {
        await Promise.race([
            hook.callback(),
            new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Hook ${hook.id} timed out after ${hook.timeout}ms`))
                }, hook.timeout)
            })
        ])
        return null
    } catch (error) {
        const hookError = {
            hookId: hook.id,
            error,
            stage: currentStage,
            timeoutError: error.message.includes('timed out')
        }
        return hookError
    }
}

const runStage = async (stage) => {
    const logger = logging_getLogger()
    currentStage = stage
    const stageHooks = hooks.get(stage)
    const errors = []

    logger.debug(`Running preflight stage: ${stage}`)

    for (const hook of stageHooks) {
        logger.debug(`Running hook: ${hook.id}`)
        const error = await runHookWithTimeout(hook)
        if (error) {
            errors.push(error)
            logger.error(`Hook ${hook.id} failed:`, error)
        }
    }

    return errors
}

const preflight_registerHook = (stage, id, priority, callback, timeout = DEFAULT_TIMEOUT) => {
    const logger = logging_getLogger()

    if (!hooks.has(stage)) {
        throw new Error(`Invalid preflight stage: ${stage}`)
    }

    // Prevent duplicate hook IDs
    for (const [existingStage, existingHooks] of hooks.entries()) {
        if (existingHooks.some(h => h.id === id)) {
            throw new Error(`Hook ID ${id} already registered in stage ${existingStage}`)
        }
    }

    hooks.get(stage).push({ id, priority, callback, timeout })
    hooks.get(stage).sort((a, b) => b.priority - a.priority)
    
    logger.debug(`Registered preflight hook: ${id} in stage ${stage}`)
}
