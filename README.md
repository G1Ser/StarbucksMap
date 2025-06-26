# StarbucksMap
##### 这是一个基于 Vue 3 框架的项目，结合了高德地图 API 和 Element Plus 组件库，并使用了 OpenLayers 技术和后端的 PostGIS 数据库。该项目旨在提供一个星巴克地图应用，用户可以查看城市中星巴克门店的数量，并提供打卡和导航功能。希望这个项目对你有所帮助！

###### 项目配置
去高德地图申请两个密钥，其中一个Web服务密钥，另一个是Web端密钥。
```
// index.html 11行 设置你Web端密钥对应的安全密钥
securityJsCode: '<Your SecurityJsCode>'
// index.html 15行 设置你Web端的密钥
src="https://webapi.amap.com/maps?v=2.0&key=<Your JsKey>&plugin=AMap.Driving">
// ./src/stores/GaoDe.js 11行 设置你Web服务的密钥
const key = ref('Your Key')
```

###### 项目运行
```
npm install

npm run dev
```

###### 线上地址
https://43.139.219.105/startsbucksmap/
