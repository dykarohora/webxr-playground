import { Primitive } from './Primitive'
import { RenderPrimitiveAttribute } from './RenderPrimitiveAttribute'
import { RenderPrimitiveAttributeBuffer } from './RenderPrimitiveAttributeBuffer'
import { RenderBuffer } from './RenderBuffer'
import { vec3 } from 'gl-matrix'
import { RenderMaterial } from './RenderMaterial'
import { Node } from './Node'

export const ATTRIB_MASK = {
  POSITION: 0x0001,     // 000001
  NORMAL: 0x0002,       // 000010
  TANGENT: 0x0004,      // 000100
  TEXCOORD_0: 0x0008,   // 001000
  TEXCOORD_1: 0x0010,   // 010000
  COLOR_0: 0x0020       // 100000
} as const

export class RenderPrimitive {
  private _activeFrameId: number = 0
  private readonly _instances: Node[] = []

  private _material: RenderMaterial | null = null

  // レンダリングするプリミティブのタイプ(TRIANGLESとかLINEとか)
  private readonly _mode!: GLenum

  private _promise: Promise<any> | null = null
  //
  private _vao: WebGLVertexArrayObjectOES | null = null
  private _attributeBuffers: RenderPrimitiveAttributeBuffer[] = []
  private _attributeMask: number = 0

  // インデックス
  // インデックスバッファ(WebGLBuffer)をキャッシュするオブジェクトへの参照
  private readonly _indexBuffer: RenderBuffer
  // インデックス配列のどこからがレンダリング位置かをあらわすオフセット
  private readonly _indexByteOffset: number
  // インデックスの要素のデータ型 UNSIGNED_BYTEかUNSIGNED_SHORT
  private readonly _indexType: GLenum
  // インデックスの数
  private readonly _elementCount: number

  private _min: vec3 | null = null
  private _max: vec3 | null = null
  private _complete = false

  public constructor(primitive: Primitive) {
    this._mode = primitive.mode
    this._elementCount = primitive.elementCount

    // 頂点バッファの処理
    // PrimitiveがもつPrimitiveAttributeを走査して頂点バッファとそのメタデータをシェーダに渡すための
    // RenderPrimitiveAttributeBufferを作る
    for (let attribute of primitive.attributes) {
      this._attributeMask |= ATTRIB_MASK[attribute.name]
      // attributeについてのオブジェクト
      const renderAttribute = new RenderPrimitiveAttribute(attribute)
      let foundBuffer = false

      // RenderPrimitiveAttributeBufferを操作して、それぞれが内部でもつWebGLBufferが同一ならば、
      // そのattributeは同じ頂点バッファに関するものということなので、
      // おなじRenderPrimitiveAttributeBufferにRenderPrimitiveAttributeを保持させる
      for (const attributeBuffer of this._attributeBuffers) {
        if (attributeBuffer.buffer === attribute.buffer) {
          attributeBuffer.pushRenderPrimitiveAttribute(renderAttribute)
          foundBuffer = true
          break
        }
      }

      // 初出のWebGLBufferだったら新しくRenderPrimitiveAttributeBufferを作る
      if (!foundBuffer) {
        const attributeBuffer = new RenderPrimitiveAttributeBuffer(attribute.buffer)
        attributeBuffer.pushRenderPrimitiveAttribute(renderAttribute)
        // attributeBuffer.attributes.push(renderAttribute)
        this._attributeBuffers.push(attributeBuffer)
      }
    }

    // インデックスバッファ
    this._indexByteOffset = primitive.indexByteOffset
    this._indexType = primitive.indexType
    this._indexBuffer = primitive.indexBuffer

    if (primitive.min !== null && primitive.max !== null) {
      this._min = vec3.clone(primitive.min)
      this._max = vec3.clone(primitive.max)
    }
  }

  public get material() {
    return this._material
  }

  public get mode() {
    return this._mode
  }

  public get vao() {
    return this._vao
  }

  public setVao(vao: WebGLVertexArrayObjectOES) {
    this._vao = vao
  }

  //
  public get attributeBuffers() {
    return this._attributeBuffers
  }

  public get attributeMask() {
    return this._attributeMask
  }

  public get indexBuffer() {
    return this._indexBuffer
  }

  public get indexByteOffset() {
    return this._indexByteOffset
  }

  public get indexType() {
    return this._indexType
  }

  public get elementCount() {
    return this._elementCount
  }


  public get instances() {
    return this._instances
  }

  public markActive(frameId: number) {
    if (this._complete && this._activeFrameId !== frameId) {
      if (this._material !== null) {
        if (!this._material.markActive(frameId)) {
          return
        }
      }
      this._activeFrameId = frameId
    }
  }


  public setRenderMaterial(material: RenderMaterial) {
    this._material = material
    this._promise = null
    this._complete = false

    if (this._material !== null) {
      this.waitForComplete()
    }
  }

  private waitForComplete() {
    if (this._promise === null) {
      if (this._material === null) {
        return Promise.reject('RenderPrimitive does not have a material')
      }

      let completionPromises: Promise<any>[] = []

      this._promise = Promise.all(completionPromises).then(() => {
        this._complete = true
        return this
      })
    }
    return this._promise
  }
}
