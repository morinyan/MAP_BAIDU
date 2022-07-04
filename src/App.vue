<template>
  <div class="container">
    <div id="mapBox"></div>

    <div class="tools">
      <DropdownMenu
        :menus="menus"
        :select="select"
      />
    </div>
  </div>
</template>
<script>
import DropdownMenu from '@/components/DropdownMenu'

import BMap from './libs/BMap';
import data from './libs/data';
let mapClient;

const getDisplay = target => {
  if (Array.isArray(target.noRepeatDisplay)) {
    return target.noRepeatDisplay;
  }

  const _display = [];

  target.display?.forEach(item => {
    let status = true;

    _display.forEach(r => {
      status = !(r.lon === item.lon && r.lat === item.lat);
    })

    if (status) {
      _display.push(item);
    }
  })

  target.noRepeatDisplay = _display;

  return _display;
};

export default {
  name: 'App',

  components: {
    DropdownMenu,
  },

  data() {
    return {
      carId: "云G66039",
      menus: [],
    }
  },

  mounted() {
    mapClient = new BMap({ el: 'mapBox' });
    this.menus = [...new Set(data.map(({ carId }) => carId))];
  },

  methods: {
    select(name) {
      this.carId = name;
      const target = data.find(({carId}) => carId === this.carId);

      const points = getDisplay(target).map(item => ({ lng: +item.lon/600000, lat: +item.lat/600000, _origin: item }));

      mapClient.map.clearOverlays();
      mapClient.map.trackAni?.cancel();
      mapClient.renderTrack(points);
    }
  }
}
</script>

<style lang="less" scoped>
.container,
#mapBox {
  width: 100vw;
  height: 100vh;
  position: relative;
}

.container {
  .tools {
    position: absolute;
    top: 50px;
    right: 100px;
    z-index: 999;
  }

  .input {
    margin-top: 10px;

    & > div {
      margin-top: 10px;
    }
    /deep/ .el-input-group__prepend,
    /deep/ .el-input-group__append {
      background: #409eff;
      color: #fff;
    }
  }
}
</style>
