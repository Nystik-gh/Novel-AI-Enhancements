type PreflightStage = 'early' | 'main' | 'late'

interface PreflightHook {
    id: string               // Unique identifier for the hook
    priority: number         // Higher = runs earlier
    timeout: number         // Milliseconds before timeout
    callback: () => Promise<void>
}

interface PreflightError {
    hookId: string
    error: Error
    stage: PreflightStage
    timeoutError?: boolean
}

/**
 * An interface defining functions for NAIE preflight
 *
 * @interface
 */
interface PreflightUtils {
    /**
     * Register a hook to be run during preflight
     * 
     * @param stage - The stage to run this hook in ('early', 'main', 'late')
     * @param id - Unique identifier for this hook
     * @param priority - Higher priority hooks run first (default: 0)
     * @param callback - Async function to run
     * @param timeout - Maximum time in ms to wait (default: 10000)
     */
    registerHook(
        stage: PreflightStage,
        id: string,
        priority: number,
        callback: () => Promise<void>,
        timeout?: number
    ): void
}
