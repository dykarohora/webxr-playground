import { mat4 } from 'gl-matrix'

/**
 * カメラかな？たぶん
 */
export class RenderView {
  // プロジェクション行列
  private _projectionMatrix: mat4
  // モデルビュー行列
  private _viewMatrix: mat4
  // ビューポート
  private _viewport: XRViewport | null
  // 左眼用のビューか、右眼用のビューか
  private _eye: 'left' | 'right'
  private _eyeIndex: 0 | 1
  // カメラのTransform？
  private _viewTransform: XRRigidTransform

  /**
   * コンストラクタ
   * @param projectionMatrix
   * @param viewTransform
   * @param viewport
   * @param eye
   */
  public constructor(projectionMatrix: mat4, viewTransform: Float32Array | XRRigidTransform, viewport: XRViewport | null = null, eye: 'left' | 'right' = 'left') {
    this._projectionMatrix = projectionMatrix
    this._viewport = viewport
    this._eye = eye
    this._eyeIndex = (eye === 'left' ? 0 : 1)

    if (viewTransform instanceof Float32Array) {
      this._viewMatrix = mat4.clone(viewTransform)
      this._viewTransform = new XRRigidTransform()
    } else {
      this._viewTransform = viewTransform
      // モデルビュー行列はカメラ行列の逆行列
      // モデルビュー行列→ローカル座標をワールド座標に変換する
      // カメラ行列→ワールド座標をカメラ座標に変換する
      // カメラにおいてはローカル座標＝カメラ座標
      // ここでviewTransformに渡されるのはカメラ行列
      // なので逆行列を計算すればカメラオブジェクトにおけるモデルビュー行列を取得できる
      this._viewMatrix = viewTransform.inverse.matrix
    }
  }

  public get viewTransform() {
    return this._viewTransform
  }

  public get viewport() {
    return this._viewport
  }

  public get viewMatrix() {
    return this._viewMatrix
  }

  public get projectionMatrix() {
    return this._projectionMatrix
  }

  public get eye() {
    return this._eye
  }

  public set eye(value: 'left' | 'right') {
    this._eye = value
    this._eyeIndex = (value === 'left' ? 0 : 1)
  }

  public get eyeIndex() {
    return this._eyeIndex
  }
}
