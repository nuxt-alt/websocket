import { useNuxtApp } from '#imports';

export function useIO(): typeof import('socket.io-client')['io'] {
    const { $io } = useNuxtApp()
    return $io
}