<template>
    <div>Connected: {{ connected }}</div>
</template>

<script lang="ts" setup>
const io = useIO()
const connected = ref(false)

onMounted(() => {
    const socket = io({ transports: ['websocket'] })

    socket.on('connect', () => {
        connected.value = socket.connected
    })

    socket.on('disconnect', () => {
        connected.value = socket.connected
    })
})

</script>