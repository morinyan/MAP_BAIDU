<template>
  <div class="flex flex-wrap items-center">
    <el-dropdown
      trigger="click"
      split-button
      type="primary"
      @click="handleClick"
    >
      {{ target }}
      <template #dropdown>
        <el-dropdown-menu class="menu">
          <el-dropdown-item
            v-for="(item, index) in menus"
            :key="index"
            @click="selectFn(item, index)"
          > {{ item }} </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script>
export default {
  name: 'DropdownMenu',

  props: {
    menus: {
      type: Array,
      default() {
        return []
      }
    },

    select: {
      type: Function,
      default: () => {}
    }
  },

  data() {
    return {
      target: '请选择车辆'
    }
  },

  methods: {
    selectFn(item, index) {
      this.target = item;
      this.select(item, index);
    }
  }
}

</script>
<style scoped>
.example-showcase .el-dropdown + .el-dropdown {
  margin-left: 15px;
}
.example-showcase .el-dropdown-link {
  cursor: pointer;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
}
.menu {
  max-height: 300px;
  overflow-y: scroll;
}
</style>
