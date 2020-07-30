import vertex from './shader/vertex2.vert'
import fragment from './shader/fragment2.frag'
import { mat4 } from 'gl-matrix'

export class StateMachine {
  private indices: number[] = []
  private gl: WebGL2RenderingContext
  private program!: WebGLProgram

  private coneVAO!: WebGLVertexArrayObject

  private coneIndexBuffer!: WebGLBuffer

  private vboName!: string
  private vboSize: number = 0
  private vboUsage: number = 0

  private iboName!: string
  private iboSize: number = 0
  private iboUsage: number = 0

  private isVerticesVbo = false
  private isConeVertexBufferVbo = false

  private aVertexPosition!: number
  private uProjectionMatrix!: WebGLUniformLocation
  private uModelViewMatrix!: WebGLUniformLocation

  private projectionMatrix = mat4.create()
  private modelViewMatrix = mat4.create()

  public constructor(canvas: HTMLCanvasElement) {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const getContextResult = canvas.getContext('webgl2')
    if (getContextResult === null) {
      console.error('WebGL2 is not available in your browser')
      throw new Error('WebGL2 is not available in your browser')
    }

    this.gl = getContextResult
    this.gl.clearColor(0, 0, 0, 1)

    this.initProgram()
    this.initBuffers()
    this.render()
    // this.updateInfo()
  }

  private render = () => {
    requestAnimationFrame(this.render)
    this.draw()
  }

  private initProgram() {
    const vertexShader = this.compileShader(vertex, 'VERTEX')
    const fragmentShader = this.compileShader(fragment, 'FRAGMENT')

    this.program = this.gl.createProgram()!
    this.gl.attachShader(this.program, vertexShader)
    this.gl.attachShader(this.program, fragmentShader)
    this.gl.linkProgram(this.program)

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      throw new Error('Could not initialize shaders')
    }

    this.gl.useProgram(this.program)

    this.aVertexPosition = this.gl.getAttribLocation(this.program, 'aVertexPosition')
    this.uModelViewMatrix = this.gl.getUniformLocation(this.program, 'uModelViewMatrix')!
    this.uProjectionMatrix = this.gl.getUniformLocation(this.program, 'uProjectionMatrix')!
  }

  private initBuffers() {
    const vertices = [
      1.5, 0, 0,
      -1.5, 1, 0,
      -1.5, 0.809017, 0.587785,
      -1.5, 0.309017, 0.951057,
      -1.5, -0.309017, 0.951057,
      -1.5, -0.809017, 0.587785,
      -1.5, -1, 0,
      -1.5, -0.809017, -0.587785,
      -1.5, -0.309017, -0.951057,
      -1.5, 0.309017, -0.951057,
      -1.5, 0.809017, -0.587785
    ]// 3*11 = 33 * 4byte = 132 byte

    this.indices = [
      0, 1, 2,
      0, 2, 3,
      0, 3, 4,
      0, 4, 5,
      0, 5, 6,
      0, 6, 7,
      0, 7, 8,
      0, 8, 9,
      0, 9, 10,
      0, 10, 1
    ]//3*10 = 30 * 2byte = 60 byte

    this.coneVAO = this.gl.createVertexArray()!
    this.gl.bindVertexArray(this.coneVAO)

    const coneVertexBuffer = this.gl.createBuffer()!
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, coneVertexBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW)

    this.gl.vertexAttribPointer(this.aVertexPosition, 3, this.gl.FLOAT, false, 0, 0)
    this.gl.enableVertexAttribArray(this.aVertexPosition)

    this.coneIndexBuffer = this.gl.createBuffer()!
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.coneIndexBuffer)
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW)

    if (coneVertexBuffer === this.gl.getParameter(this.gl.ARRAY_BUFFER_BINDING)) {
      this.vboName = 'coneVertexBuffer'
    }

    if (this.coneIndexBuffer === this.gl.getParameter(this.gl.ELEMENT_ARRAY_BUFFER_BINDING)) {
      this.iboName = 'coneIndexBuffer'
    }

    this.vboSize = this.gl.getBufferParameter(this.gl.ARRAY_BUFFER, this.gl.BUFFER_SIZE)
    this.vboUsage = this.gl.getBufferParameter(this.gl.ARRAY_BUFFER, this.gl.BUFFER_USAGE)

    this.iboSize = this.gl.getBufferParameter(this.gl.ELEMENT_ARRAY_BUFFER, this.gl.BUFFER_SIZE)
    this.iboUsage = this.gl.getBufferParameter(this.gl.ELEMENT_ARRAY_BUFFER, this.gl.BUFFER_USAGE)

    try {
      this.isVerticesVbo = this.gl.isBuffer(vertices)
    } catch (e) {
      this.isVerticesVbo = false
    }

    this.isConeVertexBufferVbo = this.gl.isBuffer(coneVertexBuffer)

    this.gl.bindVertexArray(null)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null)
  }

  private draw() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)

    mat4.perspective(this.projectionMatrix, 45, this.gl.canvas.width / this.gl.canvas.height, 0.1, 10000)
    mat4.identity(this.modelViewMatrix)
    mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [0, 0, -5])

    this.gl.uniformMatrix4fv(this.uProjectionMatrix, false, this.projectionMatrix)
    this.gl.uniformMatrix4fv(this.uModelViewMatrix, false, this.modelViewMatrix)

    this.gl.bindVertexArray(this.coneVAO)

    this.gl.drawElements(this.gl.LINE_LOOP, this.indices.length, this.gl.UNSIGNED_SHORT, 0)

    this.gl.bindVertexArray(null)
  }

  /**
   * シェーダーをコンパイルする
   * @param shaderString
   * @param type
   */
  private compileShader(shaderString: string, type: 'VERTEX' | 'FRAGMENT') {
    let shader: WebGLShader
    switch (type) {
      case 'VERTEX':
        // Shaderオブジェクトの作成
        shader = this.gl.createShader(this.gl.VERTEX_SHADER)!
        break
      case 'FRAGMENT':
        shader = this.gl.createShader(this.gl.FRAGMENT_SHADER)!
        break
    }

    // shaderオブジェクトにシェーダコードをセットする
    this.gl.shaderSource(shader, shaderString.trim())
    // コンパイル
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error('Failed Shader Compile')
    }

    return shader
  }

}
