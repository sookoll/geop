<template>
  <Map></Map>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-decorator'
import Map from '@/views/Map.vue'

@Options({
  name: 'Geop',
  components: {
    Map
  }
})
export default class Geop extends Vue {}
</script>

<style lang="stylus">
html, body
  margin 0
  padding 0
  width 100%
  height 100%
  font-size 13px
#geop
  position: fixed/* fix mobile adressbar issue */
  margin 0
  padding 0
  width 100%
  height 100%
  .btn:focus
    box-shadow: none
    background-color: #333
  .btn-secondary.disabled,
  .btn-secondary:disabled
    border-color: black
    &:hover
      background-color: #6c757d
  .panel-bar .btn-link
    color: white
</style>
