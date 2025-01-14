/**
 * Main registration point for all shelf-related hooks
 */

const registerShelfHooks = () => {
    registerShelfGetHooks();
    registerShelfPutHooks();
    registerShelfPatchHooks();
    registerShelfDeleteHooks();
};
