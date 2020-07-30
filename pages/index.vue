<template>
  <div>
    <canvas id="canvas" />
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'

  import { Component } from 'nuxt-property-decorator'
  import { StateMachine } from '../components/webgl2/ch02/StateMachine'
  import { GoraudLambert } from '../components/webgl2/ch03/GoraudLambert'
  import { GoraudPhong } from '../components/webgl2/ch03/GoraudPhong'

  @Component
  export default class extends Vue {
    mounted() {
      const canvas = document.getElementById('canvas') as HTMLCanvasElement
      const sphere = new GoraudLambert(canvas)
    }
  }
</script>
