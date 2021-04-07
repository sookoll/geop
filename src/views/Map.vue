<template>
  <div :id="id"></div>
</template>

<script lang="ts">
import { Vue } from 'vue-decorator'
import { MapService } from '@/services/map.service'
// @ts-ignore
import { map as config } from '@/config/settings'

export default class Map extends Vue {
  id: string = config.el.slice(1)
  mapService: MapService = new MapService()

  mounted(): void {
    this.mapService.init()
  }
}
</script>

<style lang="stylus">
#map
  margin 0
  padding 0
  width 100%
  height 100%
  touch-action: none
  .ol-dragzoom
    border-style: dashed
    border-color: rgba(0, 0, 0, 0.4)
</style>
