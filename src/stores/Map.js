import { ref } from 'vue';
import { defineStore } from 'pinia'
import { Feature, Map, View } from 'ol';
import { defaults as defaultControls } from 'ol/control'
import { defaults as defaultInteractions } from 'ol/interaction';
import axios from 'axios'
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Circle from 'ol/style/Circle';
import Stroke from 'ol/style/Stroke';
import GeoJSON from 'ol/format/GeoJSON';
import Overlay from 'ol/Overlay';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import { LineString } from 'ol/geom';
import request from '@/js/request'
import { ElNotification } from 'element-plus';
export const useOpenLayers = defineStore('ol', () => {
    const map = ref(null)
    const vector_map = ref(null)
    const image_map = ref(null)
    //初始化地图
    const initMap = (mapId) => {
        vector_map.value = new TileLayer({
            source: new XYZ({
                url: 'https://webst02.is.autonavi.com/appmaptile?style=9&x={x}&y={y}&z={z}&ltype=11'
            })
        });
        image_map.value = new TileLayer({
            source: new XYZ({
                url: 'https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}&ltype=11'
            })
        });
        map.value = new Map({
            target: mapId,
            layers: [image_map.value, vector_map.value],
            view: new View({
                center: [104.25, 31.75],
                zoom: 4,
                projection: 'EPSG:4326'
            }),
            //取消控件
            controls: defaultControls({
                zoom: false,
                rotate: false
            }),
            // 禁止双击放大
            interactions: defaultInteractions({
                doubleClickZoom: false
            })
        })
    }
    //切换地图
    const isVectorMapVisible = ref(true);
    const toggleMap = () => {
        if (isVectorMapVisible.value) {
            vector_map.value.setOpacity(0);
            image_map.value.setOpacity(1);
        } else {
            vector_map.value.setOpacity(1);
            image_map.value.setOpacity(0);
        }
        isVectorMapVisible.value = !isVectorMapVisible.value;
    }
    //解析WKT格式的点坐标
    const parseWKTPoint = (wkt) => {
        const matches = wkt.match(/POINT\s*\(\s*([^\s]+)\s+([^\s]+)\s*\)/i);
        if (matches) {
            return [parseFloat(matches[1]), parseFloat(matches[2])];
        }
        return null;
    }
    //转换成GeoJson格式
    const convertToGeoJSON = (data) => {
        return {
            "type": "FeatureCollection",
            "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
            "features": data.map(store => {
                const coordinates = parseWKTPoint(store.geometry);
                return {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": coordinates
                    },
                    "properties": {
                        "city": store.city,
                        "county": store.county,
                        "discover": store.discover,
                        "province": store.province,
                        "rest_time": store.rest_time,
                        "start_time": store.start_time,
                        "store_id": store.store_id,
                        "store_name": store.store_name
                    }
                }
            })
        }
    }
    //获取数据
    const boundary = ref(null)
    const amount = ref(null)
    const discover = ref(null)
    const unstartbucks = ref(null)
    const distartbucks = ref(null)
    const startbucks_data = ref(null)
    const fetchBoundaryData = async (province, city, type) => {
        //线上版本
        // const boundary_url = `/startsbucksmap/geojson/${province}.geojson`
        //本地版本
        const boundary_url = `./geojson/${province}.geojson`
        const res_boundary = await axios.get(boundary_url)
        const res_startbucks = await request.get('/get_storesdata')
        const boundary_data = res_boundary.data.features.filter(feature => feature.properties.单元.startsWith(city));
        switch (type) {
            case '省':
                startbucks_data.value = res_startbucks.data.data.filter(feature => feature.province.startsWith(city));
                break;
            case '市':
                startbucks_data.value = res_startbucks.data.data.filter(feature => feature.city.startsWith(city));
                break;
            default:
                startbucks_data.value = res_startbucks.data.data.filter(feature => feature.county.startsWith(city));
                break;
        }
        boundary.value = boundary_data[0];
        const undiscover_data = startbucks_data.value.filter(feature => feature.discover === false)
        const discover_data = startbucks_data.value.filter(feature => feature.discover === true)
        discover.value = discover_data.length
        amount.value = startbucks_data.value.length
        // unstartbucks.value = {
        //     "type": "FeatureCollection",
        //     "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        //     features: undiscover_data
        // }
        unstartbucks.value = convertToGeoJSON(undiscover_data)
        distartbucks.value = convertToGeoJSON(discover_data)
        // distartbucks.value = {
        //     "type": "FeatureCollection",
        //     "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        //     features: discover_data
        // }
    }
    //移除之前的样式
    const removeAllLayersExceptBase = () => {
        let layersToRemove = [];
        map.value.getLayers().forEach(layer => {
            if (!(layer instanceof TileLayer)) {
                layersToRemove.push(layer);
            }
        });

        layersToRemove.forEach(layer => {
            map.value.removeLayer(layer);
        });
    }
    //绘制要素
    const mapGeoJson = (style, geojson) => {
        const feature = new GeoJSON().readFeatures(geojson)
        const source = new VectorSource({
            features: feature
        })
        const layer = new VectorLayer({
            source: source,
            style: style
        })
        map.value.addLayer(layer)
    }
    //绘制地图
    const mapData = async (province, city, type, isextend) => {
        await fetchBoundaryData(province, city, type).then(() => {
            removeAllLayersExceptBase();
            //定义样式
            const boundaryStyle = new Style({
                stroke: new Stroke({
                    color: 'red', // 边框颜色
                    width: 4 // 边框宽度
                })
            });
            const startbucksStyle = new Style({
                image: new Circle({
                    radius: 5,
                    stroke: new Stroke({ color: 'blue', width: 2 })
                })
            });
            const distartbucksStyle = new Style({
                image: new Circle({
                    radius: 5,
                    stroke: new Stroke({ color: 'green', width: 2 })
                })
            });
            //缓冲区样式
            const bufferStyle = new Style({
                image: new CircleStyle({
                    radius: 20,
                    fill: new Fill({ color: 'rgba(0,0,0,0' })
                })
            })
            var boundaryFeatures = new GeoJSON().readFeatures(boundary.value);
            var boundarySource = new VectorSource({
                features: boundaryFeatures
            });
            var boundaryLayer = new VectorLayer({
                source: boundarySource,
                style: boundaryStyle
            });
            const extent = boundarySource.getExtent();
            map.value.addLayer(boundaryLayer);
            mapGeoJson([bufferStyle, startbucksStyle], unstartbucks.value)
            mapGeoJson([bufferStyle, distartbucksStyle], distartbucks.value)
            if (isextend) {
                map.value.getView().fit(extent, { duration: 1500, padding: [50, 50, 50, 50] });
            }
        })
    }
    //设置OverLay窗口
    const setOverlay = (container, content) => {
        const overlay = new Overlay({
            element: container,
            autoPan: true,
            autoPanAnimation: { duration: 250 }
        })
        map.value.addOverlay(overlay)
        //设置弹窗内容
        const setOverlayContent = (evt) => {
            let featureFound = false;
            map.value.forEachFeatureAtPixel(evt.pixel, (feature) => {
                if (feature.getGeometry().getType() === 'Point') {
                    const coordinates = feature.getGeometry().getCoordinates();
                    const properties = feature.getProperties();
                    content.innerHTML = `${properties.store_name}<br>营业时间：${properties.start_time}<br>休息时间：${properties.rest_time}`;
                    overlay.setPosition(coordinates);
                    featureFound = true;
                }
            });
            if (!featureFound) {
                overlay.setPosition(undefined)
            }
        }
        map.value.on('pointermove', setOverlayContent)
    }
    //设置Cursor
    const cursorListener = ref(null)
    const enableCursor = () => {
        if (cursorListener.value) {
            return;
        }
        cursorListener.value = (evt) => {
            let hit = false;
            map.value.forEachFeatureAtPixel(evt.pixel, (feature) => {
                if (feature.getGeometry().getType() === 'Point') {
                    hit = true
                }
            });
            map.value.getTargetElement().style.cursor = hit ? 'pointer' : '';
        }
        map.value.on('pointermove', cursorListener.value)
    }
    //取消Cursor
    const disableCursor = () => {
        if (cursorListener.value) {
            map.value.un('pointermove', cursorListener.value)
            cursorListener.value = null;
            map.value.getTargetElement().style.cursor = ''
        }
    }
    //获取门店坐标位置
    const getStartbucksInfo = (callback) => {
        const clickListener = (evt) => {
            map.value.forEachFeatureAtPixel(evt.pixel, (feature) => {
                if (feature.getGeometry().getType() === 'Point') {
                    const properties = feature.getProperties();
                    const coordinates = feature.getGeometry().getCoordinates();
                    callback(properties, coordinates)
                }
            })
        }
        map.value.on('click', clickListener)
    }
    // 在外部定义一个变量来持有当前的dblClickListener引用
    let currentDblClickListener = null;
    //双击表示调查了星巴克门店
    const discover_store = (province, city, type, isextend) => {
        return new Promise((resolve, reject) => {
            const dblClickListener = (evt) => {
                map.value.forEachFeatureAtPixel(evt.pixel, async (feature) => {
                    if (feature.getGeometry().getType() === 'Point') {
                        const properties = feature.getProperties();
                        const store_name = properties.store_name;
                        const store_id = properties.store_id;
                        const discover = properties.discover;
                        if (!discover) {
                            try {
                                ElNotification({
                                    title: '打卡成功',
                                    message: `恭喜您，成功打卡${store_name}这家店`,
                                    type: 'success',
                                    showClose: false,
                                    duration: 3000
                                });
                                await request.patch(`/discover_store/${store_id}`).then(() => {
                                    mapData(province, city, type, isextend)
                                });
                                resolve();
                            } catch (error) {
                                reject(error);
                            }
                        } else {
                            resolve();
                        }
                    }
                });
            };
            // 移除当前活动的dblClickListener（如果有）
            if (currentDblClickListener) {
                map.value.un('dblclick', currentDblClickListener)
            }
            // 添加新的dblClickListener
            map.value.on('dblclick', dblClickListener);
            // 更新当前dblClickListener的引用
            currentDblClickListener = dblClickListener;
        });
    }
    //创建线的样式
    const LineStyle = (color, isDashed = false) => {
        return new Style({
            stroke: new Stroke({
                color: color,
                width: 5,
                lineDash: isDashed ? [10, 10] : undefined
            })
        });
    }
    //创建线的颜色
    const createLineStyle = (status) => {
        switch (status) {
            case '畅通':
                return LineStyle('#00FF00')
                break;
            case '缓行':
                return LineStyle('#FFFF00')
                break;
            case '拥堵':
                return LineStyle('#FF0000')
                break;
            case '严重拥堵':
                return LineStyle('#8B0000')
                break;
            case '端点':
                return LineStyle('#828282', true)
            default:
                return LineStyle('#B0C4DE')
                break;
        }
    }
    const mapRoute = (lineStyle, routeList) => {
        const lineFeature = new Feature({
            geometry: new LineString(routeList)
        });
        const lineSource = new VectorSource({
            features: [lineFeature]
        });
        const lineLayer = new VectorLayer({
            source: lineSource,
            style: lineStyle,
            isLineLayer: true
        });
        map.value.addLayer(lineLayer)
    }
    //获取高德路径数据
    const driving = new AMap.Driving(); // AMap路径规划初始化
    const fetchRoute = (startLngLat, endLngLat) => {
        return new Promise((resolve, reject) => {
            driving.search(startLngLat, endLngLat, (status, result) => {
                if (status === 'complete') {
                    resolve(result.routes); // 使用resolve返回成功的结果
                } else {
                    reject('获取驾车数据失败：' + result); // 使用reject返回失败的原因
                }
            });
        });
    }
    //移除线图层
    const removeLineLayers = () => {
        let layersToRemove = []
        map.value.getLayers().forEach(layer => {
            if (layer.get('isLineLayer')) {
                layersToRemove.push(layer)
            }
        })
        layersToRemove.forEach(layer => {
            map.value.removeLayer(layer)
        })
    }
    //绘制驾车路线
    const navDriving = (startLngLat, endLngLat) => {
        removeLineLayers()
        fetchRoute(startLngLat, endLngLat).then(routes => {
            let routeCoordinates = []
            const route = routes;
            route[0].steps.forEach((step) => {
                step.tmcs.forEach((tmcs) => {
                    const status = tmcs.status;
                    const segmentCoordinates = tmcs.path.map(path => [path.lng, path.lat]);
                    const lineStyle = createLineStyle(status);
                    mapRoute(lineStyle, segmentCoordinates);
                    routeCoordinates = routeCoordinates.concat(segmentCoordinates);
                })
            })
            const firstPoint = routeCoordinates[0];
            const lastPoint = routeCoordinates[routeCoordinates.length - 1];
            // 绘制起点连接第一个点
            mapRoute(createLineStyle('端点'), [startLngLat, firstPoint]);
            // 绘制终点连接最后一个点
            mapRoute(createLineStyle('端点'), [endLngLat, lastPoint]);
        })
            .catch(error => {
                console.error(error)
            })
        disableCursor()
    }
    return { initMap, toggleMap, mapData, discover, amount, setOverlay, getStartbucksInfo, discover_store, enableCursor, navDriving }
})