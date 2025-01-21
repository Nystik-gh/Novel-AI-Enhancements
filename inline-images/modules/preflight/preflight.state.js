let earlyHookResolve
let mainHookResolve

const earlyHookPromise = new Promise((resolve) => {
    earlyHookResolve = resolve
})

const mainHookPromise = new Promise((resolve) => {
    mainHookResolve = resolve
})

const notifyEarlyHookComplete = () => {
    earlyHookResolve()
}

const notifyMainHookComplete = () => {
    mainHookResolve()
}

const waitForEarlyPreflight = () => earlyHookPromise
const waitForMainPreflight = () => mainHookPromise
