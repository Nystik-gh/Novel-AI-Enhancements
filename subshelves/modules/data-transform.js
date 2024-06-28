const decodeShelf = (shelf) => {
    const decodedData = JSON.parse(decodeBase64(shelf.data))
    if (decodedData.children === undefined) {
        decodedData.children = []
    }
    const metadata = parseMetadata(decodedData.description)
    const decoded = { ...shelf, data: decodedData }
    setMetadataObject(decoded, metadata)
    return decoded
}

const decodeShelves = (shelves) => {
    return shelves.map(decodeShelf)
}

const encodeShelf = (item) => {
    const encodeDataFields = (item) => {
        for (const child of item.data.children) {
            if (child.type === 'shelf') {
                encodeDataFields(child)
            }
        }

        // Encode current item's data field to JSON and then base64
        const encodedData = encodeBase64(JSON.stringify(item.data))
        item.data = encodedData
    }

    // Start encoding from the given item
    encodeDataFields(item)
    return item
}

const encodeShelves = (decodedShelves) => {
    return structuredClone(decodedShelves).map(encodeShelf)
}

const getShelfTreeMap = (shelves) => {
    let decoded = decodeShelves(shelves)
}

const InjectShelfMetaSingle = (shelf) => {
    return injectShelfMeta([shelf])[0]
}

const injectShelfMeta = (shelves) => {
    let decoded = decodeShelves(shelves)

    for (let d of decoded) {
        let shelf_id = d.meta
        let shelf_metadata = getMetadataObject(d) ?? {}
        shelf_metadata.shelf_id = shelf_id
        d.data.description = writeMetadata(d.data.description, shelf_metadata)
    }

    console.log('injetedMeta', decoded)

    return encodeShelves(decoded)
}

const buildShelfMap = (shelves) => {
    const decodedShelves = decodeShelves(shelves)

    const itemMap = new Map() // Map to quickly access items by id

    // First pass: create a map of items
    for (const item of decodedShelves) {
        item.data.children = item.data.children ? item.data.children : []
        itemMap.set(item.meta, item)
    }

    // Second pass: link child items to their parent items
    for (const item of decodedShelves) {
        const parent = getMetadataObject(item)?.parent_id !== undefined ? itemMap.get(getMetadataObject(item)?.parent_id) : null
        if (parent) {
            parent.data.children.push(item)
        }
    }

    console.log(itemMap)

    return itemMap
}
