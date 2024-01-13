import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin(async (nuxtApp) => {
    const { io } = await import('socket.io-client')

    nuxtApp.provide('io', io)
})