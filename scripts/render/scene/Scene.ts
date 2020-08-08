import { Node } from '../core/Node'
import { Renderer, RenderView } from '../core/Renderer'
import { mat4 } from 'gl-matrix'

export class Scene extends Node {
  public constructor() {
    super()
  }

  public setRenderer(renderer: Renderer) {
    this._setRenderer(renderer)
  }

  public startFrame() {

  }

  /**
   * 描画
   * @param projectionMatrix プロジェクション行列
   * @param viewTransform モデルビュー行列
   * @param eye 右目か左目か
   */
  public draw(projectionMatrix: mat4, viewTransform: Float32Array | XRRigidTransform, eye: 'left' | 'right') {
    const view = new RenderView(projectionMatrix, viewTransform, eye)
    view.eye = eye

    this.drawViewArray([view])
  }

  public drawViewArray(views: RenderView[]) {
    if(this._renderer === null) {
      return
    }

    this._renderer.drawViews(views, this)
  }
}
