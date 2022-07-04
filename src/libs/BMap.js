const BMapGL = window.BMapGL;
const BMapGLLib = window.BMapGLLib;
const COORDINATES_WGS84 = window.COORDINATES_WGS84;
const COORDINATES_BD09 = window.COORDINATES_BD09;
const BMAP_STATUS_SUCCESS = window.BMAP_STATUS_SUCCESS;
// const BMAP_EARTH_MAP = window.BMAP_EARTH_MAP;

const DEFAULT_CITY = '全国';
const DEFAULT_ZOOM = 16;
const FRAME_DURATION = 500;
const ENABLE_SCROLL_WHEEL_ZOOM = false;
const DEFAULT_ELE = null;
const DETAULT_POINT = { lng: 116.404, lat: 39.915 };

const getSize = (...args) => new BMapGL.Size(...args);
const getBMLabel = (...args) => (new BMapGL.Label(...args));
const getPolyline = (...args) => new BMapGL.Polyline(...args);
const getBMPoint = ({ lng, lat }) => (new BMapGL.Point(lng, lat));
const getTrackAnimation = (...args) => new BMapGLLib.TrackAnimation(...args);
const createContol = (type, opts = {}) => { 
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
  map = null;                 // 实例
  opts = {};                  // 配置
  currentPosition = null;     // 当前位置定位
  trackAniDurations = 0;      // 路书动画执行总时长
  trackAni = null;            // 路书动画句柄
  trackPaths = [];            // 轨迹点
  trackPathPointMarkers = []; // 轨迹点对应的marker
  controlList = [];           // 控件列表

  constructor(options = {}) {
    this.opts = {
      el: DEFAULT_ELE,                                       // 容器
      city: DEFAULT_CITY,                                    // 默认城市
      zoom: DEFAULT_ZOOM,                                    // 缩放
      frameRate: FRAME_DURATION,                             // 节点动画平均时长
      enableScrollWheelZoom: ENABLE_SCROLL_WHEEL_ZOOM,       // 滚动滑轮缩放
      defaultPoint: DETAULT_POINT,                           // 默认坐标
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

    this.addControl('scale');
    this.addControl('zoom');
    this.addControl('city');
  }

  async renderTrack(points = []) {
    // check points
    if(!Array.isArray(points)) {
      return console.error('gps data points error!');
    }

    const list = await this.WGS84ToBD09(points.map(pt => getBMPoint(pt)))
    this.trackPaths = list.flat(2);
    // start
    this.startTrackAnimation();
  }

  async startTrackAnimation() {
    // 创建轨迹动画
    this.createTrackAnimation();
    // 创建marker
    this.createTrackPointMarkerAni();
    // 启动
    this.trackAni.start();
  }

  createTrackAnimation() {
    const {
      map,
      opts,
      trackPaths
    } = this,
    duration = opts.frameRate * trackPaths.length;

    const point = [];
    for (let i = 0; i < trackPaths.length; i++) {
        point.push(new BMapGL.Point(trackPaths[i].lng, trackPaths[i].lat));
    }
    
    this.trackAni = getTrackAnimation(map, getPolyline(point), {
      overallView: true,      // 动画完成后自动调整视野到总览
      tilt: 30,               // 轨迹播放的角度，默认为55
      duration,               // 动画持续时长，默认为10000，单位ms
      delay: 300,               // 动画开始的延迟，默认0，单位ms
    });

    this.trackAniDurations = duration;
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
    this.trackPathPointMarkers.push({ marker });
    
    marker.addEventListener('mouseover', () => {
      const tpl = `${JSON.stringify(point)}`;
      label = this.createPointLabel(point, tpl);
    });

    marker.addEventListener('mouseout', () => {
      label && this.map.removeOverlay(label);
    })
  }

  createPointLabel(pt, content) {
    let label = getBMLabel(content, {
      position: pt,
      offset: getSize(5, 5)
    });

    this.map.addOverlay(label);

    label.setStyle({
      color: '#ffffff',
      fontSize: '16px',
      opacity: '1',
      border: 'none',
      padding: '5px',
      borderRadius: '4px',
      background: 'rgba(0,0,0,0.5)',
    });
    label.setPosition(pt);

    return label;
  }

  async WGS84ToBD09(paths) {
    const promiseList = [];
    const len = paths.length;
    let index = 0;

    while(index < Math.ceil(len / 10)) {
      const start = index * 10;
      const end = (index + 1) * 10 < len ? (index + 1) * 10 : len;

      promiseList.push(translateFn(paths.slice(start, end)));
      index++;
    }

    return Promise.all(promiseList);
  }

  addControl(type, opts = {}) {
    const control = createContol(type, opts);
    this.map.addControl(control);
    this.controlList.push(control);
  }
}

export default BMap;
