<template>
    <div class="top-head">
        <el-row :gutter="20">
            <el-col :span="5">
                <el-menu mode="horizontal" background-color="#a9cbfe" text-color="#fff" active-text-color="#4264fb">
                    <el-menu-item @click="handleCity">{{ cityStore.cityInfo }}<el-icon :size="20">
                            <Location />
                        </el-icon></el-menu-item>
                </el-menu>
            </el-col>
            <el-col :span="12">
                <el-input v-model="input" @keyup.enter="handleInput" placeholder="请输入查询地点" :prefix-icon="Search" />
            </el-col>
            <el-col :span="2" :offset="3">
                <p>{{ mapStore.discover }} / {{ mapStore.amount }}</p>
            </el-col>
            <el-col :span="2" style="display: flex; gap: 10px;">
                <p style="color: red;">Read Me</p>
                <el-icon :size="20" color="red" style="cursor: pointer;" @click="isTip = true">
                    <InfoFilled />
                </el-icon>
            </el-col>
        </el-row>
    </div>
    <div class="tip" v-if="isTip">
        <div class="dialog">
            <h4>星巴克地图项目 完成时间：2024/7/7</h4>
            <h5>项目介绍</h5>
            <div class="content" style="text-align: left;">
                <p>1.各个区域星巴克门店位置查看</p>
                <p>通过点击城市名称或输入框查询所在城市星巴克门店位置</p>
                <p>2.导航功能，输入起始点获得两点间的路线</p>
                <p>“畅通”：绿色，“缓行”：黄色，“拥堵”：红色，“严重拥堵”：深红色，“未知路况”：蓝色</p>
                <p>3.门店信息查看</p>
                <p>鼠标光标移动到门店数据可以浏览相关信息</p>
                <p>4.门店打卡功能</p>
                <p>双击门店，可以完成打卡，右上角为打卡门店数量和该城市总数量</p>
            </div>
            <el-button type="danger" :icon="Delete" circle size="small" @click="isTip = false" />
        </div>
    </div>
</template>

<script setup>
import { Location, Search, InfoFilled, Delete } from '@element-plus/icons-vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router';
import { useGaoDeStore } from '@/stores/GaoDe';
import { useOpenLayers } from '@/stores/Map'
const cityStore = useGaoDeStore()
const mapStore = useOpenLayers()
const router = useRouter()
const handleCity = () => {
    router.push('/city')
}
const input = ref('')
const handleInput = () => {
    const cityIndex = cityStore.city_list.findIndex(city => city.city.startsWith(input.value))
    if (cityIndex !== -1) {
        cityStore.city_list[cityIndex].visitCount++
        if (cityStore.visit_city) {
            cityStore.saveVisitedCities()
        }
    }
    cityStore.getCityCode(input.value).then(() => {
        cityStore.setCity(cityStore.city_name)
    })
    input.value = ''
};
//提示
const isTip = ref(false)
onMounted(async () => {
    if (!cityStore.cityInfo) {
        await cityStore.getLocallocation()
        await cityStore.getCityCode(cityStore.LocalCity)
    }
})
</script>

<style lang="scss" scoped>
.top-head {
    width: 100vw;
    height: 80px;
    background-color: #a9cbfe;
    padding: 10px 10px;

    .el-row {
        display: flex;
        align-items: center;
    }

    .el-menu {
        border-bottom: none;
    }

    :deep(.el-menu-item) {
        display: flex;
        gap: 10px;
        align-items: center;
        font-size: 15px;
    }

    p {
        color: white;
        font-size: 15px;
    }
}

.tip {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 3000;

    .dialog {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: auto;
        padding: 10px;
        width: 350px;
        background-color: rgba(255, 255, 255, 0.7);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        border-radius: 5px;
        align-items: center;
    }
}
</style>