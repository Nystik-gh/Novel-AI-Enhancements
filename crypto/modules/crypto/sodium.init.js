const sodiumUrl = 'https://raw.githubusercontent.com/jedisct1/libsodium.js/refs/heads/master/dist/browsers-sumo/sodium.js'

const initSodium = async () => {
    return new Promise((resolve, reject) => {
        unsafeWindow.sodium = {
            onload: function (sodium) {
                console.log('sodium loaded', sodium)
                resolve(sodium)
            },
        }

        GM_xmlhttpRequest({
            method: 'GET',
            url: sodiumUrl,
            onload: function (response) {
                const script = document.createElement('script')
                script.textContent = response.responseText
                document.head.appendChild(script)
            },
            onerror: function (error) {
                console.error('Failed to load script:', error)
                reject(error)
            },
        })
    })
}
