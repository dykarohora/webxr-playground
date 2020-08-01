<template>
  <div>
    <canvas id="canvas" />
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'

  import { Component } from 'nuxt-property-decorator'
  import { CameraTypes } from '../components/webgl2/ch04/CameraTypes'
  import { CarCamera } from '../components/webgl2/ch04/CarCamera'

  @Component
  export default class extends Vue {
    mounted() {
      const canvas = document.getElementById('canvas') as HTMLCanvasElement
      new CarCamera(canvas)
    }
  }
</script>
