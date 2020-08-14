import { RenderBuffer } from './RenderBuffer'
import { RenderPrimitiveAttribute } from './RenderPrimitiveAttribute'


/**
 * 頂点バッファとそれに紐づくattributeをシェーダに渡すためのオブジェクト
 */
export class RenderPrimitiveAttributeBuffer {
  public readonly buffer: RenderBuffer
  // TODO できればイテレータにしたい
  public readonly attributes: RenderPrimitiveAttribute[] = []

  public constructor(buffer: RenderBuffer) {
    this.buffer = buffer
  }

  public pushRenderPrimitiveAttribute(renderPrimitiveAttribute: RenderPrimitiveAttribute) {
    this.attributes.push(renderPrimitiveAttribute)
  }

  public get webglBuffer() {
    return this.buffer.buffer
  }
}
