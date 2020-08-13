/**
 * 頂点バッファやインデックスバッファをキャッシュするオブジェクト
 */
export class RenderBuffer {
  // 頂点バッファかインデックスバッファか
  // ARRAY_BUFFER | ELEMENT_ARRAY_BUFFER
  private _target: GLenum

  // バッファの用途
  // STATIC_DRAW
  // DYNAMIC_DRAW
  // STREAM_DRAW
  private _usage: GLenum

  // WebGLBufferがもつバッファのバイトサイズ
  private _length: number

  // バッファ本体、WebGLBuffer型
  public readonly buffer: WebGLBuffer

  /**
   *
   * @param target
   * @param usage
   * @param buffer
   * @param length
   */
  public constructor(target: GLenum, usage: GLenum, buffer: WebGLBuffer, length: number = 0) {
    this._target = target
    this._usage = usage
    this._length = length
    this.buffer = buffer
  }
}
