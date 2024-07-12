const makeBreadcrumbs = (id, map) => {
    const breadcrumbs = []
    let currentId = id

    while (currentId) {
        const obj = map.get(currentId)
        if (obj) {
            breadcrumbs.unshift(obj)
            currentId = getMetadataObject(obj)?.parent_id || null
        } else {
            break
        }
    }

    return breadcrumbs
}
