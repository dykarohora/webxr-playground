import * as THREE from 'three'
import { Object3D } from 'three'
import { Colors } from './Colors'

export class Cloud {
  public readonly mesh: Object3D

  public constructor() {
    this.mesh = new THREE.Object3D()

    const geometry = new THREE.BoxGeometry(20, 20, 20)
    const mat = new THREE.MeshPhongMaterial({
      color: Colors.white
    })

    const blocksNum = 3 + Math.floor(Math.random() * 3)

    for (let i = 0; i < blocksNum; i++) {
      const m = new THREE.Mesh(geometry, mat)
      m.position.x = i * 15
      m.position.y = Math.random() * 10
      m.position.z = Math.random() * 10
      m.rotation.z = Math.random() * Math.PI * 2
      m.rotation.y = Math.random() * Math.PI * 2

      const scale = .1 + Math.random() * .9
      m.scale.set(scale, scale, scale)

      m.castShadow = true
      m.receiveShadow = true

      this.mesh.add(m)
    }
  }
}
