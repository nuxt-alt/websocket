import { type NitroAppPlugin, type NitroRuntimeConfig } from 'nitropack'
import { isWebSocketUpgradeRequest, upgradeWebSocket } from './utils'
import { Server, type ServerOptions } from 'socket.io'
// @ts-expect-error: virtual file
import { options } from '#nuxt-websocket-options'
// @ts-expect-error: alias
import { useRuntimeConfig } from '#internal/nitro'

interface WebSocketOpts {
    /**
     * The name of the socket.io handler this is used to access the server 
     * through the socket.io instance globalThis.$io[name] in nitro. This 
     * field is required.
     * 
     * 
     * *Note:* globalThis.$io[name] is not avaialable in dev mode due to the fact that the 
     * nitro listen even outputs a sock file instead of the http server so socket.io has
     * nothing to latch on to. You may use the `events` property to register event functions
     * for socket.io in dev mode.
     */
    name: string

    /**
     * Enabled by default, this handles the nitro routing for the server response.
     * Disable this if you want to do this yourself or for any other reason that 
     * you might need it disabled.
     */
    handler?: boolean

    /**
     * You can enter a series of functions here to handle the events for the socket.io instance
     * or you may use the globalThis.$io[name] instance in nitro if you prefer.
     */
    events?: {
        [key: string]: ((io: Server, runtimeConfig: NitroRuntimeConfig) => void) | undefined
    }

    /**
     * Server Options for the socket.io instance. The `path` property is omitted because it's always
     * overridden by the `websockets` object keys.
     */
    serverOptions?: Omit<Partial<ServerOptions>, 'path'>
}

// lazy require only when websocket is used
const websockets: Record<string, [WebSocketOpts]> = {}

Object.keys(options.websockets!).forEach(async (context) => {
    let opts = initializeOpts(options.websockets![context]);

    if (!opts) return

    websockets[context] = [{ ...opts }]
})

// Initialize the global io map if it is not already
if (!globalThis.$io) {
    globalThis.$io = {};
}

export default <NitroAppPlugin>function ({ hooks }) {
    if (process.env.NODE_ENV === 'production') {
        hooks.hook('listen:node', (server) => {
            for (const context in websockets) {
                const [websocket] = websockets[context]
                const io = new Server(server, { transports: ['websocket'], ...websocket.serverOptions, path: context });
                globalThis.$io[websocket.name] = io;
                // @ts-ignore: types added automatically
                hooks.callHook(`io:${websocket.name}`, io)

                if (websocket.events) {
                    Object.keys(websocket.events).forEach((fn) => {
                        websocket.events![fn]?.(io, useRuntimeConfig())
                    })
                }
            }
        })
    }

    hooks.hook('request', async (event) => {
        const url = event.node.req.url!

        for (const context in websockets) {
            const [websocket] = websockets[context]
            if (doesProxyContextMatchUrl(context, url) && websocket.handler) {
                if (isWebSocketUpgradeRequest(event)) {
                    upgradeWebSocket(event);
                }

                event.node.res.end()
            }
        }
    })
}

function initializeOpts(optsInput: WebSocketOpts) {
    let opts = optsInput;
    opts = { handler: true, ...opts };
    return opts;
}

function doesProxyContextMatchUrl(context: string, url: string): boolean {
    return (url.startsWith(context))
}