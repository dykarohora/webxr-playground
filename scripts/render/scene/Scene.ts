import { Node } from '../core/Node'
import { Renderer } from '../core/Renderer'
import { RenderView } from '../core/RenderView'
import { mat4 } from 'gl-matrix'

export class Scene extends Node {
  private _timestamp = -1
  private _frameDelta = 0

  public constructor() {
    super()
  }

  public setRenderer(renderer: Renderer) {
    this._setRenderer(renderer)
  }

  public startFrame() {
    let prevTimestamp = this._timestamp
    this._timestamp = performance.now()

    // TODO stats

    if (prevTimestamp >= 0) {
      this._frameDelta = this._timestamp - prevTimestamp
    } else {
      this._frameDelta = 0
    }

    // TODO update

    return this._frameDelta
  }

  public endFrame() {

  }

  /**
   * 描画
   * @param projectionMatrix プロジェクション行列
   * @param viewTransform モデルビュー行列
   * @param eye 右目か左目か
   */
  public draw(projectionMatrix: mat4, viewTransform: Float32Array | XRRigidTransform, eye?: 'left' | 'right') {
    const view = new RenderView(projectionMatrix, viewTransform)
    // 右目か左目かを設定する
    if(eye) {
      view.eye = eye
    }

    this.drawViewArray([view])
  }

  public drawViewArray(views: RenderView[]) {
    if (this._renderer === null) {
      return
    }

    this._renderer.drawViews(views, this)
  }

  protected onRendererChanged(renderer: Renderer): void {
  }
}
