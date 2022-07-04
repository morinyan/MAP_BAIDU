const BMapGL = window.BMapGL;
const BMapGLLib = window.BMapGLLib;
const COORDINATES_WGS84 = window.COORDINATES_WGS84;
const COORDINATES_BD09 = window.COORDINATES_BD09;
const BMAP_STATUS_SUCCESS = window.BMAP_STATUS_SUCCESS;
const BMAP_EARTH_MAP = window.BMAP_EARTH_MAP;

const DEFAULT_CITY = '全国';
const DEFAULT_ZOOM = 16;
const FRAME_DURATION = 500;  // 一个节点的平均时长(ms)
const ENABLE_SCROLL_WHEEL_ZOOM = true;
const DEFAULT_ELE = null;
const DETAULT_POINT = { lng: 116.404, lat: 39.915 };

// functions
const getBMPoint = ({ lng, lat }) => (new BMapGL.Point(lng, lat));
const getPolyline = pt => new BMapGL.Polyline(pt);
const getBMLabel = (content, opts) => (new BMapGL.Label(content, opts));

const createContol = (type, opts) => { 
  const MapControlAdapter = {
    'scale': BMapGL.ScaleControl,      // 添加比例尺控件
    'zoom': BMapGL.ZoomControl,        // 添加缩放控件
    'city': BMapGL.CityListControl,    // 添加城市列表控件
  };

  const AdapterClass = MapControlAdapter[type];

  if (!AdapterClass) {
    console.error('Not Found Control!');
    return;
  }

  return new AdapterClass(opts);
};

const translateFn = pts => new Promise((resolve, reject) => {
  const convertor = new BMapGL.Convertor();
  convertor.translate(
    pts,
    COORDINATES_WGS84,
    COORDINATES_BD09,
    ({status, points}) => {
      if (status === BMAP_STATUS_SUCCESS) {
        resolve(points);
      } else {
        reject(status);
      }
    }
  );
});

export class BMap {
  map = null;                 // map实例
  opts = {};                  // map配置
  currentPosition = null;     // 当前位置定位
  trackAniDurations = 0;      // 路书动画执行总时长
  trackAni = null;            // 路书动画句柄
  trackPaths = [];            // 轨迹点
  trackPathPointMarkers = []; // 轨迹点对应的marker
  controlList = [];           // 控件

  constructor(options) {
    this.opts = {
      el: DEFAULT_ELE,
      city: DEFAULT_CITY,
      zoom: DEFAULT_ZOOM,
      frameRate: FRAME_DURATION,
      enableScrollWheelZoom: ENABLE_SCROLL_WHEEL_ZOOM,
      defaultPoint: DETAULT_POINT,
      ...options
    };

    this.createMap();
    this.init();
  }

  createMap() {
    this.map = new BMapGL.Map(this.opts.el);
  }

  init() {
    const {
      map,
      opts,
    } = this;

    map.centerAndZoom(
      getBMPoint(opts.defaultPoint), 
      DEFAULT_ZOOM
    );
    map.enableScrollWheelZoom(opts.enableScrollWheelZoom);

    map.setHeading(0);
    map.setTilt(0);

    this.addControl('scale');
    this.addControl('zoom');
    this.addControl('city');
  }

  renderTrack(points = []) {
    const paths = [];

    // check points
    if(!Array.isArray(points)) {
      return console.error('gps data points error!');
    }

    // 过滤去重
    points.forEach(({ lng, lat }) => {
      let status = true;

      paths.forEach(r => {
        status = !(r.lng === lng && r.lat === lat);
      })

      if (status) {
        paths.push(getBMPoint({ lng: lng, lat: lat}));
      }
    })

    this.WGS84ToBD09(paths).then(list => {
      this.trackPaths = list.flat(2);
      this.startTrackAnimation();
    });
  }

  startTrackAnimation() {
    // 创建轨迹动画
    this.createTrackAnimation()

    // 启动
    this.trackAni.start();

    // 创建marker
    this.createTrackPointMarkerAni();
  }

  createTrackAnimation() {
    const {
      map,
      opts,
      trackPaths
    } = this,
    duration = opts.frameRate * trackPaths.length,
    pl = getPolyline(trackPaths);

    this.trackAniDurations = duration;

    this.trackAni = new BMapGLLib.TrackAnimation(map, pl, {
        overallView: true,      // 动画完成后自动调整视野到总览
        tilt: 55,               // 轨迹播放的角度，默认为55
        duration,               // 动画持续时长，默认为10000，单位ms
        delay: 0,               // 动画开始的延迟，默认0，单位ms
        zoom: DEFAULT_ZOOM,     // 动画中缩放的级别
    });
  }

  createTrackPointMarkerAni() {
    const { trackPaths, trackAniDurations } = this;
    const { _pathPercents } = this.trackAni;
    const count = trackPaths.length;

    for(let i = 0; i < count; i++) {
      setTimeout(() => { 
        this.addMarker(trackPaths[i]);
      }, _pathPercents[i] * trackAniDurations);
    }
  }

  addMarker(point) {
    let label = null;
    const marker = new BMapGL.Marker(point);

    this.map.addOverlay(marker);
    // 链接point和marker
    this.trackPathPointMarkers.push({ marker, _point: point });
    
    marker.addEventListener('mouseover', () => {
      const tpl = `坐标: ${JSON.stringify(point)}`;
      label = this.createPointLabel(point, tpl);
    });

    marker.addEventListener('mouseout', () => {
      label && this.map.removeOverlay(label);
    })
  }

  createPointLabel(pt, content) {
    let label = getBMLabel(content, {
      position: pt,
      offset: new BMapGL.Size(5, 5)
    });

    this.map.addOverlay(label);

    label.setStyle({
      // color: '#409eff',
      color: '#ffffff',
      fontSize: '16px',
      opacity: '1',
      border: 'none',
      padding: '5px',
      borderRadius: '4px',
      background: 'rgba(0,0,0,0.5)',
    })

    label.setPosition(pt);

    return label;
  }

  // WGS to BD09
  WGS84ToBD09(paths) {
    const promiseList = [];
    const len = paths.length;
    let index = 0;

    while(index < Math.ceil(len / 10)) {
      const start = index * 10;
      const end = (index + 1) * 10 < len ? (index + 1) * 10 : len;

      promiseList.push(translateFn(paths.slice(start, end)))

      index++;
    }

    return Promise.all(promiseList);
  }

  // ==============================================
  // geolocation
  getCurrentPosition() {
    const self = this;
    return new Promise((resolve, reject) => {
      const geolocation = new BMapGL.Geolocation();
      geolocation.getCurrentPosition(function(res) {
        if (this.getStatus() == BMAP_STATUS_SUCCESS) {
          const pt = res.point;
          self.currentPosition = pt;
          resolve(pt)
        } else {
          reject(new Error('geolocation error!'));
        }
      })
    })
  }

  // set map type
  toEarthMap(type) {
    this.map.setMapType(type || BMAP_EARTH_MAP);
  }

  // add control
  addControl(type, opts = {}) {
    const control = createContol(type, opts);

    this.map.addControl(control);
    this.controlList.push(control);
  }

  // remove control
  removeControl(control) {
    this.map.removeControl(control);
  }

  // point line
  paintLine() {
    const polyline = new BMapGL.Polyline([
      new BMapGL.Point(116.399, 39.910),
      new BMapGL.Point(116.405, 39.920),
      new BMapGL.Point(116.425, 39.900)
    ], {strokeColor:"blue", strokeWeight:2, strokeOpacity:0.5});
    
    this.map.addOverlay(polyline);

    const polygon = new BMapGL.Polygon([
      new BMapGL.Point(116.387112,39.920977),
      new BMapGL.Point(116.385243,39.913063),
      new BMapGL.Point(116.394226,39.917988),
      new BMapGL.Point(116.401772,39.921364),
      new BMapGL.Point(116.41248,39.927893)
    ], {strokeColor:"blue", strokeWeight:2, strokeOpacity:0.5});
    
    this.map.addOverlay(polygon);
  }

  walking(start, end) {
    const { map } = this;
    const walking = new BMapGL.WalkingRoute(map, {renderOptions:{map: map, autoViewport: true}});
    walking.search(start, end);
    return walking;
  }

  driving(start, end) {
    const { map } = this;
    const driving = new BMapGL.DrivingRoute(map, {renderOptions:{map: map, autoViewport: true}});
    driving.search(start, end);
    return driving;
  } 

  riding(start, end) {
    const { map } = this;
    const riding = new BMapGL.RidingRoute(map, {renderOptions:{map: map, autoViewport: true}});
    riding.search(start, end);
    return riding;
  }

  walkLine() {
    const { map } = this;
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
  }

  addrToPoint(addr) {
    const { map } = this;
    const myGeo = new BMapGL.Geocoder();
    return new Promise((resolve) => {
      myGeo.getPoint(addr, (point) => {
        if(point){
            map.centerAndZoom(point, 16);
            map.addOverlay(new BMapGL.Marker(point, {title: addr}))
            resolve(point);
        }else{
            console.log('您选择的地址没有解析到结果！');
        }
      }, DEFAULT_CITY);
    })
  }

  pointToAddr(point) {
    const { map } = this;
    const geoc = new BMapGL.Geocoder();
    return new Promise((resolve) => {
      geoc.getLocation(point, (rs) => {
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
        resolve(addr);
      });
    })
  }

  // bind event for map instance
  bindEvents() {
    this.map.addEventListener('click', (e) => {
      this.addMarker(e.latlng);
    });
  }
}

export default BMap
