// ==UserScript==
// THIS IS NOT A STANDALONE USER SCRIPT! DO NO INSTALL THIS SCRIPT DIRECTLY.
// @name         Novel AI Enhanced: Core
// @namespace    github.nystik-hg
// @version      1.0.4
// @description  Core library
// @author       Nystik (https://gitlab.com/Nystik)
// ==/UserScript==

;(() => {
    const wRef = unsafeWindow ? unsafeWindow : window

    /***
     * @type {NAIE}
     */
    let NAIE = null

    const coreInit = () => {
        const logger = LOGGING_UTILS.getLogger()
        if (!wRef.NAIE_INSTANCE) {
            logger.info('creating NAIE instance')
            wRef.NAIE_INSTANCE = createNAIEInstance()

            // Start waiting for scripts to register and become ready
            internal_startWaitingForScripts()
        } else {
            logger.info('NAIE instance already exists, skipping')
        }

        NAIE = wRef.NAIE_INSTANCE
    }

/* ############## xhook.js ############# */

// MODIFIED XHOOK CODE GOES HERE BECAUSE LOADING FROM GITLAB GIVES ERROR

//XHook - v0.0.0-git-tag - https://github.com/jpillora/xhook
//Jaime Pillora <dev@jpillora.com> - MIT Copyright 2024
const xhook = (function () {
    'use strict'

    const slice = (o, n) => Array.prototype.slice.call(o, n)

    let result = null

    //find global object
    if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
        result = self
    } else if (typeof global !== 'undefined') {
        result = global
    } else if (wRef) {
        result = wRef
    }

    const windowRef = result
    const documentRef = result.document

    const depricatedProp = (p) => ['returnValue', 'totalSize', 'position'].includes(p)

    const mergeObjects = function (src, dst) {
        for (let k in src) {
            if (depricatedProp(k)) {
                continue
            }
            const v = src[k]
            try {
                dst[k] = v
            } catch (error) {}
        }
        return dst
    }

    //create fake event
    const fakeEvent = function (type) {
        if (documentRef && documentRef.createEventObject != null) {
            const msieEventObject = documentRef.createEventObject()
            msieEventObject.type = type
            return msieEventObject
        }
        // on some platforms like android 4.1.2 and safari on windows, it appears
        // that new Event is not allowed
        try {
            return new Event(type)
        } catch (error) {
            return { type }
        }
    }

    //tiny event emitter
    const EventEmitter = function (nodeStyle) {
        //private
        let events = {}
        const listeners = (event) => events[event] || []
        //public
        const emitter = {}
        emitter.addEventListener = function (event, callback, i) {
            events[event] = listeners(event)
            if (events[event].indexOf(callback) >= 0) {
                return
            }
            i = i === undefined ? events[event].length : i
            events[event].splice(i, 0, callback)
        }
        emitter.removeEventListener = function (event, callback) {
            //remove all
            if (event === undefined) {
                events = {}
                return
            }
            //remove all of type event
            if (callback === undefined) {
                events[event] = []
            }
            //remove particular handler
            const i = listeners(event).indexOf(callback)
            if (i === -1) {
                return
            }
            listeners(event).splice(i, 1)
        }
        emitter.dispatchEvent = function () {
            const args = slice(arguments)
            const event = args.shift()
            if (!nodeStyle) {
                args[0] = mergeObjects(args[0], fakeEvent(event))
                Object.defineProperty(args[0], 'target', {
                    writable: false,
                    value: this,
                })
            }
            const legacylistener = emitter[`on${event}`]
            if (legacylistener) {
                legacylistener.apply(emitter, args)
            }
            const iterable = listeners(event).concat(listeners('*'))
            for (let i = 0; i < iterable.length; i++) {
                const listener = iterable[i]
                listener.apply(emitter, args)
            }
        }
        emitter._has = (event) => !!(events[event] || emitter[`on${event}`])
        //add extra aliases
        if (nodeStyle) {
            emitter.listeners = (event) => slice(listeners(event))
            emitter.on = emitter.addEventListener
            emitter.off = emitter.removeEventListener
            emitter.fire = emitter.dispatchEvent
            emitter.once = function (e, fn) {
                var fire = function () {
                    emitter.off(e, fire)
                    return fn.apply(null, arguments)
                }
                return emitter.on(e, fire)
            }
            emitter.destroy = () => (events = {})
        }

        return emitter
    }

    //helper
    const CRLF = '\r\n'

    const objectToString = function (headersObj) {
        const entries = Object.entries(headersObj)

        const headers = entries.map(([name, value]) => {
            return `${name.toLowerCase()}: ${value}`
        })

        return headers.join(CRLF)
    }

    const stringToObject = function (headersString, dest) {
        const headers = headersString.split(CRLF)
        if (dest == null) {
            dest = {}
        }

        for (let header of headers) {
            if (/([^:]+):\s*(.+)/.test(header)) {
                const name = RegExp.$1 != null ? RegExp.$1.toLowerCase() : undefined
                const value = RegExp.$2
                if (dest[name] == null) {
                    dest[name] = value
                }
            }
        }

        return dest
    }

    const convert = function (headers, dest) {
        switch (typeof headers) {
            case 'object': {
                return objectToString(headers)
            }
            case 'string': {
                return stringToObject(headers, dest)
            }
        }

        return []
    }

    var headers = { convert }

    /******************************************************************************
  Copyright (c) Microsoft Corporation.

  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */

    function __rest(s, e) {
        var t = {}
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p]
        if (s != null && typeof Object.getOwnPropertySymbols === 'function')
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]]
            }
        return t
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function (resolve) {
                      resolve(value)
                  })
        }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value))
                } catch (e) {
                    reject(e)
                }
            }
            function rejected(value) {
                try {
                    step(generator['throw'](value))
                } catch (e) {
                    reject(e)
                }
            }
            function step(result) {
                result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected)
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next())
        })
    }

    //global set of hook functions,
    //uses event emitter to store hooks
    const hooks = EventEmitter(true)

    //browser's fetch
    const Native = windowRef.fetch
    function copyToObjFromRequest(req) {
        const copyedKeys = [
            'method',
            'headers',
            'body',
            'mode',
            'credentials',
            'cache',
            'redirect',
            'referrer',
            'referrerPolicy',
            'integrity',
            'keepalive',
            'signal',
            'url',
        ]
        let copyedObj = {}
        copyedKeys.forEach((key) => (copyedObj[key] = req[key]))
        return copyedObj
    }
    function covertHeaderToPlainObj(headers) {
        if (headers instanceof Headers) {
            return covertTDAarryToObj([...headers.entries()])
        }
        if (Array.isArray(headers)) {
            return covertTDAarryToObj(headers)
        }
        return headers
    }
    function covertTDAarryToObj(input) {
        return input.reduce((prev, [key, value]) => {
            prev[key] = value
            return prev
        }, {})
    }
    /**
     * if fetch(hacked by Xhook) accept a Request as a first parameter, it will be destrcuted to a plain object.
     * Finally the whole network request was convert to fectch(Request.url, other options)
     */
    const Xhook = function (input, init = { headers: {} }) {
        let options = Object.assign(Object.assign({}, init), { isFetch: true })
        if (input instanceof Request) {
            const requestObj = copyToObjFromRequest(input)
            const prevHeaders = Object.assign(
                Object.assign({}, covertHeaderToPlainObj(requestObj.headers)),
                covertHeaderToPlainObj(options.headers),
            )
            options = Object.assign(Object.assign(Object.assign({}, requestObj), init), { headers: prevHeaders, acceptedRequest: true })
        } else {
            options.url = input
        }
        const beforeHooks = hooks.listeners('before')
        const afterHooks = hooks.listeners('after')
        return new Promise(function (resolve, reject) {
            let fullfiled = resolve
            const processAfter = function (response) {
                if (!afterHooks.length) {
                    return fullfiled(response)
                }
                const hook = afterHooks.shift()
                if (hook.length === 2) {
                    hook(options, response)
                    return processAfter(response)
                } else if (hook.length === 3) {
                    return hook(options, response, processAfter)
                } else {
                    return processAfter(response)
                }
            }
            const done = function (userResponse) {
                if (userResponse !== undefined) {
                    const response = new Response(userResponse.body || userResponse.text, userResponse)
                    resolve(response)
                    processAfter(response)
                    return
                }
                //continue processing until no hooks left
                processBefore()
            }
            const processBefore = function () {
                if (!beforeHooks.length) {
                    send()
                    return
                }
                const hook = beforeHooks.shift()
                if (hook.length === 1) {
                    return done(hook(options))
                } else if (hook.length === 2) {
                    return hook(options, done)
                }
            }
            const send = () =>
                __awaiter(this, void 0, void 0, function* () {
                    const { url, isFetch, acceptedRequest } = options,
                        restInit = __rest(options, ['url', 'isFetch', 'acceptedRequest'])
                    if (input instanceof Request && restInit.body instanceof ReadableStream) {
                        restInit.body = yield new Response(restInit.body).text()
                    }
                    return Native(url, restInit)
                        .then((response) => processAfter(response))
                        .catch(function (err) {
                            fullfiled = reject
                            processAfter(err)
                            return reject(err)
                        })
                })
            processBefore()
        })
    }
    //patch interface
    var fetch = {
        patch() {
            if (Native) {
                windowRef.fetch = Xhook
            }
        },
        unpatch() {
            if (Native) {
                windowRef.fetch = Native
            }
        },
        Native,
        Xhook,
    }

    //the global hooks event emitter is also the global xhook object
    //(not the best decision in hindsight)
    const xhook = hooks
    xhook.EventEmitter = EventEmitter
    //modify hooks
    xhook.before = function (handler, i) {
        if (handler.length < 1 || handler.length > 2) {
            throw 'invalid hook'
        }
        return xhook.on('before', handler, i)
    }
    xhook.after = function (handler, i) {
        if (handler.length < 2 || handler.length > 3) {
            throw 'invalid hook'
        }
        return xhook.on('after', handler, i)
    }

    //globally enable/disable
    xhook.enable = function () {
        //XMLHttpRequest.patch();
        fetch.patch()
    }
    xhook.disable = function () {
        //XMLHttpRequest.unpatch();
        fetch.unpatch()
    }
    //expose native objects
    //xhook.XMLHttpRequest = XMLHttpRequest.Native;
    xhook.fetch = fetch.Native

    //expose helpers
    xhook.headers = headers.convert

    //enable by default
    xhook.enable()

    return xhook
})()
//# sourceMappingURL=xhook.js.map


/* ---------- end of xhook.js ---------- */


/* ############# base64.js ############# */

const misc_decodeBase64 = (str) => {
    return atob(str)
}

const misc_encodeBase64 = (str) => {
    return btoa(str)
}


/* ---------- end of base64.js --------- */


/* ########## event-emitter.js ######### */

class misc_Emitter {
    constructor() {
        this.eventMap = new Map()
    }

    on(event, callback) {
        if (!this.eventMap.has(event)) {
            this.eventMap.set(event, [])
        }
        this.eventMap.get(event).push(callback)
    }

    off(event, callback) {
        if (this.eventMap.has(event)) {
            const callbacks = this.eventMap.get(event).filter((cb) => cb !== callback)
            this.eventMap.set(event, callbacks)
        }
    }

    emit(event, ...data) {
        if (this.eventMap.has(event)) {
            this.eventMap.get(event).forEach((callback) => {
                setTimeout(() => callback(...data), 0)
            })
        }
    }
}


/* ------ end of event-emitter.js ------ */


/* ########## misc-helpers.js ########## */

const misc_sleep = (duration) => {
    return new Promise((resolve) => {
        setTimeout(resolve, duration)
    })
}

const misc_isMobileView = () => {
    return wRef.innerWidth <= 650
}

const misc_isObjEmpty = (obj) => {
    for (const prop in obj) {
        if (Object.hasOwn(obj, prop)) {
            return false
        }
    }

    return true
}

const misc_addGlobalStyle = (css) => {
    var head, style
    head = document.getElementsByTagName('head')[0]
    if (!head) {
        return
    }
    style = document.createElement('style')
    style.type = 'text/css'
    style.innerHTML = css
    head.appendChild(style)
}


/* ------- end of misc-helpers.js ------ */


/* ############ misc.mod.js ############ */

/***
 * @type {MiscUtils}
 */
const MISC_UTILS = {
    Emitter: misc_Emitter,
    sleep: misc_sleep,
    isMobileView: misc_isMobileView,
    isObjEmpty: misc_isObjEmpty,
    addGlobalStyle: misc_addGlobalStyle,
    decodeBase64: misc_decodeBase64,
    encodeBase64: misc_encodeBase64,
}

/* --------- end of misc.mod.js -------- */


/* ############# logger.js ############# */

/**
 * @param {LogLevel} level
 * @throws {Error} If level is invalid
 */
const logging_setLogLevel = (level) => {
    const acceptableLevels = ['none', 'debug', 'info', 'warn', 'error']
    if (acceptableLevels.includes(level)) {
        localStorage.setItem('naie_log_level', level)
    } else {
        throw new Error('Invalid log level')
    }
}

/** @returns {LogLevel} */
const logging_getLogLevel = () => {
    return localStorage.getItem('naie_log_level') || 'none'
}

/** @returns {boolean} */
const logging_isDebugMode = () => {
    return logging_getLogLevel() === 'debug'
}

/**
 * Creates a no-op logger
 * @returns {Logger}
 */
const createNoOpLogger = () => ({
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {}
})

/**
 * Creates a log method
 * @param {string} level 
 * @returns {LogMethod}
 */
const createLogMethod = (level) => {
    const logFn = level === 'debug' ? console.log 
                : level === 'info' ? console.info
                : level === 'warn' ? console.warn
                : console.error

    return (message, ...args) => {
        logFn(`NAIE ${level.toUpperCase()}:`, message, ...args)
    }
}

/**
 * @param {LogLevel} level
 * @returns {Logger}
 */
const logging_createLogger = (level) => {
    const levels = ['debug', 'info', 'warn', 'error']
    const levelIndex = levels.indexOf(level)

    if (level === 'none' || levelIndex === -1) {
        return createNoOpLogger()
    }

    /** @type {Logger} */
    const logger = {}

    levels.forEach((currentLevel, index) => {
        if (index >= levelIndex) {
            logger[currentLevel] = createLogMethod(currentLevel)
        } else {
            logger[currentLevel] = () => {}
        }
    })

    return logger
}

/** @returns {Logger} */
const logging_getLogger = () => logging_createLogger(logging_getLogLevel())


/* ---------- end of logger.js --------- */


/* ########### logging.mod.js ########## */

/***
 * @type {LoggingUtils}
 */
const LOGGING_UTILS = {
    setLogLevel: logging_setLogLevel,
    getLogLevel: logging_getLogLevel,
    isDebugMode: logging_isDebugMode,
    createLogger: logging_createLogger,
    getLogger: logging_getLogger,
}


/* ------- end of logging.mod.js ------- */


/* ########## dom-selectors.js ######### */

const appSelector = '#app'
const settingsButtonSelector = 'button[aria-label="Open Settings"]'
const filterButtonSelector = 'button[aria-label="Open Sort Settings"]' // used to find the title bar
//const modalSelector = 'div[role="dialog"][aria-modal="true"]'

/* ------ end of dom-selectors.js ------ */


/* ########### dom-events.js ########### */

const dom_onClickOutside = (element, callback, oneShot = false) => {
    const outsideClickListener = (event) => {
        if (!event.composedPath().includes(element)) {
            if (oneShot) {
                removeClickListener()
            }
            callback()
        }
    }

    const removeClickListener = () => {
        document.removeEventListener('click', outsideClickListener)
    }

    document.addEventListener('click', outsideClickListener)

    // Return a handle to manually remove the listener
    return { remove: removeClickListener }
}

const dom_addEventListenerOnce = (element, event, handler) => {
    const flag = `listenerAdded_${event}_${handler.name}`

    if (!element.dataset[flag]) {
        element.addEventListener(event, handler)

        element.dataset[flag] = 'true'
    }
}


/* -------- end of dom-events.js ------- */


/* ########### dom-helpers.js ########## */

const dom_createElement = (tag, styles = {}) => {
    const element = document.createElement(tag)
    Object.assign(element.style, styles)
    return element
}

const dom_findElementWithMaskImage = (elements, urlSubstrings) => {
    return [...elements].filter((element) => {
        if (!element) return false

        const computedStyle = wRef.getComputedStyle(element)
        const maskImageValue = computedStyle.getPropertyValue('mask-image') || computedStyle.getPropertyValue('-webkit-mask-image')

        return maskImageValue && urlSubstrings.every((sub) => maskImageValue.includes(sub))
    })
}

const dom_setNativeValue = (element, value) => {
    const descriptor = Object.getOwnPropertyDescriptor(element, 'value')
    const valueSetter = descriptor ? descriptor.set : null

    if (!valueSetter) {
        throw new Error('No value setter found on element')
    }

    const prototype = Object.getPrototypeOf(element)
    const prototypeDescriptor = Object.getOwnPropertyDescriptor(prototype, 'value')
    const prototypeValueSetter = prototypeDescriptor ? prototypeDescriptor.set : null

    if (prototypeValueSetter && prototypeValueSetter !== valueSetter) {
        prototypeValueSetter.call(element, value)
    } else {
        valueSetter.call(element, value)
    }
}


/* ------- end of dom-helpers.js ------- */


/* ######### simulate-events.js ######## */

const dom_simulateClick = (element) => {
    if (element) {
        element.click()
    }
}

const dom_simulateRightClick = (element) => {
    const evt = new Event('contextmenu', { bubbles: true, cancelable: false })
    element.dispatchEvent(evt)
}

const dom_simulateInputEvent = (element) => {
    element.dispatchEvent(new Event('input', { bubbles: true }))
}


/* ----- end of simulate-events.js ----- */


/* ######## wait-for-element.js ######## */

const dom_waitForElement = (selector, timeout, rootElement = document.body) => {
    const getElement = () => document.querySelector(selector)

    return new Promise((resolve) => {
        const element = getElement()
        if (element) {
            resolve(element)
        } else {
            const observer = new MutationObserver((mutationsList, observer) => {
                const element = getElement()
                if (element) {
                    observer.disconnect()
                    resolve(element)
                }
            })

            observer.observe(rootElement, { childList: true, subtree: true, attributes: true })

            if (timeout) {
                setTimeout(() => {
                    observer.disconnect()
                    const element = getElement()
                    resolve(element || null)
                }, timeout)
            }
        }
    })
}


/* ----- end of wait-for-element.js ---- */


/* ############# dom.mod.js ############ */

/***
 * @type {DOMUtils}
 */
const DOM_UTILS = {
    waitForElement: dom_waitForElement,
    createElement: dom_createElement,
    findElementWithMaskImage: dom_findElementWithMaskImage,
    setNativeValue: dom_setNativeValue,
    simulateClick: dom_simulateClick,
    simulateInputEvent: dom_simulateInputEvent,
    simulateRightClick: dom_simulateRightClick,
    onClickOutside: dom_onClickOutside,
    addEventListenerOnce: dom_addEventListenerOnce,
}


/* --------- end of dom.mod.js --------- */


/* #### select-control.templates.js #### */

let selectControlTemplate = null

const controls_initSelectTemplate = async () => {
    LOGGING_UTILS.getLogger().debug('controls_initSelectTemplate')
    try {
        // Use the custom template instead of cloning from settings
        selectControlTemplate = controls_createCustomSelectTemplate()

        // Add global style for focus override
        MISC_UTILS.addGlobalStyle(`
            .naie-focus-override:focus-within {
                opacity: 1 !important;
            }
        `)
    } catch (e) {
        LOGGING_UTILS.getLogger().error('Failed to create custom select element:', e)
        throw new Error('Failed to create custom select element')
    }
}

// New custom template creation
const controls_createCustomSelectTemplate = () => {
    // Create main container
    const container = document.createElement('div')
    container.className = 'custom-select select naie-select-box'
    Object.assign(container.style, {
        position: 'relative',
        boxSizing: 'border-box',
        flex: '1 1 auto',
        overflow: 'visible',
        boxShadow: '0 0 1px 0 rgba(255, 255, 255, 0.6)',
    })

    // Create control container
    const control = document.createElement('div')
    control.className = 'naie-select-control'
    Object.assign(control.style, {
        alignItems: 'center',
        cursor: 'pointer',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        minHeight: '24px',
        outline: 'none',
        position: 'relative',
        transition: 'all 100ms',
        backgroundColor: 'transparent',
        borderColor: '#13152C',
        borderRadius: '0',
        borderStyle: 'solid',
        borderWidth: '0',
        boxShadow: 'none',
        boxSizing: 'border-box',
        border: 'none',
    })

    // Create value container
    const valueContainer = document.createElement('div')
    valueContainer.className = 'naie-select-input-wrapper'
    Object.assign(valueContainer.style, {
        alignItems: 'center',
        display: 'flex',
        flex: '1',
        flexWrap: 'wrap',
        padding: '0px 8px 0 10px',
        boxSizing: 'border-box',
        height: '24px',
    })

    // Create single value display
    const singleValue = document.createElement('div')
    const valueSpan = document.createElement('span')
    valueSpan.className = 'naie-select-value'
    valueSpan.textContent = ''
    Object.assign(valueSpan.style, {
        color: 'rgb(255, 255, 255)',
        width: '100%',
    })
    singleValue.appendChild(valueSpan)

    // Create input container
    const inputContainer = document.createElement('div')
    const input = document.createElement('input')
    input.className = 'naie-select-input'
    Object.assign(input.style, {
        color: 'inherit',
        background: '0',
        opacity: '1',
        width: '100%',
        grid: '1 / 2',
        font: 'inherit',
        minWidth: '2px',
        border: '0',
        margin: '0',
        outline: '0',
        padding: '0',
    })
    input.setAttribute('autocapitalize', 'none')
    input.setAttribute('autocomplete', 'off')
    input.setAttribute('autocorrect', 'off')
    input.setAttribute('spellcheck', 'false')
    input.setAttribute('tabindex', '0')
    input.setAttribute('type', 'text')
    input.setAttribute('aria-autocomplete', 'list')
    input.setAttribute('aria-expanded', 'false')
    input.setAttribute('aria-haspopup', 'true')
    input.setAttribute('role', 'combobox')
    inputContainer.appendChild(input)

    // Create indicators container
    const indicatorsContainer = document.createElement('div')
    Object.assign(indicatorsContainer.style, {
        alignItems: 'center',
        alignSelf: 'stretch',
        display: 'flex',
        flexShrink: '0',
        boxSizing: 'border-box',
        padding: '0',
        height: '22px',
    })

    // Create separator
    const separator = document.createElement('span')
    Object.assign(separator.style, {
        alignSelf: 'stretch',
        width: '1px',
        backgroundColor: '#13152C',
        marginBottom: '8px',
        marginTop: '8px',
        boxSizing: 'border-box',
    })

    // Create dropdown indicator
    const dropdownIndicator = document.createElement('div')
    dropdownIndicator.setAttribute('aria-hidden', 'true')
    Object.assign(dropdownIndicator.style, {
        display: 'flex',
        transition: 'color 150ms',
        color: '#FFFFFF',
        padding: '8px',
        boxSizing: 'border-box',
    })

    // Create dropdown arrow SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('height', '20')
    svg.setAttribute('width', '20')
    svg.setAttribute('viewBox', '0 0 20 20')
    svg.setAttribute('aria-hidden', 'true')
    svg.setAttribute('focusable', 'false')
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute(
        'd',
        'M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z',
    )
    svg.appendChild(path)
    dropdownIndicator.appendChild(svg)

    // Assemble the component
    indicatorsContainer.appendChild(separator)
    indicatorsContainer.appendChild(dropdownIndicator)
    valueContainer.appendChild(singleValue)
    valueContainer.appendChild(inputContainer)
    control.appendChild(valueContainer)
    control.appendChild(indicatorsContainer)
    container.appendChild(control)

    return container
}

const controls_getTemplate = () => {
    if (!selectControlTemplate) {
        throw new Error('Select control template not initialized')
    }
    return selectControlTemplate.cloneNode(true)
}


/* - end of select-control.templates.js  */


/* ############ templates.js ########### */

/**
 * Internal function to initialize all control templates
 * Each template's initialization is self-contained and independent
 */
const controls_initializeTemplates = async () => {
    const logger = LOGGING_UTILS.getLogger()
    logger.debug('Initializing control templates')

    try {
        await controls_initSelectTemplate()
        // Future template initializations would go here
        // Each should handle its own setup/cleanup
        
        logger.debug('Control templates initialized successfully')
    } catch (error) {
        logger.error('Failed to initialize control templates:', error)
        throw error
    }
}


/* -------- end of templates.js -------- */


/* ############# select.js ############# */

// Styles for the dropdown container
const DROPDOWN_CONTAINER_STYLES = {
    top: '100%',
    position: 'absolute',
    width: '100%',
    zIndex: '1',
    backgroundColor: 'rgb(26, 28, 46)',
    borderRadius: '0px',
    boxShadow: 'rgba(52, 56, 92, 0.6) 0px 0px 0px 1px, rgba(0, 0, 0, 0.2) 0px 4px 11px',
    boxSizing: 'border-box',
    margin: '0px',
}

// Styles for the options list container
const DROPDOWN_LIST_STYLES = {
    maxHeight: '200px',
    overflowY: 'auto',
    position: 'relative',
    boxSizing: 'border-box',
    padding: '0px',
}

// Common styles for dropdown options
const DROPDOWN_OPTION_STYLES = {
    cursor: 'pointer',
    display: 'block',
    fontSize: 'inherit',
    width: '100%',
    userSelect: 'none',
    webkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
    color: 'rgb(255, 255, 255)',
    padding: '8px 12px',
    boxSizing: 'border-box',
}

const DROPDOWN_NO_OPTIONS_STYLES = {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.6)',
    padding: '8px 12px',
    boxSizing: 'border-box',
    display: 'none',
}

const controls_createSelectDropdown = (options, selectedValue) => {
    const dropdownContainer = NAIE.DOM.createElement('div', DROPDOWN_CONTAINER_STYLES)
    const optionsList = NAIE.DOM.createElement('div', DROPDOWN_LIST_STYLES)
    dropdownContainer.appendChild(optionsList)

    options.forEach(({ title, value }) => {
        const optionElement = NAIE.DOM.createElement('div', {
            ...DROPDOWN_OPTION_STYLES,
            backgroundColor: value === selectedValue ? 'rgb(16, 18, 36)' : 'transparent',
        })

        optionElement.setAttribute('aria-disabled', 'false')
        optionElement.setAttribute('tabindex', '-1')
        optionElement.setAttribute('data-option-value', value)

        const optionText = NAIE.DOM.createElement('span')
        optionText.textContent = title
        optionElement.appendChild(optionText)

        optionsList.appendChild(optionElement)
    })

    const noOptions = NAIE.DOM.createElement('div', DROPDOWN_NO_OPTIONS_STYLES)
    noOptions.classList.add('naie-select-no-options')
    noOptions.textContent = 'No options'
    optionsList.appendChild(noOptions)

    return dropdownContainer
}

const controls_constructSelectControl = (options, selectedValue, onChange) => {
    const template = controls_getTemplate()
    const controlElement = template.querySelector('.naie-select-control')
    const singleValueElement = template.querySelector('.naie-select-value')
    const inputElement = template.querySelector('.naie-select-input')
    const inputWrapper = template.querySelector('.naie-select-input-wrapper')

    const selectedOption = options.find((option) => option.value === selectedValue)
    if (selectedOption) {
        singleValueElement.textContent = selectedOption.title
    }

    const dropdown = controls_createSelectDropdown(options, selectedValue)
    dropdown.style.display = 'none'
    template.appendChild(dropdown)

    const updateDropdown = (filterText = '') => {
        let visibleOptionsCount = 0
        const optionElements = dropdown.querySelectorAll('[data-option-value]')
        const noOptions = dropdown.querySelector('.naie-select-no-options')
        optionElements.forEach((optionElement) => {
            const title = optionElement.textContent.toLowerCase()
            if (title.includes(filterText.toLowerCase())) {
                optionElement.style.display = 'block'
                visibleOptionsCount++
            } else {
                optionElement.style.display = 'none'
            }
        })

        if (visibleOptionsCount === 0) {
            noOptions.style.display = 'block'
        } else {
            noOptions.style.display = 'none'
        }
    }

    const toggleDropdown = () => {
        dropdown.style.display === 'none' ? showDropdown() : hideDropdown()
    }

    let outsideClickHandle = null

    const showDropdown = () => {
        dropdown.style.display = 'block'
        //singleValueElement.style.display = 'none'
        inputElement.focus()

        outsideClickHandle = OnClickOutside(
            template,
            () => {
                hideDropdown()
            },
            true,
        )
    }

    const hideDropdown = () => {
        dropdown.style.display = 'none'
        singleValueElement.style.display = 'block'
        inputElement.value = ''
        updateDropdown()

        if (outsideClickHandle) {
            outsideClickHandle.remove()
            outsideClickHandle = null
        }
    }

    controlElement.addEventListener('click', toggleDropdown)

    inputElement.addEventListener('input', (e) => {
        inputElement.value = e.target.value
        inputElement.parentNode.dataset['value'] = e.target.value

        if (e.target.value.length > 0) {
            singleValueElement.style.display = 'none'
            inputWrapper.classList.add('naie-focus-override')
        } else {
            singleValueElement.style.display = 'block'
        }

        updateDropdown(e.target.value)
    })

    const optionElements = dropdown.querySelectorAll('[data-option-value]')
    optionElements.forEach((optionElement) => {
        optionElement.addEventListener('click', () => {
            const newValue = optionElement.getAttribute('data-option-value')
            const newTitle = optionElement.textContent
            singleValueElement.textContent = newTitle
            hideDropdown()

            optionElements.forEach((el) => {
                el.style.backgroundColor = el === optionElement ? 'rgb(16, 18, 36)' : 'transparent'
            })

            onChange(newValue)
        })
    })

    return template
}


/* ---------- end of select.js --------- */


/* ############ indicator.js ########### */

const saveIndicatorSelector = '.save-indicator'
const naieIndicatorSelector = '.naie-status-indicator'

const extensions_createNAIEindicatorElement = () => {
    const saveIndicator = document.querySelector(saveIndicatorSelector)

    const container = document.createElement('div')
    container.classList.add(naieIndicatorSelector.substring(1))
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 5px;
        pointer-events: none;
    `

    // Copy relevant styles from save indicator
    const saveStyles = wRef.getComputedStyle(saveIndicator)
    container.style.font = saveStyles.font
    container.style.color = saveStyles.color

    document.body.appendChild(container)
    return container
}

const extensions_getNAIEindicator = () => {
    return document.querySelector(naieIndicatorSelector)
}

const extensions_createMessageManager = () => {
    let messageQueue = []

    const pushMessage = (message) => {
        messageQueue.push(message)
    }

    const popMessage = () => {
        return messageQueue.shift()
    }

    const hasMessages = () => {
        return messageQueue.length > 0
    }

    return {
        pushMessage,
        popMessage,
        hasMessages,
    }
}

const extensions_createIndicatorManager = (logContainer, maxRows, duration = 2000) => {
    const messageManager = extensions_createMessageManager()
    const staggerDelay = 300 // Minimum delay between message insertions
    let isInserting = false
    let lastInsertTime = 0

    const processMessageQueue = async () => {
        if (isInserting || !messageManager.hasMessages() || logContainer.children.length >= maxRows) {
            return
        }

        isInserting = true
        const message = messageManager.popMessage()

        const messageElement = document.createElement('div')
        messageElement.className = 'notification'
        messageElement.textContent = message

        // Calculate time since last insert
        const now = Date.now()
        const timeSinceLastInsert = now - lastInsertTime
        const delayNeeded = Math.max(0, staggerDelay - timeSinceLastInsert)

        // Only wait if we need to
        if (delayNeeded > 0) {
            await new Promise((r) => setTimeout(r, delayNeeded))
        }

        logContainer.appendChild(messageElement)
        lastInsertTime = Date.now() // Update after any delay
        isInserting = false

        setTimeout(() => {
            messageElement.classList.add('fade-out')
            setTimeout(() => {
                if (messageElement.parentNode === logContainer) {
                    logContainer.removeChild(messageElement)
                }
                processMessageQueue() // Try to show next message
            }, 500) // need to match css transition time
        }, duration)

        // If we still have room, process next message
        if (logContainer.children.length < maxRows) {
            processMessageQueue()
        }
    }

    const displayMessage = (message) => {
        messageManager.pushMessage(message)
        processMessageQueue()
    }

    return {
        displayMessage,
    }
}

const extensions_createNAIEIndicator = () => {
    const maxRows = 5
    const duration = 2000

    const container = extensions_createNAIEindicatorElement()
    const manager = extensions_createIndicatorManager(container, maxRows, duration)

    return manager
}


/* -------- end of indicator.js -------- */


/* ########### page-loader.js ########## */

let loaderTemplate = null

const extensions_lockLoader = (app) => {
    if (loaderTemplate === null) {
        loaderTemplate = app.firstChild.cloneNode(true)
    }

    const loader = loaderTemplate.cloneNode(true)

    loader.id = 'loader-lock'
    loader.style.zIndex = '1000'

    document.documentElement.append(loader)

    const unlock = () => {
        //console.log('unlocking loader')
        document.documentElement.removeChild(loader)
    }
    return { unlock }
}

const extensions_getSpinner = () => {
    return loaderTemplate.firstChild.cloneNode(true)
}

/* ------- end of page-loader.js ------- */


/* ########## controls.mod.js ########## */

/***
 * @type {NAIEControls}
 */
const CONTROLS_UTILS = {
    Select: {
        constructSelectControl: controls_constructSelectControl
    }
}


/* ------- end of controls.mod.js ------ */


/* ########## indicator.mod.js ######### */

/***
 * @type {NAIEIndicatorUtils}
 */
const INDICATOR_UTILS = {
    createNAIEindicatorElement: extensions_createNAIEindicatorElement,
    getNAIEindicator: extensions_getNAIEindicator,
    createMessageManager: extensions_createMessageManager,
    createIndicatorManager: extensions_createIndicatorManager,
    createNAIEIndicator: extensions_createNAIEIndicator,
}


/* ------ end of indicator.mod.js ------ */


/* ########### loaders.mod.js ########## */

/***
 * @type {NAIELoader}
 */
const LOADER = {
    lockLoader: extensions_lockLoader,
    getSpinner: extensions_getSpinner
}


/* ------- end of loaders.mod.js ------- */


/* ######### extensions.mod.js ######### */

/***
 * @type {NAIEExtensions}
 */
const EXTENSIONS = {
    Loader: LOADER,
    Controls: CONTROLS_UTILS,
}


/* ------ end of extensions.mod.js ----- */


/* ########## request.utils.js ######### */

/**
 * Extracts fetch options from a request object
 *
 * @param {Request} request - The request to extract options from
 * @returns {Object} The fetch options
 */
const network_getFetchOptions = (request) => {
    return {
        method: request.method,
        headers: request.headers,
        body: request.body,
        timeout: request.timeout,
        credentials: request.withCredentials ? 'include' : 'same-origin',
    }
}


/* ------ end of request.utils.js ------ */


/* ######### manager.network.js ######## */

/**
 * Base URL for the NovelAI API
 */
const API_BASE_URL = 'https://api.novelai.net'

/**
 * Creates a network manager for intercepting and modifying requests
 *
 * @returns {NetworkManager} The network manager instance
 */
const network_createNetworkManager = () => {
    const hooks = []
    const nativeFetch = xhook.fetch.bind(wRef)

    /**
     * Gets the matching hooks for a given URL and method
     *
     * @param {RequestHook[]} hooks - The list of hooks
     * @param {string} url - The URL of the request
     * @param {string} method - The method of the request
     * @returns {RequestHook[]} The matching hooks
     */
    const getMatchingHooks = (hooks, url, method) => {
        // Skip data URLs and requests without methods
        if (!method || url.startsWith('data:')) {
            return []
        }

        return hooks.filter(
            (hook) =>
                hook.enabled &&
                (hook.methods.length === 0 || hook.methods.includes(method.toUpperCase())) &&
                (typeof hook.urlPattern === 'string' ? url.startsWith(API_BASE_URL + hook.urlPattern) : hook.urlPattern.test(url)),
        )
    }

    /**
     * Processes a request by chaining modifications from matching hooks
     *
     * @param {RequestHook[]} hooks - The list of hooks
     * @param {function} nativeFetch - The native fetch function
     * @returns {function} The request processing function
     */
    const processRequest = (hooks, nativeFetch) => async (request) => {
        // Skip data URLs and requests without methods
        if (!request.method || request.url.startsWith('data:')) {
            return nativeFetch(request.url, request)
        }

        const matchingHooks = getMatchingHooks(hooks, request.url, request.method)

        // Chain request modifications
        let modifiedRequest = request
        for (const hook of matchingHooks) {
            if (hook.modifyRequest) {
                const result = await hook.modifyRequest(modifiedRequest)
                // If the hook returns a Response directly, return it without making the request
                if (result.type === 'response') {
                    return result.value
                }
                // Otherwise, use the modified request
                modifiedRequest = result.value
            }
        }

        // Make the actual request
        const response = await nativeFetch(modifiedRequest.url, modifiedRequest)

        // Chain response modifications
        let modifiedResponse = response
        for (const hook of matchingHooks) {
            if (hook.modifyResponse) {
                modifiedResponse = await hook.modifyResponse(modifiedResponse, request)
            }
        }

        return modifiedResponse
    }

    /**
     * Initializes the network manager by setting up the xhook
     */
    const initialize = () => {
        xhook.before((request, callback) => {
            processRequest(
                hooks,
                nativeFetch,
            )(request)
                .then(callback)
                .catch((error) => {
                    LOGGING_UTILS.getLogger().error('Hook processing error:', error)
                    nativeFetch(request.url, request).then(callback)
                })
        })
    }

    return {
        /**
         * Registers a hook with the network manager
         *
         * @param {RequestHook} hook - The hook to register
         */
        registerHook: (hook) => {
            hooks.push({ ...hook, enabled: true })
            hooks.sort((a, b) => b.priority - a.priority)
        },
        /**
         * Unregisters a hook with the network manager
         *
         * @param {string} id - The ID of the hook to unregister
         */
        unregisterHook: (id) => {
            const index = hooks.findIndex((h) => h.id === id)
            if (index !== -1) hooks.splice(index, 1)
        },
        /**
         * Enables a hook with the network manager
         *
         * @param {string} id - The ID of the hook to enable
         */
        enableHook: (id) => {
            const hook = hooks.find((h) => h.id === id)
            if (hook) hook.enabled = true
        },
        /**
         * Disables a hook with the network manager
         *
         * @param {string} id - The ID of the hook to disable
         */
        disableHook: (id) => {
            const hook = hooks.find((h) => h.id === id)
            if (hook) hook.enabled = false
        },
        initialize,
        API_BASE_URL,
    }
}


/* ----- end of manager.network.js ----- */


/* ########### network.mod.js ########## */

/**
 * @type {NAIENetwork}
 */
const NERWORK_UTILS = {
    manager: network_createNetworkManager(),
    getFetchOptions: network_getFetchOptions,
}


/* ------- end of network.mod.js ------- */


/* ############## theme.js ############# */

const waitForThemePanel = async (modal) => {
    LOGGING_UTILS.getLogger().debug('waitForThemePanel')
    const content = modal.querySelector('.settings-content')
    LOGGING_UTILS.getLogger().debug('content', content)

    if (!content) {
        throw new Error('settings content not found')
    }

    const themeIndicator = await DOM_UTILS.waitForElement('button[aria-label="Import Theme File"]', 15000)

    if (!themeIndicator) {
        throw new Error('cannot identify theme panel')
    }

    const fontSelect = content.querySelector('.font-select')

    return { fontSelect }
}


/* ---------- end of theme.js ---------- */


/* ############ settings.js ############ */

const getSettingsButton = () => {
    return document.querySelector(settingsButtonSelector)
}

const waitForSettingsModal = async (timeout = 5000, hidden = false) => {
    const modalData = await NAIE_SERVICES.modalObserver.waitForSpecificModal(
        (modal) => modal.modal.querySelector('.settings-sidebar'),
        timeout
    )

    if (hidden && modalData.overlay) {
        modalData.overlay.style.display = 'none'
    }

    const sidebar = modalData.modal.querySelector('.settings-sidebar')

    const { tabs, changelog, logout, closeButton } = MISC_UTILS.isMobileView()
        ? await handleSettingsMobile(modalData.modal, sidebar)
        : await handleSettingsDesktop(modalData.modal, sidebar)

    return {
        modal: modalData.modal,
        overlay: modalData.overlay,
        closeButton: modalData.closeButton,
        tabs,
        extra: { changelog, logout },
        panels: {
            getThemePanel: () => getPanel(modalData.modal, tabs.theme, waitForThemePanel),
        },
    }
}

const handleSettingsDesktop = async (modal, sidebar) => {
    do {
        await MISC_UTILS.sleep(50)
    } while (sidebar?.parentNode?.parentNode?.previousSibling?.tagName?.toLowerCase() !== 'button')

    const buttons = sidebar.querySelectorAll('button')

    if (buttons.length < 9) {
        throw new Error('Not all required buttons are found')
    }

    const tabs = {
        ai_settings: buttons[0],
        interface: buttons[1],
        theme: buttons[2],
        account: buttons[3],
        text_to_speech: buttons[4],
        defaults: buttons[5],
        hotkeys: buttons[6],
    }

    const changelog = buttons[7]
    const logout = buttons[8]
    const closeButton = sidebar.parentNode.parentNode.previousSibling

    return { tabs, changelog, logout, closeButton }
}

const handleSettingsMobile = async (modal, sidebar) => {
    const buttons = sidebar.querySelectorAll('button')

    if (buttons.length < 9) {
        throw new Error('Not all required buttons are found')
    }

    const tabs = {
        ai_settings: buttons[1],
        interface: buttons[2],
        theme: buttons[3],
        account: buttons[4],
        text_to_speech: buttons[5],
        defaults: buttons[6],
    }

    const changelog = buttons[7]
    const logout = buttons[8]
    const closeButton = modal.querySelector('button[aria-label="Close"]')

    return { tabs, changelog, logout, closeButton }
}

const getPanel = async (modal, button, waitForFunction) => {
    DOM_UTILS.simulateClick(button)
    await MISC_UTILS.sleep(100)
    return await waitForFunction(modal)
}


/* --------- end of settings.js -------- */


/* ######### modal-observer.js ######### */

const modalSelector = 'div[role="dialog"][aria-modal="true"]'

const naie_initModalObserver = () => {
    const emitter = new MISC_UTILS.Emitter()
    const observerOptions = {
        childList: true,
    }

    const observerCallback = async (mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const addedNodes = Array.from(mutation.addedNodes)
                const projectionNode = addedNodes.find(
                    (node) => node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('data-projection-id'),
                )

                if (projectionNode) {
                    const modal = await naie_collectModal(projectionNode)

                    if (modal) {
                        emitter.emit('modal', modal)
                        break
                    }
                }
            }
        }
    }

    const modalObserver = new MutationObserver(observerCallback)
    modalObserver.observe(document.body, observerOptions)

    const waitForSpecificModal = (predicate, timeout = 5000) => {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                emitter.off('modal', handler)
                reject(new Error('Modal wait timeout'))
            }, timeout)

            const handler = (modalData) => {
                if (predicate(modalData)) {
                    clearTimeout(timeoutId)
                    emitter.off('modal', handler)
                    resolve(modalData)
                }
            }

            emitter.on('modal', handler)
        })
    }

    return { emitter, observer: modalObserver, waitForSpecificModal }
}

const naie_collectModal = async (candidate) => {
    const modal = candidate.querySelector(modalSelector)

    if (!modal) {
        return null
    }

    try {
        const closeButton = await naie_waitForModalCloseButton(modal, 1000)
        return {
            overlay: candidate,
            modal,
            closeButton,
        }
    } catch (e) {
        LOGGING_UTILS.getLogger().debug('failed to find close button', e)
        return null
    }
}

const naie_waitForModalCloseButton = (modal, timeout) => {
    return new Promise((resolve, reject) => {
        const checkCloseButton = () => {
            const matches = DOM_UTILS.findElementWithMaskImage(modal.querySelectorAll('button, button > div'), ['cross', '.svg'])

            if (matches.length > 0) {
                resolve(matches[0])
            } else {
                requestAnimationFrame(checkCloseButton)
            }
        }

        if (timeout) {
            setTimeout(() => {
                reject(new Error('Timeout: Close button not found within specified time'))
            }, timeout)
        }

        checkCloseButton()
    })
}


/* ------ end of modal-observer.js ----- */


/* ############ titlebar.js ############ */

const nai_findTitleBar = () => {
    // Find the button with aria-label="Open Sort Settings"
    const sortSettingsButton = document.querySelector(filterButtonSelector)

    // manually traverse dom to expected home button
    const titleBarCandidate = sortSettingsButton?.parentNode?.parentElement

    if (titleBarCandidate && titleBarCandidate.tagName === 'DIV') {
        return titleBarCandidate
    }

    return null
}


/* --------- end of titlebar.js -------- */


/* ############# nai.mod.js ############ */

/***
 * @type {NAIUtils}
 */
const NAI_UTILS = {
    findTitleBar: nai_findTitleBar,
}


/* --------- end of nai.mod.js --------- */


/* ######### hooks.preflight.js ######## */

// Internal stages not exposed to external scripts
const INTERNAL_STAGES = {
    INTERNAL: 'internal'
}

// Public stages that can be used by external scripts
const STAGES = {
    EARLY: 'early',
    MAIN: 'main',
    LATE: 'late'
}

const ALL_STAGES = { ...INTERNAL_STAGES, ...STAGES }

const DEFAULT_TIMEOUT = 10000 // 10 seconds
let currentStage = null

// Initialize hook storage
const hooks = new Map()
for (const stage of Object.values(ALL_STAGES)) {
    hooks.set(stage, [])
}

const runHookWithTimeout = async (hook) => {
    try {
        await Promise.race([
            hook.callback(),
            new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Hook ${hook.id} timed out after ${hook.timeout}ms`))
                }, hook.timeout)
            })
        ])
        return null
    } catch (error) {
        const hookError = {
            hookId: hook.id,
            error,
            stage: currentStage,
            timeoutError: error.message.includes('timed out')
        }
        return hookError
    }
}

const runStage = async (stage) => {
    const logger = LOGGING_UTILS.getLogger()
    currentStage = stage
    const stageHooks = hooks.get(stage) || []
    const errors = []

    if (stageHooks.length === 0) {
        logger.debug(`No hooks registered for stage: ${stage}`)
        return errors
    }

    logger.debug(`Running preflight stage: ${stage}`)

    for (const hook of stageHooks) {
        logger.debug(`Running hook: ${hook.id}`)
        const error = await runHookWithTimeout(hook)
        if (error) {
            errors.push(error)
            logger.error(`Hook ${hook.id} failed:`, error)
        }
    }

    return errors
}

const preflight_registerHook = (stage, id, priority, callback, timeout = DEFAULT_TIMEOUT) => {
    const logger = LOGGING_UTILS.getLogger()

    // Prevent external scripts from using internal stages
    if (INTERNAL_STAGES[stage]) {
        throw new Error(`Stage '${stage}' is reserved for internal use`)
    }

    if (!hooks.has(stage)) {
        throw new Error(`Invalid stage: ${stage}`)
    }

    const stageHooks = hooks.get(stage)
    const hook = {
        id,
        priority: priority || 0,
        callback,
        timeout
    }

    // Insert hook in priority order (higher priority first)
    const index = stageHooks.findIndex(h => (h.priority || 0) < (hook.priority || 0))
    if (index === -1) {
        stageHooks.push(hook)
    } else {
        stageHooks.splice(index, 0, hook)
    }

    logger.debug(`Registered preflight hook: ${id} in stage ${stage}`)
}


/* ----- end of hooks.preflight.js ----- */


/* ########## preflight.mod.js ######### */

/***
 * @type {NAIEPreflight}
 */
const PREFLIGHT_UTILS = {
    registerHook: preflight_registerHook,
}

// Internal function to register hooks in internal stages
const registerInternalHook = (id, priority, callback, timeout = DEFAULT_TIMEOUT) => {
    const stageHooks = hooks.get(INTERNAL_STAGES.INTERNAL)
    const hook = {
        id,
        priority: priority || 0,
        callback,
        timeout,
    }

    // Insert hook in priority order (higher priority first)
    const index = stageHooks.findIndex((h) => (h.priority || 0) < (hook.priority || 0))
    if (index === -1) {
        stageHooks.push(hook)
    } else {
        stageHooks.splice(index, 0, hook)
    }
}

// Register core initialization in the internal stage
const registerCoreInit = () => {
    registerInternalHook(
        'core-initialization',
        100, // High priority to run first
        async () => {
            const logger = LOGGING_UTILS.getLogger()
            logger.debug('core-initialization')
            NERWORK_UTILS.manager.initialize()
            NAIE_SERVICES.modalObserver = naie_initModalObserver()
            await controls_initializeTemplates()
            NAIE_SERVICES.statusIndicator = INDICATOR_UTILS.createNAIEIndicator()
        },
    )
}

// Internal function, called by core when all scripts are ready
const preflight_runStages = async () => {
    const logger = LOGGING_UTILS.getLogger()
    logger.debug('Starting NAIE preflight')

    registerCoreInit()

    const app = await DOM_UTILS.waitForElement('#app')
    logger.debug('app element', app)
    const loader = LOADER.lockLoader(app)

    const errors = []

    try {
        // Run each stage, collecting errors
        errors.push(...(await runStage(INTERNAL_STAGES.INTERNAL)))
        NAIE_SERVICES.statusIndicator.displayMessage(`Initializing NAIE scripts...`)

        errors.push(...(await runStage(STAGES.EARLY)))
        errors.push(...(await runStage(STAGES.MAIN)))
        errors.push(...(await runStage(STAGES.LATE)))

        // Report errors if any occurred
        if (errors.length > 0) {
            const timeouts = errors.filter((e) => e.timeoutError)
            const failures = errors.filter((e) => !e.timeoutError)

            logger.error('Preflight completed with errors:', {
                total: errors.length,
                timeouts: timeouts.length,
                failures: failures.length,
                errors: errors.map((e) => ({
                    id: e.hookId,
                    stage: e.stage,
                    type: e.timeoutError ? 'timeout' : 'error',
                    message: e.error.message,
                })),
            })

            // Show user-friendly notification
            NAIE_SERVICES.statusIndicator.displayMessage(`Some features failed to initialize: ${errors.map((e) => e.hookId).join(', ')}`)
        } else {
            logger.debug('Preflight completed successfully')
            NAIE_SERVICES.statusIndicator.displayMessage(`NAIE scripts initialized successfully`)
        }
    } finally {
        logger.info('NAIE Initialization Complete')
        logger.debug('unlocking loader')
        loader.unlock()
    }

    return errors
}


/* ------ end of preflight.mod.js ------ */


/* #### scripts-manager.internal.js #### */

/**
 * Maximum time to wait for initial script registration
 */
const SCRIPT_REGISTRATION_TIMEOUT = 1000 // Max wait time for scripts to register

/**
 * Maximum time to wait for registered scripts to become ready
 */
const SCRIPT_READY_TIMEOUT = 4000 // Max wait time for scripts to become ready

/** @type {NAIEInternal} */
const NAIE_INTERNAL = {
    readyScripts: new Set(),
    registeredScripts: new Set(),
    isPreflightStarted: false,
    isWaitingForScripts: false,
    preflight: {
        runStages: preflight_runStages,
    },
}

/**
 * Check if all registered scripts have marked themselves as ready
 * @returns {boolean} True if all scripts are ready
 */
const checkAllScriptsReady = () => {
    const { readyScripts, registeredScripts } = NAIE_INTERNAL
    return readyScripts.size === registeredScripts.size && registeredScripts.size > 0
}

/**
 * Start waiting for scripts to register and become ready
 * Two-phase process:
 * 1. Wait up to SCRIPT_REGISTRATION_TIMEOUT for scripts to register
 * 2. Wait up to SCRIPT_READY_TIMEOUT for registered scripts to become ready
 * @returns {Promise<void>} Promise that resolves when preflight starts
 */
const internal_startWaitingForScripts = async () => {
    const logger = LOGGING_UTILS.getLogger()
    if (NAIE_INTERNAL.isWaitingForScripts || NAIE_INTERNAL.isPreflightStarted) return

    NAIE_INTERNAL.isWaitingForScripts = true
    logger.debug('Starting to wait for script registration', Date.now())

    // Phase 1: Wait for scripts to register
    const registrationStartTime = Date.now()
    while (Date.now() - registrationStartTime < SCRIPT_REGISTRATION_TIMEOUT) {
        if (NAIE_INTERNAL.registeredScripts.size > 0) {
            break // At least one script has registered
        }
        await new Promise((r) => setTimeout(r, 50))
    }

    // Log registration phase results
    logger.debug('Script registration phase complete', {
        registered: Array.from(NAIE_INTERNAL.registeredScripts),
        timeElapsed: Date.now() - registrationStartTime,
    })

    // Phase 2: Wait for registered scripts to become ready
    logger.debug('Starting to wait for scripts to become ready', Date.now())
    const readyStartTime = Date.now()
    while (Date.now() - readyStartTime < SCRIPT_READY_TIMEOUT) {
        if (checkAllScriptsReady()) {
            NAIE_INTERNAL.isPreflightStarted = true
            logger.debug('All scripts ready, starting preflight', {
                registered: Array.from(NAIE_INTERNAL.registeredScripts),
                ready: Array.from(NAIE_INTERNAL.readyScripts),
            })
            await NAIE_INTERNAL.preflight.runStages()
            return
        }
        await new Promise((r) => setTimeout(r, 50))
    }

    // Timeout reached, run preflight anyway
    logger.warn('Script ready timeout reached. Some scripts may not be ready:', {
        registered: Array.from(NAIE_INTERNAL.registeredScripts),
        ready: Array.from(NAIE_INTERNAL.readyScripts),
        timeElapsed: Date.now() - readyStartTime,
    })
    NAIE_INTERNAL.isPreflightStarted = true
    await NAIE_INTERNAL.preflight.runStages()
}

/**
 * Register a feature script with NAIE
 * Must be called before markScriptReady
 * @param {string} scriptId Unique identifier for the script
 * @throws {Error} If script tries to register after preflight started
 */
const registerScript = (scriptId) => {
    if (NAIE_INTERNAL.isPreflightStarted) {
        throw new Error(`Script ${scriptId} tried to register after preflight started`)
    }
    LOGGING_UTILS.getLogger().info('registering script', scriptId)
    NAIE_INTERNAL.registeredScripts.add(scriptId)
}

/**
 * Mark a feature script as ready for preflight
 * Script must be registered first
 * @param {string} scriptId Unique identifier for the script
 * @returns {Promise<void>}
 * @throws {Error} If script is not registered
 */
const markScriptReady = async (scriptId) => {
    if (!NAIE_INTERNAL.registeredScripts.has(scriptId)) {
        throw new Error(`Script ${scriptId} not registered`)
    }
    LOGGING_UTILS.getLogger().info('script reports ready', scriptId)
    NAIE_INTERNAL.readyScripts.add(scriptId)
}

/** @type {NAIECore} */
const CORE_UTILS = {
    registerScript,
    markScriptReady,
}


/* - end of scripts-manager.internal.js  */


/* ########### naie-object.js ########## */

/***
 * @type {NAIEServices}
 */
const NAIE_SERVICES = {
    statusIndicator: null,
    modalObserver: null,
}

/***
 * @return {NAIE}
 */
const createNAIEInstance = () => {
    return {
        NETWORK: NERWORK_UTILS,
        //SETTINGS,
        MISC: MISC_UTILS,
        DOM: DOM_UTILS,
        NAI: NAI_UTILS,
        EXTENSIONS,
        LOGGING: LOGGING_UTILS,
        PREFLIGHT: PREFLIGHT_UTILS,
        CORE: CORE_UTILS,
        SERVICES: NAIE_SERVICES,
    }
}


/* ------- end of naie-object.js ------- */



    // Force a reload when the app navigates to or from /stories
    // This is to make sure we only load the script when we access /stories

    let previousPath = wRef.location.pathname
    const handleUrlChange = () => {
        const currentPath = wRef.location.pathname

        if (
            (previousPath.startsWith('/stories') && !currentPath.startsWith('/stories')) ||
            (!previousPath.startsWith('/stories') && currentPath.startsWith('/stories'))
        ) {
            wRef.location.reload()
        }

        previousPath = currentPath
    }

    const observer = new MutationObserver(handleUrlChange)

    observer.observe(document, { childList: true, subtree: true })

    handleUrlChange() // Initial check

    // Check if the current path is /stories before initializing
    if (wRef.location.pathname.startsWith('/stories')) {
        coreInit()
    }
})()

