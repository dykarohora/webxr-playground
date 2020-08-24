interface Navigator {
  xr?: XRSystem
}

type SessionMode = 'immersive-ar' | 'immersive-vr' | 'inline'

interface XRSystem extends EventTarget {
  isSessionSupported(xrSessionMode: SessionMode): Promise<boolean>

  requestSession(sessionMode: SessionMode, sessionInit?: { requiredFeatures: string[], optionalFeatures: string[] }): Promise<XRSession>
}

interface XRSession extends EventTarget {
  readonly renderState: XRRenderState

  end(): Promise<void>

  updateRenderState(newState: XRRenderStateInit): void

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

  getViewport(view: XRView): XRViewport
}

interface XRReferenceSpace {

}

interface XRFrame {
  readonly session: XRSession

  getPose(space: any, baseSpace: any): any

  getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose
}

interface XRViewerPose {
  readonly views: XRView[]
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

interface XRView {
  readonly eye: any
  readonly projectionMatrix: any
  readonly transform: XRRigidTransform
}
