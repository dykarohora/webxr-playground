import * as THREE from 'three'
import { Object3D } from 'three'
import { Cloud } from './Cloud'

export class Sky {
  public readonly mesh: Object3D

  private readonly cloudsNum: number

  public constructor() {
    this.mesh = new Object3D()
    this.cloudsNum = 20

    const stepAngle = Math.PI * 2 / this.cloudsNum

    for(let i=0; i<this.cloudsNum; i++) {
      const cloud = new Cloud()

      const a = stepAngle * i
      const h = 750 + Math.random() * 200

      cloud.mesh.position.y = Math.sin(a) * h
      cloud.mesh.position.x = Math.cos(a) * h
      cloud.mesh.rotation.z = a + Math.PI/2
      cloud.mesh.position.z = -400 - Math.random() * 400

      const s = 1 + Math.random() * 2
      cloud.mesh.scale.set(s,s,s)

      this.mesh.add(cloud.mesh)
    }
  }
}
