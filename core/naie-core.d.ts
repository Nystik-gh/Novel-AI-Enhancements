interface NAIEInternal {
    readyScripts: Set<string>
    registeredScripts: Set<string>
    isPreflightStarted: boolean
    preflight: {
        runStages(): Promise<PreflightError[]>
    }
}

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

/**
 * Core services that are initialized and managed by NAIE
 * These services are singletons that provide functionality across the application
 * 
 * @interface
 */
interface NAIEServices {
    /**
     * Status indicator service for displaying messages and notifications
     */
    statusIndicator: NAIEStatusIndicator,
        
    /**
     * Modal observer service for detecting and interacting with NAI modals
     */
    modalObserver: NAIEModalObserver,
}

interface NAIE {
    HOOKS
    //SETTINGS
    MISC: MiscUtils
    DOM: DOMUtils
    NAI: NAIUtils
    EXTENSIONS: NAIEExtensions
    LOGGING: LoggingUtils
    PREFLIGHT: PreflightUtils
    CORE: NAIECore
    SERVICES: NAIEServices
    _internal: NAIEInternal
}

interface NAIUtils {}

interface Window {
    NAIE_INSTANCE: NAIE
}
