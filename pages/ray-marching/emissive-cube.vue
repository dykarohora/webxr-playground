<template>
  <div>
    <canvas id="canvas"/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop, Watch } from 'nuxt-property-decorator'
//@ts-ignore
import fragmentShaderSource from '../../components/ray-marching/shader/emissive-cube-alt.frag'
import { RayMarchingBase } from '../../components/ray-marching/RayMarchingBase'

@Component
export default class extends Vue {
  mounted() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement
    const rayMarching = new RayMarchingBase(canvas, fragmentShaderSource)
    rayMarching.startRender()
  }

}
</script>

