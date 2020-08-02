export class ArBarebones {

  private xrButton: HTMLButtonElement
  private rootElement: HTMLElement
  private gl!: WebGLRenderingContext | WebGL2RenderingContext | null
  private xrSession: any

  public constructor(button: HTMLButtonElement, rootElement: HTMLElement) {
    this.xrButton = button
    this.rootElement = rootElement
  }

  public initXR() {
    // WebXRはlocalhostを除き、HTTPS接続で取得したコンテンツしか動作しない
    if (!window.isSecureContext) {
      const message = 'WebXR unavailable due to insecure context'
      // TODO どうする？
    }


    //@ts-ignore
    if (navigator.xr) {
      this.xrButton.addEventListener('click', this.onButtonClicked)
      //@ts-ignore
      navigator.xr.addEventListener('devicechange', this.checkSupportedState)
      this.checkSupportedState()
    }
  }

  private onButtonClicked = () => {
    if (!this.xrSession) {
      //@ts-ignore
      navigator.xr.requestSession('immersive-ar', {
        optionalFeatures: ['dom-overlay'],
        domOverlay: {root: this.rootElement}
      }).then(this.onSessionStarted, this.onRequestSessionError)
    }else {
      this.xrSession.end()
    }
  }

  private checkSupportedState = () => {
    // ARセッションがデバイスでサポートされているかチェックする（非同期関数）
    //@ts-ignore
    navigator.xr.isSessionSupported('immersive-ar').then((supported: boolean) => {
      if (supported) {
        this.xrButton.innerHTML = 'Enter AR'
      } else {
        this.xrButton.innerHTML = 'AR not found'
      }
      this.xrButton.disabled = !supported
    })
  }

  private onSessionStarted = (session: any) => {
    this.xrSession = session
    this.xrButton.innerHTML = 'Exit AR'

    session.addEventListener('end', this.onSessionEnded)

    const canvas = document.createElement('canvas')
    this.gl = canvas.getContext('webgl', {
      xrCompatible: true
    }) as WebGLRenderingContext

    //@ts-ignore
    session.updateRenderState({ baseLayer: new XRWebGLLayer(session, this.gl)})
    //@ts-ignore
    session.requestReferenceSpace('local').then((resSpace: any) => {
      session.requestAnimationFrame(this.onXRFrame)
    })
  }

  private onRequestSessionError = (error: any) => {

  }

  private onSessionEnded = () => {

  }

  private onEndSession = (session: any) => {

  }

  private onXRFrame = (t: any, frame: any) => {

  }
}
