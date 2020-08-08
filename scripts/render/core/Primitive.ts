import { RenderBuffer } from './RenderBuffer'
import { vec3 } from 'gl-matrix'

export class PrimitiveAttribute {
  public normalized = false

  public constructor(
    public readonly name: string,
    public readonly buffer: RenderBuffer,
    public readonly componentCount: number = 3,
    public readonly componentType: number = 5126, // gl.FLOAT
    public readonly stride: number = 0,
    public readonly byteOffset: number = 0
  ) {
  }
}

export class Primitive {
  public readonly attributes: PrimitiveAttribute[]
  public readonly elementCount: number
  public readonly mode: number

  private _indexByteOffset: number = 0
  private _indexType: number = 0
  private _indexBuffer: RenderBuffer | null = null
  private _min: vec3 | null = null
  private _max: vec3 | null = null

  public constructor(attributes: PrimitiveAttribute[], elementCount: number = 0, mode: number = 4) {
    this.attributes = attributes
    this.elementCount = elementCount
    this.mode = mode  // 4 - gl.TRIANGLES
  }

  public setIndexBuffer(indexBuffer: RenderBuffer, byteOffset: number = 0, indexType: number = 5123) {
    this._indexBuffer = indexBuffer
    this._indexByteOffset = byteOffset
    this._indexType = indexType
  }

  public setBounds(min: vec3, max: vec3) {
    this._min = vec3.clone(min)
    this._max = vec3.clone(max)
  }
}
