import { Renderer } from '../../scripts/render/core/Renderer'
import { Scene } from '../../scripts/render/scene/Scene'
import { SkyboxNode } from '../../scripts/render/nodes/sky-box/SkyBox'

const GL = WebGLRenderingContext

export class ImmersiveVR {
  private xrSession: XRSession | null = null
  private xrButton: HTMLButtonElement
  private xrRefSpace: XRReferenceSpace | null = null
  private gl: WebGLRenderingContext | null = null
  private renderer: Renderer | null = null
  private scene: Scene

  public constructor(button: HTMLButtonElement) {
    this.xrButton = button
    this.scene = new Scene()
    this.scene.addNode(new SkyboxNode({url: '../media/textures/milky-way-4k.png'}))
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

  private onSessionStarted = async (session: XRSession) => {
    this.xrSession = session
    this.xrButton.textContent = 'Exit VR'

    this.xrSession.addEventListener('end', this.onSessionEnded)

    const canvas = document.createElement('canvas')
    this.gl = canvas.getContext('webgl', {xrCompatible: true}) as WebGLRenderingContext

    this.renderer = new Renderer(this.gl)
    this.scene.setRenderer(this.renderer)

    this.xrSession.updateRenderState({baseLayer: new XRWebGLLayer(session, this.gl)})
    this.xrSession.requestReferenceSpace('local').then((refSpace: XRReferenceSpace) => {
      this.xrRefSpace = refSpace
      session.requestAnimationFrame(this.onXRFrame)
    })
  }

  private onSessionEnded = () => {
    this.xrSession = null
    this.xrButton.textContent = 'Enter VR'
    this.gl = null
  }

  private onXRFrame = (time: DOMHighResTimeStamp, frame: XRFrame) => {
    const session = frame.session

    this.scene.startFrame()

    session.requestAnimationFrame(this.onXRFrame)

    let pose = frame.getViewerPose(this.xrRefSpace!)

    if (pose) {
      let glLayer = session.renderState.baseLayer

      this.gl!.bindFramebuffer(this.gl!.FRAMEBUFFER, glLayer.framebuffer)
      this.gl!.clear(this.gl!.COLOR_BUFFER_BIT | this.gl!.DEPTH_BUFFER_BIT)

      for (let view of pose.views) {
        let viewport = glLayer.getViewport(view)
        this.gl!.viewport(viewport.x, viewport.y, viewport.width, viewport.height)
        this.scene.draw(view.projectionMatrix, view.transform)
      }
    } else {

    }

    this.scene.endFrame()
  }
}

const timer = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
