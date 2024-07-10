const postRequestHandler = async (request, response) => {
    const baseShelfUrl = 'https://api.novelai.net/user/objects/shelf'
    const method = request.method?.toLowerCase()

    if (request.url.startsWith(baseShelfUrl)) {
        switch (method) {
            case 'get':
                return await postShelfGetAll(response)
            case 'patch':
                return await postShelfPatch(response)
            case 'put':
                return await postShelfPut(response)
            case 'delete':
                return await postShelfDelete(response)
            default:
                return response
        }
    } else {
        return response
    }
}
