<template>
  <div>
    <canvas id="canvas" />
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'

  import { Component } from 'nuxt-property-decorator'
  import { RenderingSquareVAO } from '../components/webgl2/ch2/RenderingSquareVAO'

  @Component
  export default class extends Vue {
    mounted() {
      const canvas = document.getElementById('canvas') as HTMLCanvasElement
      const square = new RenderingSquareVAO(canvas)
    }
  }
</script>
