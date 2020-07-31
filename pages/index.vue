<template>
  <div>
    <canvas id="canvas" />
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'

  import { Component } from 'nuxt-property-decorator'
  import { PositionalLight } from '../components/webgl2/ch03/PositionalLight'
  import { CameraMatrix } from '../components/webgl2/ch04/CameraMatrix'

  @Component
  export default class extends Vue {
    mounted() {
      const canvas = document.getElementById('canvas') as HTMLCanvasElement
      new CameraMatrix(canvas)
    }
  }
</script>
