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