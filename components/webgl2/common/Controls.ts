import { Camera } from './Camera'

export class Controls {
  private key: string = ''
  private ctrl: boolean = false
  private alt: boolean = false

  private readonly keyIncrement = 5
  private readonly motionFactor = 10

  private dragging = false
  private x = 0
  private y = 0
  private lastX = 0
  private lastY = 0
  private button = 0

  public constructor(private camera: Camera, private canvas: HTMLCanvasElement) {
    this.canvas.onmousedown = event => this.onMouseDown(event)
    this.canvas.onmouseup = event => this.onMouseUp(event)
    this.canvas.onmousemove = event => this.onMouseMove(event)
    window.onkeydown = (event: KeyboardEvent) => this.onKeyDown(event)
    window.onkeyup = (event: KeyboardEvent) => this.onKeyUp(event)
  }

  private onMouseDown = (event: MouseEvent) => {
    this.dragging = true

    this.x = event.clientX
    this.y = event.clientY
    this.button = event.button
  }

  private onMouseUp = (event: MouseEvent) => {
    this.dragging = false
  }

  private onMouseMove = (event: MouseEvent) => {
    this.lastX = this.x
    this.lastY = this.y

    this.x = event.clientX
    this.y = event.clientY

    if (!this.dragging) return

    this.ctrl = event.ctrlKey
    this.alt = event.altKey

    const dx = this.x - this.lastX
    const dy = this.y - this.lastY

    this.rotate(dx, dy)
  }

  private onKeyDown = (event: KeyboardEvent) => {
    this.key = event.key
    this.ctrl = event.ctrlKey

    if (this.ctrl) return

    switch (this.key) {
      case 'ArrowLeft':
        this.camera.changeAzimuth(-this.keyIncrement)
        return
      case 'ArrowRight':
        this.camera.changeAzimuth(this.keyIncrement)
        return
      case 'ArrowDown':
        this.camera.changeElevation(-this.keyIncrement)
        return
      case 'ArrowUp':
        this.camera.changeElevation(this.keyIncrement)
        return
    }
  }

  private onKeyUp = (event: KeyboardEvent) => {
    if (this.ctrl) {
      this.ctrl = false
    }
  }

  private rotate(dx: number, dy: number) {
    const {width, height} = this.canvas

    const deltaAzimuth = -20 / width
    const deltaElevation = -20 / height

    const azimuth = dx * deltaAzimuth * this.motionFactor
    const elevation = dy * deltaElevation * this.motionFactor

    this.camera.changeAzimuth(azimuth)
    this.camera.changeElevation(elevation)
  }
}
