const preProcessSidebar = async () => {
    createBreadcrumbBar()
    await forcePopulateStoryList(null, true)
    await mapShelfMetadata()
}
