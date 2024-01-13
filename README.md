> Socket.io WebSocket module for [Nuxt](https://nuxt.com)

## Info

This is a socket.io module for Nuxt 3. The project was originally supposed to imitate a [Pull Request](https://github.com/unjs/h3/pull/544), but I found that the implementation while it was working, needed a lot of setup and ws is barebones so a lot of custom functionality would be needed to be added. So I opted for socket.io instead. Plus hadling events via the event handler seemed tedious.

## Setup

1. Add `@nuxt-alt/websocket` and `@nuxt-alt/proxy` dependency to your project

```bash
yarn add @nuxt-alt/websocket @nuxt-alt/proxy
```

2. Add `@nuxt-alt/websocket` to the `modules` section of `nuxt.config.ts`

```ts
export default defineNuxtConfig({
    modules: [
        '@nuxt-alt/websocket',
        '@nuxt-alt/proxy'
    ],
    proxy: {
        experimental: {
            listener: true
        }
    }
    websocket: {
        // websockets
        websockets: {}
    }
});

```

3. *Note:* You do not need to define `@nuxt-alt/proxy` in your module array (but it does need to be added as a package), if it's not there it will be automatically added for you with the `experimental.listener` property set.

## Development

Running tests for development:

```bash
$ yarn install
$ yarn dev
```

or (if you want a feel of how it would work in production - since that what this module aims for)

```bash
$ yarn install
$ yarn dev:build
$ yarn dev:preview
```

## Options

### `websockets`

```ts
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
```

## Config Example

```ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
    modules: [
        '@nuxt-alt/websocket',
    ],
    proxy: {
        websockets: {
            '/socket.io': {
                name: 'main',
                events: {
                    test: (io, config) => {
                        io.on('connection', () => {})
                    } 
                }
            },
        }
    }
})
```

## Composables

A `useIO` composable is avaialble to use otherwise you can use `$io` from `useNuxtApp()` or import the io module from `socket.io-client` directly.

## Known Issues

- Polling will not work with the module (sometimes, its really finicky in nitro). By default all socket.io instances in nitro uses websockets without polling. if you'd like to take a crack at handling this yourself you can disable the handler of your socket.io instance. This will disable the event handler for the websockt path and if there's no handler it will lead to 404s (doesn't happen all the time but it happens enough times to have it disabled). You can also disable it if you end up wanting to use the proxy module to handle proxying the request.