const preProcessIndicator = () => {
    createNAIEindicator()
}

const preProcessSidebar = async () => {
    createBreadcrumbBar()
    await mapShelfMetadata()
}
