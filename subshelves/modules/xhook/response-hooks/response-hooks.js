const postRequestHandler = async (request, response) => {
    const baseShelfUrl = 'https://api.novelai.net/user/objects/shelf'
    const method = request.method?.toLowerCase()

    if (request.url.startsWith(baseShelfUrl)) {
        switch (method) {
            case 'get':
                return await postShelfGetAll(response)
            case 'patch':
                // Add your patch logic here
                break
            case 'put':
                return await postShelfPut(response)
            case 'delete':
                // Add your delete logic here
                break
            default:
                return response
        }
    } else {
        return response
    }
}
