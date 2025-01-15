/**
 * Hooks for handling DELETE requests to the shelves API endpoint
 */

const registerShelfDeleteHooks = () => {
    NAIE.NETWORK.manager.registerHook({
        id: 'shelf-delete',
        priority: 10,
        urlPattern: '/user/objects/shelf',
        methods: ['DELETE'],
        modifyRequest: async (request) => {
            const remoteId = request.url.split('/').pop();

            if (shelfState) {
                try {
                    const shelf = shelfState.getShelfByRemoteId(remoteId);
                    const parent = getMetadataObject(shelf)?.parent_id;
                    shelfState.deleteShelf(shelf.meta);

                    if (activeShelf === null) {
                        // we are deleting from the home shelf, manually restore hidden children of deleted parent
                        restoreSubshelvesOfParent(shelf.meta);
                    }

                    // we know delete sends us back to home if we're not, correct activeShelf to reflect that
                    activeShelf = null;

                    navigateToShelf(parent);
                    if (sidebarLock) {
                        sidebarLock.unlock();
                    }
                } catch (e) {
                    console.error('Error in delete request hook:', e);
                }
            }

            return {
                type: 'request',
                value: request
            };
        }
    });
};
