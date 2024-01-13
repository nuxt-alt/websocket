export default defineNuxtConfig({
    modules: [
        '../src/module'
    ],
    websocket: {
        websockets: {
            '/socket.io': {
                name: 'main',
                serverOptions: {
                    serveClient: false
                },
            }
        }
    },
    devtools: { enabled: true }
})
