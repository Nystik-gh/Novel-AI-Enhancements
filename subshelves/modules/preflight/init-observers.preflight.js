const initGlobalObservers = () => {
    initModalObserver()
    initMenubarObserver(getMenubarEl())
    const storyList = getStoryListEl()
    if (storyList) {
        initStoryListObserver(storyList)
    }
}
