import { Program } from './Program'
import { Camera } from './Camera'
import { mat4 } from 'gl-matrix'

export class Transforms {
  private _modelViewMatrix = mat4.create()
  private _projectionMatrix = mat4.create()
  private _normalMatrix = mat4.create()

  private stack: mat4[] = []

  public constructor(private gl: WebGL2RenderingContext, private program: Program, private camera: Camera, private canvas: HTMLCanvasElement) {
    this.calculateNormal()
    this.updatePerspective()
    this.calculateNormal()
  }

  /**
   * ワールド空間→カメラ空間の変換行列を取得する
   */
  public get modelViewMatrix() {
    return this._modelViewMatrix
  }

  /**
   *
   */
  public calculateModelView() {
    // Cameraはカメラ空間→ワールド空間への変換行列を持っている
    // getViewTransformはその逆行列を返す
    // すなわちワールド空間→カメラ空間の変換行列を取得してキャッシュする
    this._modelViewMatrix = this.camera.getViewTransform()
  }

  public setMatrixUniforms() {
    this.calculateNormal()
    this.gl.uniformMatrix4fv(this.program.getUniformLocation('uModelViewMatrix'), false, this._modelViewMatrix)
    this.gl.uniformMatrix4fv(this.program.getUniformLocation('uProjectionMatrix'), false, this._projectionMatrix)
    this.gl.uniformMatrix4fv(this.program.getUniformLocation('uNormalMatrix'), false, this._normalMatrix)
  }

  public updatePerspective() {
    mat4.perspective(
      this._projectionMatrix,
      this.camera.fov,
      this.canvas.width / this.canvas.height,
      this.camera.minZ,
      this.camera.maxZ
    )
  }

  private calculateNormal() {
    mat4.copy(this._normalMatrix, this._modelViewMatrix)
    mat4.invert(this._normalMatrix, this._normalMatrix)
    mat4.transpose(this._normalMatrix, this._normalMatrix)
  }

  public push() {
    const matrix = mat4.create()
    mat4.copy(matrix, this._modelViewMatrix)
    this.stack.push(matrix)
  }

  public pop() {
    if(this.stack.length > 0) {
      this._modelViewMatrix = this.stack.pop()!
    }
  }
}
