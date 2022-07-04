export default {
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
  },

  walking(start, end) {
    const { map } = this;
    const walking = new BMapGL.WalkingRoute(map, {renderOptions:{map: map, autoViewport: true}});
    walking.search(start, end);
    return walking;
  },

  driving(start, end) {
    const { map } = this;
    const driving = new BMapGL.DrivingRoute(map, {renderOptions:{map: map, autoViewport: true}});
    driving.search(start, end);
    return driving;
  },

  riding(start, end) {
    const { map } = this;
    const riding = new BMapGL.RidingRoute(map, {renderOptions:{map: map, autoViewport: true}});
    riding.search(start, end);
    return riding;
  },

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
            console.log('Not Address！');
        }
      }, DEFAULT_CITY);
    })
  },

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

        map.centerAndZoom(point, DEFAULT_ZOOM);
        map.addOverlay(new BMapGL.Marker(point, {title: addr}))
        resolve(addr);
      });
    })
  },

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
  },

  // set map type
  toEarthMap(type) {
    this.map.setMapType(type || BMAP_EARTH_MAP);
  },

  removeControl(control) {
    this.map.removeControl(control);
  },

  bindEvents() {
    this.map.addEventListener('click', (e) => {
      this.addMarker(e.latlng);
    });
  }
}