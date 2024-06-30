const makeBreadcrumbs = (id, map) => {
    const breadcrumbs = []
    let currentId = id

    while (currentId) {
        const obj = map.get(currentId)
        if (obj) {
            breadcrumbs.unshift(obj) // Add the object to the beginning of the array
            currentId = getMetadataObject(obj).parent_id
        } else {
            break // Break loop if object with currentId is not found
        }
    }

    return breadcrumbs
}
