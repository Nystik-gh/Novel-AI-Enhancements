/**
 * A hook for intercepting and modifying network requests
 * 
 * @interface
 */
interface RequestHook {
    /**
     * Unique identifier for the hook
     */
    id: string;

    /**
     * Whether the hook is currently active
     */
    enabled: boolean;

    /**
     * Priority level for hook execution (higher numbers run first)
     */
    priority: number;

    /**
     * URL pattern to match for this hook (string prefix or RegExp)
     */
    urlPattern: string | RegExp;

    /**
     * HTTP methods this hook handles (empty array means all methods)
     */
    methods: string[];
    
    /**
     * Modifies the request before it is sent
     * 
     * @param {Request} request - The request to modify
     * @returns {Promise<Request | BlockResponse>} Modified request or block response
     */
    modifyRequest?: (request: Request) => Promise<Request | BlockResponse>;

    /**
     * Modifies the response after it is received
     * 
     * @param {Response} response - The response to modify
     * @param {Request} request - The original request
     * @returns {Promise<Response>} Modified response
     */
    modifyResponse?: (response: Response, request: Request) => Promise<Response>;
}

/**
 * Network manager interface for registering and managing request hooks
 * 
 * @interface
 */
interface NetworkManager {
    /**
     * Registers a new request hook
     * 
     * @param {RequestHook} hook - The hook to register
     */
    registerHook(hook: RequestHook): void;

    /**
     * Unregisters a hook by its ID
     * 
     * @param {string} id - ID of the hook to unregister
     */
    unregisterHook(id: string): void;

    /**
     * Enables a hook by its ID
     * 
     * @param {string} id - ID of the hook to enable
     */
    enableHook(id: string): void;

    /**
     * Disables a hook by its ID
     * 
     * @param {string} id - ID of the hook to disable
     */
    disableHook(id: string): void;

    /**
     * Initializes the network manager and starts intercepting requests
     */
    initialize(): void;
}

/**
 * Interface for accessing the network module
 * 
 * @interface
 */
interface NAIENetwork {
    manager: NetworkManager
}
