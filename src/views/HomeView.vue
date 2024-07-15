<template>
    <div>
        <TopHead />
        <MapContainer />
    </div>
</template>

<script setup>
import TopHead from '../components/TopHead/TopHead.vue';
import MapContainer from '../components/MapContainer/MapContainer.vue';
import { onMounted } from 'vue'
import { useGaoDeStore } from '@/stores/GaoDe';
const cityStore = useGaoDeStore()
onMounted(async () => {
    if (cityStore.city_list.length === 0) {
        cityStore.fetchCityList()
    }
})
</script>

<style lang="scss" scoped></style>