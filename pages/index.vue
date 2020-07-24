<template>
  <div></div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import * as THREE from 'three'

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

      if ('xr' in navigator) {
        //@ts-ignore
        navigator.xr.isSessionSupported('immersive-ar').then((supported: boolean) => {
          if (supported) {
            //@ts-ignore
            navigator.xr.requestSession('immersive-ar', {requiredFeatures: ['hit-test']}).then((session: any) => {
              session.addEventListener('end', () => {

              })

              this.renderer.xr.setReferenceSpaceType('local')
              this.renderer.xr.setSession(session)

              const geometry = new THREE.CylinderBufferGeometry(0.1, 0.1, 0.2, 32).translate(0, 0.1, 0)

              this.controller = this.renderer.xr.getController(0)
              this.controller.addEventListener('select', () => {
                if (this.reticle.visible) {
                  const material = new THREE.MeshPhongMaterial({color: 0xffffff * Math.random()})
                  const mesh = new THREE.Mesh(geometry, material)
                  mesh.position.setFromMatrixPosition(this.reticle.matrix)
                  mesh.scale.y = Math.random() * 2 + 1
                  this.scene.add(mesh)
                }
              })

              this.scene.add(this.controller)

              this.reticle = new THREE.Mesh(
                new THREE.RingBufferGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
                new THREE.MeshBasicMaterial()
              )
              this.reticle.matrixAutoUpdate = false
              this.reticle.visible = false
              this.scene.add(this.reticle)

              window.addEventListener('resize', () => {
                //@ts-ignore
                this.camera.aspect = window.innerWidth / window.innerHeight
                this.camera.updateMatrixWorld()

                this.renderer.setSize(window.innerWidth, window.innerHeight)
              }, false)

              this.animate()
            })
          }
        }).catch(() => {
          return
        })
      }
    }

    animate() {
      this.renderer.setAnimationLoop(this.render)
    }

    render(timestamp: any, frame: any) {

      if (frame) {

        const referenceSpace = this.renderer.xr.getReferenceSpace()
        const session = this.renderer.xr.getSession()

        if (this.hitTestSourceRequested === false) {

          session.requestReferenceSpace('viewer').then((referenceSpace: any) => {

            session.requestHitTestSource({space: referenceSpace}).then((source: any) => {

              this.hitTestSource = source

            })

          })

          session.addEventListener('end', () => {

            this.hitTestSourceRequested = false
            this.hitTestSource = null

          })

          this.hitTestSourceRequested = true

        }

        if (this.hitTestSource) {
          const hitTestResults = frame.getHitTestResults(this.hitTestSource)
          if (hitTestResults.length) {
            const hit = hitTestResults[0]
            this.reticle.visible = true
            this.reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix)
          } else {
            this.reticle.visible = false
          }
        }
      }

      this.renderer.render(this.scene, this.camera)
    }
  }
</script>
