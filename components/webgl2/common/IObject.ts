import { vec3, vec4 } from 'gl-matrix'

export interface IObject {
  alias: string
  diffuse?: vec4
  Kd?: vec3
  ambient?: vec4
  Ka?: vec3
  specular?: vec4
  Ks?: vec3
  specularExponent?: number
  Ns?: number
  d?: number
  transparency?: number
  illum?: number

  vertices: number[]
  indices: number[]

  ibo?: WebGLBuffer
  vao?: WebGLVertexArrayObject

  wireframe?: boolean
  visible?: boolean
}
