import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import pinyin from 'tiny-pinyin'
export const useGaoDeStore = defineStore('GaoDe', () => {
    const url = '/startsbucksmap/City.json';
    //所有的城市列表
    const city_list = ref([]);
    //访问的城市列表
    const visit_city = ref([]);
    const key = ref('66a865570fd1e4a0c42f5a173ec8d7d9')
    const cityInfo = ref(null)
    const LocalCity = ref(null)
    const LocalWeatherInfo = ref({ weather: '', temperature: '', winddirection: '', windpower: '' })
    const WeatherList = ref(null)
    const HotCities = ref([
        { id: 1, text: '杭州市' },
        { id: 2, text: '北京市' },
        { id: 3, text: '上海市' },
        { id: 4, text: '广州市' },
        { id: 5, text: '深圳市' },
        { id: 6, text: '成都市' },
        { id: 7, text: '重庆市' },
        { id: 8, text: '天津市' },
        { id: 9, text: '南京市' },
        { id: 10, text: '苏州市' },
        { id: 11, text: '武汉市' },
        { id: 12, text: '西安市' }
    ])
    const polyphonicCities = {
        '重庆市': 'C',
    }
    async function fetchCityList() {
        try {
            const response = await axios.get(url);
            const cities = response.data;
            //尝试从本次存储获取已经存在的城市列表数据
            const visitedCityList = localStorage.getItem('visitedCities');
            const visitedCities = visitedCityList ? JSON.parse(visitedCityList) : [];
            //构建新数组
            let AllCities = cities.map((city, index) => {
                let firstLetter = '#';
                // 尝试找到当前城市在已访问城市列表中的记录
                const visitedCity = visitedCities.find(City => City.city === city);
                let visitCount = visitedCity ? visitedCity.visitCount : 0;
                if (polyphonicCities[city]) {
                    firstLetter = polyphonicCities[city];
                } else if (pinyin.isSupported()) {
                    firstLetter = pinyin.convertToPinyin(city, '', true).charAt(0).toUpperCase();
                }
                return { id: index + 1, firstLetter, city, visitCount };
            }).sort((a, b) => a.firstLetter.localeCompare(b.firstLetter));
            city_list.value = AllCities
        } catch (error) {
            console.error(error)
        }
    }
    const saveVisitedCities = () => {
        //筛选出访问次数大于0的城市
        const visitedCities = city_list.value.filter(city => city.visitCount > 0)
        localStorage.setItem('visitedCities', JSON.stringify(visitedCities))
    }
    const loadVisitedCities = () => {
        const visitedCityList = localStorage.getItem('visitedCities');
        if (visitedCityList) {
            let visitedCities = JSON.parse(visitedCityList)
            visitedCities.sort((a, b) => {
                if (a.visitCount === b.visitCount) {
                    return a.firstLetter.localeCompare(b.firstLetter)
                }
                return b.visitCount - a.visitCount
            })
            visit_city.value = visitedCities.slice(0, 5)
        }
    }
    //计算属性，用于分组城市
    const groupCities = computed(() => {
        return city_list.value.reduce((groups, city) => {
            const { firstLetter } = city;
            if (!groups[firstLetter]) {
                groups[firstLetter] = [];
            }
            groups[firstLetter].push(city);
            return groups;
        }, {});
    });
    //获取本地地址
    const getLocallocation = async () => {
        try {
            const res = await axios.get(`https://restapi.amap.com/v3/ip?key=${key.value}`)
            cityInfo.value = res.data.city
            LocalCity.value = res.data.city
        } catch (error) {
            console.error(error)
        }
    }
    //更换城市地址
    const setCity = (newCity) => {
        cityInfo.value = newCity
    }
    // 获取城市的省份
    //记录城市省份，分块处理数据
    const province_adcode = ref(null)
    const city_name = ref(null)
    const type = ref(null)
    const getCityCode = async (city) => {
        const res = await axios.get(`https://restapi.amap.com/v3/geocode/geo?address=${city}&key=${key.value}`)
        const province = res.data.geocodes[0]['province']
        const response =  await axios.get(`https://restapi.amap.com/v3/geocode/geo?address=${province}&key=${key.value}`)
        province_adcode.value = response.data.geocodes[0]['adcode']
        type.value = res.data.geocodes[0]['level'];
        switch (type.value) {
            case '省':
                city_name.value = res.data.geocodes[0]['province']
                break;
            case '市':
                city_name.value = res.data.geocodes[0]['city']
                break;
            default:
                city_name.value = res.data.geocodes[0]['district']
                break;
        }
    }
    // 获取城市的天气
    const getLocalWeather = async (city) => {
        const res = await axios.get(`https://restapi.amap.com/v3/weather/weatherInfo?city=${city}&key=${key.value}&extensions=base`)
        LocalWeatherInfo.value = {
            weather: res.data.lives[0].weather,
            temperature: res.data.lives[0].temperature,
            winddirection: res.data.lives[0].winddirection,
            windpower: res.data.lives[0].windpower
        }
    }
    function formatcasts(casts) {
        const today = new Date();
        const tomorrow = new Date();
        const currentHour = today.getHours()
        tomorrow.setDate(today.getDate() + 1);
        const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
        casts.forEach(cast => {
            //格式化week
            const castDate = new Date(cast.date);
            if (castDate.toDateString() === today.toDateString()) {
                cast.week = "今天";
            } else if (castDate.toDateString() === tomorrow.toDateString()) {
                cast.week = "明天";
            } else {
                cast.week = weekDays[castDate.getDay()];
            }
            //格式化date
            const date = cast.date.split('-');
            cast.date = date[1] + '-' + date[2];
        })
        return casts
    }
    const getForecastWeather = async (city) => {
        const res = await axios.get(`https://restapi.amap.com/v3/weather/weatherInfo?city=${city}&key=${key.value}&extensions=all`)
        const forecasts = res.data.forecasts[0].casts
        WeatherList.value = formatcasts(forecasts)
    }
    return { city_list, visit_city, HotCities, groupCities, fetchCityList, LocalCity, cityInfo, setCity, getLocallocation, province_adcode, city_name, type,getCityCode, LocalWeatherInfo, getLocalWeather, WeatherList, getForecastWeather, saveVisitedCities, loadVisitedCities }
})