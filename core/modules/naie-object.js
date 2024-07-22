/***
 * @return {NAIE}
 */
const createNAIEInstance = () => {
    return {
        registerSettings: () => {
            console.log('register settings')
        },
        registerFetchPreHook: () => {
            console.log('register fetch pre hook')
        },
        registerFetchPostHook: () => {
            console.log('register fetch post hook')
        },
        DOM: DOM_UTILS,
    }
}
