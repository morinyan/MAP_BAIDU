<template>
  <div class="container">
    <div id="mapBox"></div>

    <div class="tools">
      <DropdownMenu
        :menus="menus"
        :select="select"
      />

      <!-- <div class="input">
        <el-input v-model="startAddr" placeholder="我的位置" disabled>
          <template #append>
            <el-button type="primary" @click="getPosition">定位</el-button>
          </template>
        </el-input>

        <br />
        
        <el-input v-model="endAddr" placeholder="搜索">
          <template #append>
            <el-button type="primary" @click="searchAddr">搜索</el-button>
          </template>
        </el-input>

        <br />

        <el-button-group>
          <el-button type="primary" @click="walking">步行</el-button>
          <el-button type="primary" @click="riding">骑行</el-button>
          <el-button type="primary" @click="driving">公交</el-button>
        </el-button-group>
      </div> -->
    </div>
  </div>
</template>
<script>
import DropdownMenu from '@/components/DropdownMenu'

import BMap from './libs/BMap';
import data from './libs/data';
let mapClient;
let routePlan;

export default {
  name: 'App',

  components: {
    DropdownMenu,
  },

  data() {
    return {
      points: [],
      menus: ['A', 'B', 'C', 'D', 'E'],
      startAddr: '',
      startPoint: null,
      endAddr: '',
      endPoint: null,
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


    getPosition() {
      mapClient.getCurrentPosition().then(pt => {
        this.startPoint = pt;
        mapClient.addMarker(pt);
        mapClient.pointToAddr(pt).then(addr => {
          this.startAddr = addr;
        });
      });
    },

    searchAddr() {
      mapClient.addrToPoint(this.endAddr).then(pt => {
        this.endPoint = pt;
      })
    },

    walking() {
      if (routePlan) {
        routePlan.clearResults();
      }
      routePlan = mapClient.walking(this.startPoint, this.endPoint);
    },

    driving() {
      if (routePlan) {
        routePlan.clearResults();
      }
      routePlan = mapClient.driving(this.startPoint, this.endPoint);
    },

    riding() {
      if (routePlan) {
        routePlan.clearResults();
      }
      routePlan = mapClient.riding(this.startPoint, this.endPoint);
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
