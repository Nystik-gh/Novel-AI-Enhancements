/**
 * Internal state and management interface for NAIE
 * 
 * @interface
 */
interface NAIEInternal {
    /**
     * Set of script IDs that have been marked as ready
     */
    readyScripts: Set<string>

    /**
     * Set of script IDs that have been registered
     */
    registeredScripts: Set<string>

    /**
     * Whether the preflight process has started
     */
    isPreflightStarted: boolean

    /**
     * Preflight management
     */
    preflight: {
        runStages(): Promise<PreflightError[]>
    }
}

/**
 * Core script management interface
 * 
 * @interface
 */
interface NAIECore {
    /**
     * Register a feature script with NAIE
     * Must be called before markScriptReady
     * 
     * @param scriptId Unique identifier for the script
     */
    registerScript(scriptId: string): void

    /**
     * Mark a feature script as ready for preflight
     * Script must be registered first
     * 
     * @param scriptId Unique identifier for the script
     */
    markScriptReady(scriptId: string): Promise<void>
}
