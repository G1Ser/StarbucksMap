<template>
    <div id="map">
        <div class="buttons">
            <el-button round @click="toggleMap">切换地图</el-button>
            <el-button round @click="toLocal">复位</el-button>
        </div>
        <div class="nav-inputs">
            <el-input v-model="startpointname" style="width: 300px" placeholder="请输入起点" @click="selectSPoint" clearable
                readonly />
            <el-input v-model="endpointname" style="width: 300px" placeholder="请输入终点" @click="selectEPoint" clearable
                readonly />
            <el-button round @click="nav" style="width: 50px" :disabled="isButtonDisabled">导航</el-button>
        </div>
    </div>
    <div id="popup" class="map-popup">
        <div id="popup-content"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useOpenLayers } from '@/stores/Map'
import { useGaoDeStore } from '@/stores/GaoDe'
const cityStore = useGaoDeStore()
const mapStore = useOpenLayers()
const toggleMap = () => {
    mapStore.toggleMap()
}
const toLocal = () => {
    cityStore.setCity(cityStore.LocalCity)
}
//导航
const startpointname = ref('')
const endpointname = ref('')
const selectingStartPoint = ref(false);
const selectingEndPoint = ref(false);
const startcoord = ref(false)
const endcoord = ref(false)
const isTip = ref(false)
const selectSPoint = () => {
    mapStore.enableCursor()
    selectingStartPoint.value = true;
    selectingEndPoint.value = false;
    mapStore.getStartbucksInfo((properties, coordinates) => {
        if (selectingStartPoint.value) {
            startpointname.value = properties.store_name;
            startcoord.value = coordinates
        }
    });
}
const selectEPoint = () => {
    mapStore.enableCursor()
    selectingStartPoint.value = false;
    selectingEndPoint.value = true;
    mapStore.getStartbucksInfo((properties, coordinates) => {
        if (selectingEndPoint.value) {
            endpointname.value = properties.store_name;
            endcoord.value = coordinates
        }
    });
}
const isButtonDisabled = computed(() => {
    return startpointname.value === '' || endpointname.value === ''
})
const nav = () => {
    mapStore.navDriving(startcoord.value, endcoord.value)
    startpointname.value = ''
    endpointname.value = ''
}
onMounted(async () => {
    const mapId = document.getElementById('map')
    const container = document.getElementById('popup')
    const content = document.getElementById('popup-content')
    mapStore.initMap(mapId)
    mapStore.setOverlay(container, content)
})
watch(() => cityStore.cityInfo, async (newCity) => {
    if (newCity) {
        await cityStore.getCityCode(newCity);
        await mapStore.mapData(cityStore.province_adcode, newCity, cityStore.type, true)
    }
    if (newCity !== null) {
        mapStore.discover_store(cityStore.province_adcode, newCity, cityStore.type, false)
    }
}, { immediate: true });
</script>

<style lang="scss" scoped>
#map {
    width: 100vw;
    height: calc(100vh - 80px);
    position: relative;

    .buttons {
        display: flex;
        position: absolute;
        top: 20px;
        left: 20px;
        z-index: 100;
    }

    .nav-inputs {
        display: flex;
        flex-direction: column;
        gap: 5px;
        position: absolute;
        top: 60px;
        left: 20px;
        z-index: 100;
        align-items: center;
    }
}

.map-popup {
    text-align: center;
    font-size: 1rem;
    background: rgba(255, 255, 255, 0.6);
    padding: 5px;
    border-radius: 10px;
}
</style>