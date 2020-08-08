export class VrBareBones {
  private xrSession: XRSession | null = null
  private xrButton: HTMLButtonElement
  private xrRefSpace: XRReferenceSpace | null = null
  private gl: WebGLRenderingContext | null = null

  public constructor(button: HTMLButtonElement) {
    this.xrButton = button
  }

  public initXR() {
    if (navigator.xr !== undefined) {
      navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        this.xrButton.disabled = !supported

        if (supported) {
          this.xrButton.addEventListener('click', this.onButtonClicked)
          this.xrButton.textContent = 'Enter VR'
        } else {
          this.xrButton.textContent = 'Not Supported VR'
        }
      })
    }
  }

  private onButtonClicked = () => {
    if (this.xrSession === null) {
      navigator.xr?.requestSession('immersive-vr').then(this.onSessionStarted)
    } else {
      this.xrSession.end()
    }
  }

  private onSessionStarted = (session: XRSession) => {
    this.xrSession = session
    this.xrButton.textContent = 'Exit VR'

    this.xrSession.addEventListener('end', this.onSessionEnded)

    const canvas = document.createElement('canvas')
    this.gl = canvas.getContext('webgl', {xrCompatible: true}) as WebGLRenderingContext

    this.xrSession.updateRenderState({baseLayer: new XRWebGLLayer(this.xrSession, this.gl)})
    this.xrSession.requestReferenceSpace('local').then((refSpace: XRReferenceSpace) => {
      this.xrRefSpace = refSpace
      this.xrSession?.requestAnimationFrame(this.onXRFrame)
    })
  }

  private onSessionEnded = () => {
    this.xrSession = null
    this.xrButton.textContent = 'Enter VR'
    this.gl = null
  }

  private onXRFrame = (time: DOMHighResTimeStamp, frame: XRFrame) => {
    const session = frame.session
    session.requestAnimationFrame(this.onXRFrame)

    let pose = frame.getViewerPose(this.xrRefSpace!)

    if (pose) {
      let glLayer = session.renderState.baseLayer
      this.gl!.bindFramebuffer(this.gl!.FRAMEBUFFER, glLayer.framebuffer)
      this.gl!.clearColor(Math.cos(time / 2000),
        Math.cos(time / 4000),
        Math.cos(time / 6000), 1.0)
      this.gl!.clear(this.gl!.COLOR_BUFFER_BIT | this.gl!.DEPTH_BUFFER_BIT)
    }
  }
}
