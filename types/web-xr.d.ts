interface Navigator {
  xr?: XRSystem
}

interface XRSystem {
  isSessionSupported(xrSessionMode: String): Promise<boolean>

  requestSession(sessionMode: 'immersive-ar' | 'immersive-vr' | 'inline', sessionInit?: any): Promise<XRSession>
}

interface XRSession extends EventTarget {
  readonly renderState: XRRenderState

  end(): Promise<void>

  updateRenderState(newState: XRRendoerStateInit): void

  requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRReferenceSpace>

  requestAnimationFrame(animationFrameCallback: (time: DOMHighResTimeStamp, xrFrame: XRFrame) => any): number
}

type XRReferenceSpaceType =
  | 'bounded-floor'
  | 'local'
  | 'local-floor'
  | 'unbounded'
  | 'viewer'

interface XRRenderStateInit {
  baseLayer?: XRWebGLLayer
  depthFar?: number
  depthNear?: number
  inlineVerticalFieldOfView?: any
}

declare var XRWebGLLayer: {
  prototype: XRWebGLLayer
  new(session: XRSession, context: WebGLRenderingContext | WebGL2RenderingContext, layerInit?: any)
}

interface XRWebGLLayer {
  readonly antialias: boolean
  readonly framebuffer: any
  readonly frameBufferWidth: any
  readonly frameBufferHeight: any
  readonly ignoreDepthValues: any

  getViewport(): XRViewport
}

interface XRReferenceSpace {

}

interface XRFrame {
  readonly session: XRSession

  getPose(space: any, baseSpace: any): any

  getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose
}

interface XRViewerPose {

}

interface XRRenderState {
  readonly baseLayer: XRWebGLLayer
  readonly depthFar: number
  readonly depthNear: number
  readonly inlineVerticalFieldOfView: number | null
}

declare var XRRigidTransform: {
  prototype: XRRigidTransform
  new(position?: any, orientation?: any)
}

/**
 * その名の通りTransformを表現している気がする
 * matrixがローカル→ワールドなのか、その逆なのか気になる
 */
interface XRRigidTransform {
  readonly position: DOMPointReadOnly
  readonly orientation: DOMPointReadOnly
  readonly matrix: Float32Array
  readonly inverse: XRRigidTransform
}

interface XRViewport {
  readonly height: number
  readonly width: number
  readonly x: number
  readonly y: number
}