import vert1 from './shader/vertex1.vert'
import fragment1 from './shader/fragment1.frag'

export class RenderingSquareVAO {
  private indices: number[] = []
  private gl: WebGL2RenderingContext
  private program!: WebGLProgram

  private squareVAO!: WebGLVertexArrayObject
  private squareIndexBuffer!: WebGLBuffer

  private aVertexPosition!: number

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
    this.draw()
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

  private initProgram() {
    const vertexShader = this.compileShader(vert1, 'VERTEX')
    const fragmentShader = this.compileShader(fragment1, 'FRAGMENT')

    this.program = this.gl.createProgram()!
    this.gl.attachShader(this.program, vertexShader)
    this.gl.attachShader(this.program, fragmentShader)
    this.gl.linkProgram(this.program)

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      throw new Error('Could not initialize shaders')
    }

    this.gl.useProgram(this.program)

    this.aVertexPosition = this.gl.getAttribLocation(this.program, 'aVertexPosition')
  }

  private initBuffers() {
    const vertices = [
      -0.5, 0.5, 0,
      -0.5, -0.5, 0,
      0.5, -0.5, 0,
      0.5, 0.5, 0
    ]

    this.indices = [0, 1, 2, 0, 2, 3]

    // VAO
    this.squareVAO = this.gl.createVertexArray()!
    this.gl.bindVertexArray(this.squareVAO)

    // 頂点バッファオブジェクト
    const squareVertexBuffer = this.gl.createBuffer()!
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, squareVertexBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW)

    this.gl.enableVertexAttribArray(this.aVertexPosition)
    this.gl.vertexAttribPointer(this.aVertexPosition, 3, this.gl.FLOAT, false, 0, 0)

    // インデックスバッファオブジェクト
    this.squareIndexBuffer = this.gl.createBuffer()!
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.squareIndexBuffer)
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW)

    // clean
    this.gl.bindVertexArray(null)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null)
  }

  private draw() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)

    this.gl.bindVertexArray(this.squareVAO)
    // this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.squareIndexBuffer)

    // ドロー
    this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0)

    // バッファのバインド解除
    this.gl.bindVertexArray(null)
    // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
    // this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null)
  }
}
