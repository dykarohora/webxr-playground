import vertexShaderSource from './vertex.vert'
import { compileShader } from '../webgl2/common/CompileShader'

const GL = WebGL2RenderingContext

export class RayMarchingBase {
  private gl: WebGL2RenderingContext
  private readonly program: WebGLProgram
  private readonly vao: WebGLVertexArrayObject
  private uniformLocations: WebGLUniformLocation[] = []
  private readonly aVertexPosition: number

  private isRunning: boolean = false

  private width: number
  private height: number

  private mx: number = 0.5
  private my: number = 0.5

  private startTime!: number

  public constructor(canvas: HTMLCanvasElement, fragmentShaderSource: string) {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    this.width = canvas.width
    this.height = canvas.height

    canvas.addEventListener('mousemove', (e) => {
      this.mx = e.offsetX / this.width
      this.my = e.offsetY / this.height
    }, true)

    const gl = canvas.getContext('webgl2')
    if (gl === null) {
      throw new Error('WebGL2がサポートされていません')
    }

    this.gl = gl

    const vertexShader = compileShader(gl, vertexShaderSource, 'VERTEX')
    const fragmentShader = compileShader(gl, fragmentShaderSource, 'FRAGMENT')

    this.program = gl.createProgram()!
    gl.attachShader(this.program, vertexShader)
    gl.attachShader(this.program, fragmentShader)
    gl.linkProgram(this.program)

    if (!this.gl.getProgramParameter(this.program, GL.LINK_STATUS)) {
      throw new Error('シェーダのコンパイルに失敗しました')
    }

    gl.useProgram(this.program)

    this.aVertexPosition = gl.getAttribLocation(this.program, 'aVertexPosition')

    this.uniformLocations.push(
      gl.getUniformLocation(this.program, 'time')!,
      gl.getUniformLocation(this.program, 'mouse')!,
      gl.getUniformLocation(this.program, 'resolution')!
    )

    const position = [
      -1.0, 1.0, 0.0,
      1.0, 1.0, 0.0,
      -1.0, -1.0, 0.0,
      1.0, -1.0, 0.0
    ]
    const index = [
      0, 2, 1,
      1, 2, 3
    ]

    this.vao = gl.createVertexArray()!
    gl.bindVertexArray(this.vao)

    const vertexBuffer = gl.createBuffer()!
    gl.bindBuffer(GL.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(GL.ARRAY_BUFFER, new Float32Array(position), GL.STATIC_DRAW)
    gl.enableVertexAttribArray(this.aVertexPosition)
    gl.vertexAttribPointer(this.aVertexPosition, 3, GL.FLOAT, false, 0, 0)

    const indexBuffer = gl.createBuffer()!
    gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(index), GL.STATIC_DRAW)

    gl.bindVertexArray(null)
    gl.bindBuffer(GL.ARRAY_BUFFER, null)
    gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null)
  }

  public startRender = () => {
    this.startTime = new Date().getTime()
    this.isRunning = true
    this.render()
  }

  private render = () => {
    requestAnimationFrame(this.render)
    this.draw()
  }

  private draw() {
    if (!this.isRunning) return

    const time = (new Date().getTime() - this.startTime) * 0.001

    this.gl.uniform1f(this.uniformLocations[0], time)
    this.gl.uniform2fv(this.uniformLocations[1], [this.mx, this.my])
    this.gl.uniform2fv(this.uniformLocations[2], [this.width, this.height])

    this.gl.clear(GL.COLOR_BUFFER_BIT)
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)

    this.gl.bindVertexArray(this.vao)
    this.gl.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0)
    this.gl.bindVertexArray(null)
  }
}
