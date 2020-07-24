<template>
  <div></div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import * as THREE from 'three'

  import { ARButton } from '../components/ar/ARButton'

  import { Component } from 'nuxt-property-decorator'

  @Component
  export default class extends Vue {

    private scene!: THREE.Scene
    private camera!: THREE.Camera
    private renderer!: THREE.WebGLRenderer
    private controller!: THREE.Group
    private reticle!: THREE.Mesh

    private hitTestSource: any = null
    private hitTestSourceRequested: boolean = false

    mounted() {
      this.init()
      this.animate()
    }

    init() {
      const container = document.createElement('div')
      document.body.appendChild(container)

      this.scene = new THREE.Scene()
      this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20)

      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1)
      light.position.set(0, 1, 0)
      this.scene.add(light)

      this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
      this.renderer.setPixelRatio(window.devicePixelRatio)
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      this.renderer.xr.enabled = true
      container.appendChild(this.renderer.domElement)

      document.body.appendChild(ARButton.createButton(this.renderer, {requiredFeatures: ['hit-test']}))

      const geometry = new THREE.CylinderBufferGeometry(0, 0.05, 0.2, 32).rotateX(Math.PI / 2)

      this.controller = this.renderer.xr.getController(0)

      this.controller.addEventListener('select', () => {
        const material = new THREE.MeshPhongMaterial({color: 0xffffff * Math.random()})
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(0, 0, -0.3).applyMatrix4(this.controller.matrixWorld)
        mesh.quaternion.setFromRotationMatrix(this.controller.matrixWorld)
        this.scene.add(mesh)
      })

      this.scene.add(this.controller)

      window.addEventListener('resize', () => {
        //@ts-ignore
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateMatrixWorld()

        this.renderer.setSize(window.innerWidth, window.innerHeight)
      }, false)
    }

    animate() {
      this.renderer.setAnimationLoop(this.render)
    }

    render() {
      this.renderer.render(this.scene, this.camera)
    }
  }
</script>
