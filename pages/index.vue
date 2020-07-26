<template>
  <div>
    <canvas id="canvas" />
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'

  import { Component } from 'nuxt-property-decorator'
  import WxpPaint from '../components/ar/WxpPaint.vue'
  import { RenderingSquare } from '../components/webgl2/ch2/RenderingSquare'

  @Component
  export default class extends Vue {
    mounted() {
      const canvas = document.getElementById('canvas') as HTMLCanvasElement
      const square = new RenderingSquare(canvas)
    }
  }
</script>
