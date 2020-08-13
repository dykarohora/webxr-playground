import { ATTRIB, AttributeType } from './RenderPrimitiveAttribute'
import { RenderBuffer } from './RenderBuffer'

const GL = WebGLRenderingContext

/**
 * 頂点バッファへの参照と、その頂点バッファを使うattributeについての情報を保持するオブジェクト
 */
export class PrimitiveAttribute {
  // 正規化されているかどうか
  public normalized = false

  public constructor(
    // attribute名
    public readonly name: AttributeType,
    // 頂点バッファであるWebGLBufferをキャッシュするオブジェクトへの参照
    public readonly buffer: RenderBuffer,
    // 1つのattributeに含まれるデータの数
    // たとえばattributeがvec3なら3になるし、vec4ならば4になる
    public readonly componentCount: number = 3,
    // attributeのデータの型
    public readonly componentType: GLenum = GL.FLOAT, // gl.FLOAT
    // 頂点データ1つあたりのデータサイズ
    public readonly stride: number = 0,
    // このattributeが頂点データのどこにあるかを表す
    public readonly byteOffset: number = 0
  ) {
  }
}
