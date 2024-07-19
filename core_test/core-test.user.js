// ==UserScript==
// @name         Novel AI Enhanced: Sub-shelves
// @namespace    github.nystik-hg
// @version      1.0.3
// @description  Adds nested shelves functionality
// @match        https://novelai.net/*
// @grant        none
// @run-at       document-start
// @require      https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/main/core/dist/naie-core.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=novelai.net
// @author       Nystik (https://gitlab.com/Nystik)
// @downloadUrl  https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/main/subshelves/dist/naie-subshelves.user.js
// @homepageUrl  https://github.com/Nystik-gh/Novel-AI-Enhancements
// @supportUrl   https://github.com/Nystik-gh/Novel-AI-Enhancements/issues
// ==/UserScript==

const NAIE = window.NAIE_INSTANCE

const init = () => {
    console.log('naie instance', NAIE)

    NAIE.registerSettings()
    NAIE.registerFetchPreHook()
    NAIE.registerFetchPostHook()

    console.log(naieGlobalFunc, window.naieGlobalFunc)

    naieGlobalFunc()
    window.naieGlobalFunc()
}
