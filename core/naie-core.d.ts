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
    NETWORK: NAIENetwork 
    //SETTINGS
    MISC: MiscUtils
    DOM: DOMUtils
    NAI: NAIUtils
    EXTENSIONS: NAIEExtensions
    LOGGING: NAIELogging
    PREFLIGHT: NAIEPreflight
    CORE: NAIECore
    SERVICES: NAIEServices
}

interface Window {
    NAIE_INSTANCE: NAIE
}
