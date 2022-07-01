<script>
const BMapGL = window.BMapGL;
const BMapGLLib = window.BMapGLLib;
const COORDINATES_WGS84 = window.COORDINATES_WGS84;
const COORDINATES_BD09 = window.COORDINATES_BD09;
const BMAP_STATUS_SUCCESS = window.BMAP_STATUS_SUCCESS;
const BMAP_EARTH_MAP = window.BMAP_EARTH_MAP;


import data from './libs/data.json'
const MULTIPLE = 600000;
const DEFAULT_CITY = '北京市';
const DEFAULT_ZOOM = 16;
const FRAME_DURATION = 500; // 一个节点的平均时长(ms)

export default {
  name: 'App',

  mounted() {
    console.log(BMapGL, BMapGLLib);

    const map = new BMapGL.Map("app");
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), DEFAULT_ZOOM);
    map.enableScrollWheelZoom(true);

    map.setHeading(0);
    map.setTilt(0);

    this.routeMap(map);
  },

  methods: {
    getCurrent(map) {
      // browser
      const geolocation = new BMapGL.Geolocation();
      geolocation.getCurrentPosition(function(r) {
        if (this.getStatus() == BMAP_STATUS_SUCCESS) {
          const mk = new BMapGL.Marker(r.point)
          map.addOverlay(mk);
          map.panTo(r.point);
        }
      })
    },

    translateEarth(map) {
      map.setMapType(BMAP_EARTH_MAP);
    },

    addControl(map) {
      const scaleCtrl = new BMapGL.ScaleControl();  // 添加比例尺控件
      map.addControl(scaleCtrl);

      const zoomCtrl = new BMapGL.ZoomControl();  // 添加缩放控件
      map.addControl(zoomCtrl);

      const cityCtrl = new BMapGL.CityListControl();  // 添加城市列表控件
      map.addControl(cityCtrl);

      // const opts = {
      //     offset: new BMapGL.Size(150, 5)
      // }
      // // 添加控件
      // map.addControl(new BMapGL.ScaleControl(opts));
      // // 移除控件
      // map.removeControl(new BMapGL.ScaleControl(opts));
    },

    addMarker(map, pos) {
      const point = new BMapGL.Point(pos.lng, pos.lat);   
      const marker = new BMapGL.Marker(point);
      map.addOverlay(marker); 

      // var myIcon = new BMapGL.Icon("markers.png", new BMapGL.Size(23, 25), {   
      //     // 指定定位位置。  
      //     // 当标注显示在地图上时，其所指向的地理位置距离图标左上   
      //     // 角各偏移10像素和25像素。您可以看到在本例中该位置即是  
      //     // 图标中央下端的尖角位置。   
      //     anchor: new BMapGL.Size(10, 25),   
      //     // 设置图片偏移。  
      //     // 当您需要从一幅较大的图片中截取某部分作为标注图标时，您  
      //     // 需要指定大图的偏移位置，此做法与css sprites技术类似。   
      //     imageOffset: new BMapGL.Size(0, 0 - 25)   // 设置图片偏移   
      // });     
      //     // 创建标注对象并添加到地图  
      // var marker = new BMapGL.Marker(point, {icon: myIcon});   
      // map.addOverlay(marker); 

      // this.createPointLabel(map, pos);

      // mouseenter
      let _label = null;
      marker.addEventListener('mouseover', () => {   
          this.createPointLabel(map, pos, '测试文本', (label) => {
            _label = label;
          })
      });

      marker.addEventListener('mouseout', () => {
        map.removeOverlay(_label);
      })
    },

    drawLin(map) {
      const polyline = new window.BMapGL.Polyline([
          new BMapGL.Point(116.399, 39.910),
          new BMapGL.Point(116.405, 39.920),
          new BMapGL.Point(116.425, 39.900)
        ], {strokeColor:"blue", strokeWeight:2, strokeOpacity:0.5});
      map.addOverlay(polyline);

      const polygon = new BMapGL.Polygon([
            new BMapGL.Point(116.387112,39.920977),
            new BMapGL.Point(116.385243,39.913063),
            new BMapGL.Point(116.394226,39.917988),
            new BMapGL.Point(116.401772,39.921364),
            new BMapGL.Point(116.41248,39.927893)
        ], {strokeColor:"blue", strokeWeight:2, strokeOpacity:0.5});
      map.addOverlay(polygon);
    },

    walkLine(map) {
      const walking = new BMapGL.WalkingRoute(map, {renderOptions:{map: map, autoViewport: true}});
      const driving = new BMapGL.DrivingRoute(map, {renderOptions:{map: map, autoViewport: true}});
    
      let output = '需要:';
      const transit = new BMapGL.TransitRoute(map,{
                        renderOptions: {map: map},
                        onSearchComplete: function(results){
                            var plan = results.getPlan(0);
                            output += '总时长：' + plan.getDuration(true);  //获取时间
                            output += '总路程：' + plan.getDistance(true);  //获取距离
                            console.log('output:', output);
                        },
                    });

      console.log(driving, walking, transit)

      let routes = [];
      map.addEventListener('click', function(e) {
        const pt = e.latlng;

        const marker = new BMapGL.Marker(pt);
        map.addOverlay(marker);

        if (routes.length > 2) {
          routes = [];
        }

        routes.push(pt);

        if (routes.length === 2) {
          walking.search(routes[0], routes[1]);
        }
      })
    },

    addrToPoint(map, addr) {
      const myGeo = new BMapGL.Geocoder();
      myGeo.getPoint(addr, function(point){
          if(point){
              map.centerAndZoom(point, 16);
              map.addOverlay(new BMapGL.Marker(point, {title: addr}))
          }else{
              console.log('您选择的地址没有解析到结果！');
          }
      }, DEFAULT_CITY);
    },

    pointToAddr(map, point) {
      const geoc = new BMapGL.Geocoder();
      geoc.getLocation(point, function(rs){
          const addComp = rs.addressComponents;
          const addr = [
                        addComp.province, 
                        addComp.city, 
                        addComp.district, 
                        addComp.street, 
                        addComp.streetNumber
                      ].join(', ');
          console.log(addr);

          map.centerAndZoom(point, DEFAULT_ZOOM);
          map.addOverlay(new BMapGL.Marker(point, {title: addr}))
      });
    },

    routeMap(map) {
      let points = data.display.map(item => new BMapGL.Point(+item.lon / MULTIPLE, +item.lat / MULTIPLE));

      const res_arr = [];

      points.forEach(item => {
        let status = true;

        res_arr.forEach(r => {
          if (
            r.lng === item.lng && 
            r.lat === item.lat
          ) {
            status = false;
          }
        })

        if (status) {
          res_arr.push(item);
        }
      })

      window.data = data;
      window.points = points;
      window.res_arr = res_arr;

      this.WGS84ToBD09(res_arr.slice(0, 10), (res) => {
        console.log('res:', res);
        if(res.status === 0) {
          this.routeTrack(map, res.points)
        }
      });
    },

    WGS84ToBD09(path, callback = () => {}) {
      setTimeout(() => {
        const convertor = new BMapGL.Convertor();
        convertor.translate(path, COORDINATES_WGS84, COORDINATES_BD09, callback);
      }, 500)
    },

    routeTrack(map, paths) {
      const time = FRAME_DURATION * paths.length;
      const pl = new BMapGL.Polyline(paths);
      const trackAni = new BMapGLLib.TrackAnimation(map, pl, {
          overallView: true, // 动画完成后自动调整视野到总览
          tilt: 55,          // 轨迹播放的角度，默认为55
          duration: time,   // 动画持续时长，默认为10000，单位ms
          delay: 0,        // 动画开始的延迟，默认0，单位ms
          zoom: DEFAULT_ZOOM, // 动画中缩放的级别
      });
      trackAni.start();

      for(let i = 0; i < paths.length; i++) {
        setTimeout(() => { 
          this.addMarker(map, paths[i]);
        }, trackAni._pathPercents[i] * time);
      }
    },

    createPointLabel(map, pt, content, callback) {
      let label = new BMapGL.Label(content, {
        position: pt,
        offset: new BMapGL.Size(5, 5)
      });

      map.addOverlay(label);

      label.setStyle({
          color: '#000',
          fontSize: '13px',
          opacity: '0.8',
          border: 'none',
      })

      label.setPosition(pt);

      callback(label);

      // label.addEventListener('mouseout', () => {
      //   map.removeOverlay(label);
      //   label = null;
      // });
    }
  }
}
</script>
