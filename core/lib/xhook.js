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
