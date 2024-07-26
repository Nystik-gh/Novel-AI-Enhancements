class misc_Emitter {
    constructor() {
        this.eventMap = new Map()
    }

    on(event, callback) {
        if (!this.eventMap.has(event)) {
            this.eventMap.set(event, [])
        }
        this.eventMap.get(event).push(callback)
    }

    off(event, callback) {
        if (this.eventMap.has(event)) {
            const callbacks = this.eventMap.get(event).filter((cb) => cb !== callback)
            this.eventMap.set(event, callbacks)
        }
    }

    emit(event, ...data) {
        if (this.eventMap.has(event)) {
            this.eventMap.get(event).forEach((callback) => {
                setTimeout(() => callback(...data), 0)
            })
        }
    }
}
