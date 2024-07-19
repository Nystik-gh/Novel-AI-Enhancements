interface NAIE {
    registerSettings(): void
    registerFetchPreHook(): void
    registerFetchPostHook(): void
    COMMON: NAIECommon
}

interface NAIECommon {
    waitForElement(): Node
}

interface Window {
    NAIE_INSTANCE: NAIE
}
