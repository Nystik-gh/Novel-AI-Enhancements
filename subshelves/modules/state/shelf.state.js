const createShelfState = (shelfData) => {
    const shelfDataMap = shelfData

    const getMap = () => shelfDataMap

    const upsertShelf = (shelfId, shelfData) => {
        if (shelfDataMap.has(shelfId)) {
            const element = shelfDataMap.get(shelfId)[shelfElementKey]
            updateShelf(shelfId, { ...shelfData, [shelfElementKey]: element })
        } else {
            insertShelf(shelfId, shelfData)
        }
    }

    const insertShelf = (shelfId, shelfData) => {
        if (shelfDataMap.has(shelfId)) {
            throw new Error(`Shelf with ID ${shelfId} already exists.`)
        }
        shelfDataMap.set(shelfId, shelfData)
    }

    const getShelf = (shelfId) => {
        if (!shelfDataMap.has(shelfId)) {
            throw new Error(`Shelf with ID ${shelfId} does not exist.`)
        }
        return shelfDataMap.get(shelfId)
    }

    const getShelfByRemoteId = (remoteId) => {
        return Array.from(shelfDataMap.values()).find((s) => s.id === remoteId)
    }

    const updateShelf = (shelfId, newShelfData) => {
        if (!shelfDataMap.has(shelfId)) {
            throw new Error(`Shelf with ID ${shelfId} does not exist.`)
        }
        shelfDataMap.set(shelfId, newShelfData)
    }

    const deleteShelf = (shelfId) => {
        if (!shelfDataMap.has(shelfId)) {
            throw new Error(`Shelf with ID ${shelfId} does not exist.`)
        }
        shelfDataMap.delete(shelfId)
    }

    const setShelfElement = (shelfId, element) => {
        const shelfData = shelfDataMap.get(shelfId)
        if (shelfData !== undefined) {
            shelfDataMap.set(shelfId, { ...shelfData, [shelfElementKey]: element })
        }
    }

    const getShelfElement = (shelfId) => {
        const shelfData = shelfDataMap.get(shelfId)
        if (shelfData) {
            return shelfData[shelfElementKey]
        }
        return null
    }

    const setShelfChildCount = (shelfId, count) => {
        const shelfData = shelfDataMap.get(shelfId)
        if (shelfData !== undefined) {
            shelfDataMap.set(shelfId, { ...shelfData, [shelfChildCountKey]: count })
        }
    }

    const getShelfChildCount = (shelfId) => {
        const shelfData = shelfDataMap.get(shelfId)
        if (shelfData) {
            return shelfData[shelfChildCountKey]
        }
        return null
    }

    const getSubShelves = (parentId) => {
        return Array.from(shelfDataMap.values()).filter((s) => getMetadataObject(s)?.parent_id === parentId)
    }

    const getNonDescendants = (id) => {
        const result = []
        const descendants = new Set()
        const stack = id ? [id] : []

        while (stack.length > 0) {
            const currentId = stack.pop()
            descendants.add(currentId)

            for (const [key, value] of shelfDataMap.entries()) {
                const { parent_id } = getMetadataObject(value) || {}
                if (parent_id === currentId) {
                    stack.push(key)
                }
            }
        }

        for (const [key, value] of shelfDataMap.entries()) {
            if (!descendants.has(key)) {
                result.push(value)
            }
        }

        return result
    }

    return {
        getMap,
        upsertShelf,
        insertShelf,
        getShelf,
        getShelfByRemoteId,
        updateShelf,
        deleteShelf,
        setShelfElement,
        getShelfElement,
        getSubShelves,
        getNonDescendants,
        getShelfChildCount,
        setShelfChildCount,
    }
}
