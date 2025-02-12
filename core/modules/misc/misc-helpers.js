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
