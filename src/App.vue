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

export default {
  name: 'App',

  components: {
    DropdownMenu,
  },

  data() {
    return {
      points: [],
      menus: ['A', 'B', 'C', 'D', 'E'],
    }
  },

  mounted() {
    mapClient = new BMap({
      el: 'mapBox',
    });

    this.points = data.display.map(({lon, lat}) => ({lng: +lon/600000, lat: +lat/600000}));
    
    window.morin = this;
    window.mapClient = mapClient;
    mapClient.bindEvents();
  },

  methods: {
    select(item) {
      console.log('select: ', item);
      mapClient.map.clearOverlays();
      mapClient.renderTrack(this.points);
    },
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
}
</style>
