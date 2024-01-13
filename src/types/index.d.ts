import * as NuxtSchema from '@nuxt/schema';
import { type Server, type ServerOptions } from 'socket.io'
import { type NitroRuntimeConfig } from 'nitropack'

interface ModuleOptions {
    websockets?: {
        [key: string]: WebSocketOpts | undefined
    }
}

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
     * Enabled by default, this handles the nitro routing for the server response
     * disable this if you want to do this yourself or for any other reason that 
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

declare module '#app' {
    interface NuxtApp {
        $io: typeof import('socket.io-client')['io']
    }
}

declare module '@nuxt/schema' {
    interface NuxtConfig {
        ['websocket']?: Partial<ModuleOptions>
    }
    interface NuxtOptions {
        ['websocket']?: ModuleOptions
    }
}

declare global {
    namespace NodeJS {
        interface Global {
            $io: {
                [key: string]: Server
            }
        }
    }
}

declare const NuxtWebsocket: NuxtSchema.NuxtModule<ModuleOptions>

export {
    ModuleOptions,
    NuxtWebsocket as default
};