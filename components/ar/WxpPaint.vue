<template>
  <div></div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import * as THREE from 'three'

  import { ARButton } from './ARButton'

  import { TubePainter } from './TubePainter'

  import { Component } from 'nuxt-property-decorator'

  @Component
  export default class extends Vue {

    private scene!: THREE.Scene
    private camera!: THREE.Camera
    private renderer!: THREE.WebGLRenderer
    private painter!: TubePainter
    private controller!: THREE.Group

    private cursor = new THREE.Vector3()

    mounted() {
      this.init()
      this.animate()
    }

    init() {
      const container = document.createElement('div')
      document.body.appendChild(container)

      this.scene = new THREE.Scene()
      this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20)

      this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
      this.renderer.setPixelRatio(window.devicePixelRatio)
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      this.renderer.xr.enabled = true
      container.appendChild(this.renderer.domElement)

      document.body.appendChild(ARButton.createButton(this.renderer))

      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1)
      light.position.set(0, 1, 0)
      this.scene.add(light)

      this.painter = new TubePainter()
      //@ts-ignore
      this.painter.setSize(0.4)
      //@ts-ignore
      this.painter.mesh.material.side = THREE.DoubleSide
      this.scene.add(this.painter.mesh)

      this.controller = this.renderer.xr.getController(0)

      this.controller.addEventListener(
        'selectstart', () => {
          this.controller.userData.isSelecting = true
          this.controller.userData.skipFrames = 2
        }
      )
      this.controller.addEventListener(
        'selectend', () => {
          this.controller.userData.isSelecting = false
        }
      )

      this.controller.userData.skipFrames = 0

      this.scene.add(this.controller)

      window.addEventListener('resize', () => {
        //@ts-ignore
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateMatrixWorld()

        this.renderer.setSize(window.innerWidth, window.innerHeight)
      }, false)
    }

    handleController(controller: THREE.Group) {
      const userData = controller.userData

      this.cursor.set(0, 0, -0.2).applyMatrix4(controller.matrixWorld)
      if (userData.isSelecting) {
        if (userData.skipFrames >= 0) {
          userData.skipFrames--
          this.painter.moveTo(this.cursor)
        } else {
          this.painter.lineTo(this.cursor)
          this.painter.update()
        }
      }
    }

    render() {
      this.handleController(this.controller)
      this.renderer.render(this.scene, this.camera)
    }

    animate() {
      this.renderer.setAnimationLoop(this.render)
    }
  }
</script>

