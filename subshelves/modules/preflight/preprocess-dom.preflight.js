const preProcessIndicator = () => {
    createNAIEindicator()
}

const preProcessSidebar = async () => {
    createBreadcrumbBar()
    await forcePopulateStoryList()
    await mapShelfMetadata()
}