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

        const encodedData = encodeBase64(JSON.stringify(item.data))
        item.data = encodedData
    }

    encodeDataFields(item)
    return item
}

const encodeShelves = (decodedShelves) => {
    return structuredClone(decodedShelves).map(encodeShelf)
}

const getShelfTreeMap = (shelves) => {
    let decoded = decodeShelves(shelves)
}

const InjectShelfTransientMetaSingle = (shelf) => {
    return InjectShelfTransientMeta([shelf])[0]
}

//injects transient meta into description
const InjectShelfTransientMeta = (shelves) => {
    let decoded = decodeShelves(shelves)

    for (let d of decoded) {
        let shelf_id = d.meta
        let shelf_metadata = getMetadataObject(d) ?? {}
        shelf_metadata.shelf_id = shelf_id
        d.data.description = writeMetadata(d.data.description, shelf_metadata)
    }

    return encodeShelves(decoded)
}

const buildShelfMap = (shelves) => {
    const decodedShelves = decodeShelves(shelves)

    const itemMap = new Map()

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

    return itemMap
}

const getNumChildrenFromDom = () => {
    const shelves = document.querySelectorAll(
        `${storyListSelector} > div[data-metadata-shelf_id]:not([role]):not([data-metadata-subshelf="true"])`,
    )

    for (const shelfEl of shelves) {
        shelfEl.id = 'tmpShelfID'
        let countEl = shelfEl.querySelector('#tmpShelfID > div:nth-child(3):not(.naie-computed-count)')
        shelfEl.id = ''

        const count = countEl?.firstChild?.textContent || '0'
        const shelf_id = shelfEl.getAttribute('data-metadata-shelf_id')

        shelfState.setShelfChildCount(shelf_id, parseInt(count))
    }
}

const getShelfStoryTotal = (shelf_id) => {
    const shelf = shelfState.getShelf(shelf_id)

    let total = shelf?.[shelfChildCountKey] || 0

    const subShelves = shelfState.getSubShelves(shelf_id) || []

    subShelves.forEach((subshelf) => {
        total += getShelfStoryTotal(subshelf.meta)
    })

    return total
}
