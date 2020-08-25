import * as THREE from 'three'
import { Mesh, Scene } from 'three'
import { Colors } from './Colors'

export class Sea {
  public readonly mesh: Mesh

  public constructor(radius: number, length: number) {
    // const geometry = new THREE.CylinderGeometry(radius, radius, length, 40, 10)
    const geometry = new THREE.SphereGeometry(radius, 10, 10)
    geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
    geometry.mergeVertices()

    const mat = new THREE.MeshPhongMaterial({
      color: Colors.blue,
      transparent: true,
      opacity: .8,
      flatShading: true
    })

    // TODO wave

    this.mesh = new THREE.Mesh(geometry, mat)
    this.mesh.name = 'waves'
    this.mesh.receiveShadow = true
  }
}
