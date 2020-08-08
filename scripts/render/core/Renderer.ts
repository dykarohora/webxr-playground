import { Result } from 'type-result'
import { mat4, vec3 } from 'gl-matrix'
import { Node } from './Node'
import { render } from 'node-sass'
import { RenderBuffer } from './RenderBuffer'

const GL = WebGLRenderingContext

export function createWebGLContext(glAttribs: WebGLContextAttributes): Result<WebGL2RenderingContext, string> {
  const webglCanvas = document.createElement('canvas')
  const context = webglCanvas.getContext('webgl2', glAttribs)

  if (!context) {
    console.error('This browser does not support webgl2')
    return Result.fail('This browser does not support webgl2')
  }

  return Result.ok(context)
}


export class Renderer {
  private _gl: WebGLRenderingContext | WebGL2RenderingContext
  private _frameId = 0
  private _cameraPositions: vec3[] = []
  private _renderPrimitives: any[] = []

  public constructor(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this._gl = gl
  }

  /**
   * WebGLBufferを作成してバッファにデータをコピーする
   * @param target
   * @param data
   * @param usage
   */
  public createRenderBuffer(target: GLenum, data: Float32Array | Uint16Array | Promise<Float32Array | Uint16Array>, usage: GLenum = GL.STATIC_DRAW) {
    // TODO nullのときエラー吐かせた方がいい？
    let gl = this._gl
    let glBuffer = this._gl.createBuffer()!

    if (data instanceof Promise) {
      let renderBuffer = new RenderBuffer(target, usage, data.then((data: Float32Array | Uint16Array) => {
        gl.bindBuffer(target, glBuffer)
        gl.bufferData(target, data, usage)
        renderBuffer.length = data.byteLength
        return glBuffer
      }))
      return renderBuffer
    } else {
      gl.bindBuffer(target, glBuffer)
      gl.bufferData(target, data, usage)
      return new RenderBuffer(target, usage, glBuffer, data.byteLength)
    }
  }

  public drawViews(views: RenderView[], rootNode: Node) {
    let gl = this._gl
    this._frameId++

    // TODO
    // rootNode.markActive(this._frameId)

    if (views.length === 1 && views[0].viewport) {
      let vp = views[0].viewport
      this._gl.viewport(vp.x, vp.y, vp.width, vp.height)
    }

    for (let i = 0; i < views.length; ++i) {
      if (this._cameraPositions.length <= i) {
        this._cameraPositions.push(vec3.create())
      }

      let p = views[i].viewTransform.position
      this._cameraPositions[i][0] = p.x
      this._cameraPositions[i][1] = p.y
      this._cameraPositions[i][2] = p.z
    }

    for (let renderPrimitives of this._renderPrimitives) {
      if (renderPrimitives && renderPrimitives.length) {
        // TODO
        // this._drawRenderPrimitiveSet(views, renderPrimitives)
      }
    }
  }
}

export class RenderView {
  private _projectionMatrix: mat4
  private _viewMatrix: mat4
  private _viewport: XRViewport
  private _eye: 'left' | 'right'
  private _eyeIndex: 0 | 1
  private _viewTransform: XRRigidTransform

  public constructor(projectionMatrix: mat4, viewTransform: Float32Array | XRRigidTransform, viewport: XRViewport, eye: 'left' | 'right' = 'left') {
    this._projectionMatrix = projectionMatrix
    this._eye = eye
    this._eyeIndex = (eye === 'left' ? 0 : 1)
    this._viewport = viewport

    if (viewTransform instanceof Float32Array) {
      this._viewMatrix = mat4.clone(viewTransform)
      this._viewTransform = new XRRigidTransform()
    } else {
      this._viewTransform = viewTransform
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
