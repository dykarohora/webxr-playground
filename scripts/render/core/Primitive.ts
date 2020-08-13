import { RenderBuffer } from './RenderBuffer'
import { vec3 } from 'gl-matrix'
import { PrimitiveAttribute } from './PrimitiveAttribute'

const GL = WebGL2RenderingContext

/**
 * 頂点バッファとインデックスバッファへの参照を持つオブジェクト
 */
export class Primitive {
  // 頂点バッファと、それに関連するattributeの情報を詰め込んだオブジェクトのリスト
  public readonly attributes: PrimitiveAttribute[]

  // インデックスの数
  public readonly elementCount: number
  // レンダリングするプリミティブのタイプ
  // デフォルトはTRIANGLES(三角形)
  public readonly mode: GLenum = GL.TRIANGLES

  // インデックスバッファ(WebGLBuffer)をキャッシュするオブジェクトへの参照
  public readonly indexBuffer: RenderBuffer
  // インデックス配列のどこからがレンダリング位置かをあらわすオフセット
  public readonly indexByteOffset: number = 0
  // インデックスの要素のデータ型 UNSIGNED_BYTEかUNSIGNED_SHORT
  public readonly indexType: GLenum = GL.UNSIGNED_BYTE

  private _min: vec3 | null = null
  private _max: vec3 | null = null


  public get min() {
    return this._min
  }

  public get max() {
    return this._max
  }

  public constructor(attributes: PrimitiveAttribute[], index: { count: number, buffer: RenderBuffer, offset: number, type: GLenum, mode: GLenum }) {
    this.attributes = attributes
    this.elementCount = index.count
    this.mode = index.mode
    this.indexBuffer = index.buffer
    this.indexByteOffset = index.offset
    this.indexType = index.type
  }

  public setBounds(min: vec3, max: vec3) {
    this._min = vec3.clone(min)
    this._max = vec3.clone(max)
  }
}
