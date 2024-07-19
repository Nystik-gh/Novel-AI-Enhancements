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
        COMMON: NAIE_COMMON_UTILS,
    }
}
