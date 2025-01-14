/**
 * Network module for handling API requests
 * Registers hooks with NAIE.NETWORK for intercepting and modifying requests/responses
 */

const initializeNetworkHooks = () => {
    // Initialize hooks for each endpoint group
    registerShelfHooks();
    
    // Future endpoint groups can be initialized here
    // initializeStoryHooks();
    // initializeContextHooks();
};
