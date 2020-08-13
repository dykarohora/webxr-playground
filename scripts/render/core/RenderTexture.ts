/**
 * WebGLTextureを保持するオブジェクト
 * イメージデータそのものはもたず、バインドしてデータ流し込み済みのWebGLTextureを持つ
 */
export class RenderTexture {
  private readonly _textureHandle: WebGLTexture         //テクスチャハンドル
  private _complete: boolean = false
  private _activeFrameId: number = 0
  private _activeCallback: Function | null = null

  public constructor(texture: WebGLTexture) {
    this._textureHandle = texture
  }

  public get textureHandle() {
    return this._textureHandle
  }

  public get complete() {
    return this._complete
  }

  public setComplete() {
    this._complete = true
  }

  public markActive(frameId:number) {
    // TODO なにやっているかよくわからない
    if(this._activeCallback !== null && this._activeFrameId !== frameId) {
      this._activeFrameId = frameId
      this._activeCallback(this)
    }
  }
}
