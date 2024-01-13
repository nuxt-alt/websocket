import type { ModuleOptions } from './types'
import { defineNuxtModule, addPlugin, createResolver, addImports, addTypeTemplate, installModule } from '@nuxt/kit'
import { type NitroRuntimeConfig } from 'nitropack'
import { name, version } from '../package.json'
import { serialize } from '@refactorjs/serialize'
import { Server } from 'socket.io'
import { defu } from 'defu'

const CONFIG_KEY = 'websocket'

export default defineNuxtModule<ModuleOptions>({
    meta: {
        name,
        version,
        configKey: CONFIG_KEY,
        compatibility: {
            nuxt: '^3.0.0'
        }
    },
    defaults: {
        websockets: {}
    },
    setup(options, nuxt) {
        const resolver = createResolver(import.meta.url);
        const moduleConfig = (nuxt.options.runtimeConfig.websocket = defu(nuxt.options.runtimeConfig.websocket as any, options)) as ModuleOptions

        // Inject options via virtual template
        const runtimeDir = resolver.resolve('./runtime')
        nuxt.options.build.transpile.push(runtimeDir)

        if (nuxt.options.dev) {
            nuxt.hook('listen', (server) => {
                const sockets: any = {};
                for (const context in moduleConfig.websockets) {
                    const websocket = moduleConfig.websockets[context]
                    const io = new Server(server, { transports: ['websocket'], ...websocket?.serverOptions, path: context });

                    sockets[websocket!.name] = io;

                    if (websocket?.events) {
                        Object.keys(websocket.events).forEach(async (fn) => {
                            websocket.events?.[fn]?.(io, nuxt.options.runtimeConfig as NitroRuntimeConfig)
                        })
                    }
                }
            })
        }

        if (moduleConfig?.websockets && !nuxt.options.dev) {
            addTypeTemplate({
                filename: 'types/nitro-websocket-hooks.d.ts',
                getContents: () => runtimeHookTypes(moduleConfig)
            })
        }


        if (!nuxt.options.modules.includes('@nuxt-alt/proxy')) {
            installModule('@nuxt-alt/proxy', {
                experimental: {
                    listener: true
                }
            })
        }

        nuxt.hook('nitro:config', (config) => {
            config.externals = config.externals || {}
            config.externals.inline = config.externals.inline || []
            config.externals.inline.push(runtimeDir)

            config.virtual = config.virtual || {}
            config.virtual['#nuxt-websocket-options'] = `export const options = ${serialize(moduleConfig, { space: 4 })}`
            config.plugins = config.plugins || []
            config.plugins.push(resolver.resolve(runtimeDir, 'websocket-plugin.nitro'))
        })

        addImports([
            { from: resolver.resolve('runtime/composables'), name: 'useIO' },
        ])

        addPlugin({
            src: resolver.resolve('runtime/websocket-plugin.nuxt'),
            mode: 'client'
        })
    }
})

function runtimeHookTypes(moduleConfig: ModuleOptions) {
    return `import { Server } from 'socket.io'

declare module 'nitropack' {
    interface NitroRuntimeHooks {
        ${Object.values(moduleConfig.websockets!).map((websocket) => {
        return `'io:${websocket?.name}': (io: Server) => void`
    }).join('\n')}
    }
}
`
}
