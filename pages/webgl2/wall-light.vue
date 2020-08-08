<template>
  <div>
    <canvas id="canvas" />
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { Component, Prop, Watch } from 'nuxt-property-decorator'
  import { WallLight } from '../../components/webgl2/ch06/WallLight'

  @Component
  export default class extends Vue {
    mounted() {
      const canvas = document.getElementById('canvas') as HTMLCanvasElement
      new WallLight(canvas)
    }
  }
</script>

