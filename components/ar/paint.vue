<template>
  <canvas id="canvas" width="600" height="400"></canvas>
</template>

<script lang="ts">
  import Vue from 'vue'
  import * as THREE from 'three'

  import { Component, Prop, Watch } from 'nuxt-property-decorator'

  @Component
  export default class extends Vue {
    private scene = new THREE.Scene()
    private renderer!: THREE.WebGLRenderer
    private camera = new THREE.PerspectiveCamera(75, 600 / 400, 0.1, 1000)
    private light = new THREE.DirectionalLight(0xffffff)
    private cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshNormalMaterial())

    mounted() {
      const $canvas = document.getElementById('canvas') as HTMLCanvasElement
      // canvasを後付けで設定する方法あったら教えてほしいー
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: $canvas
      })

      this.camera.position.set(0, 0, 2)
      this.light.position.set(0, 0, 10)

      this.scene.add(this.cube)
      this.scene.add(this.light)

      this.animate()
    }

    animate() {
      requestAnimationFrame(this.animate);

      this.cube.rotation.x += 0.02;
      this.cube.rotation.y += 0.02;

      this.renderer.render(this.scene, this.camera);      requestAnimationFrame(this.animate);

      this.cube.rotation.x += 0.02;
      this.cube.rotation.y += 0.02;

      this.renderer.render(this.scene, this.camera);
    }
  }
</script>

