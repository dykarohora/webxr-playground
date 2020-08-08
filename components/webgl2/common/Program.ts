export class Program {
  private readonly program: WebGLProgram
  private attributes: { [key: string]: number } = {}
  private uniforms: { [key: string]: WebGLUniformLocation } = {}

  public constructor(private readonly gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    this.program = this.gl.createProgram()!

    this.gl.attachShader(this.program, vertexShader)
    this.gl.attachShader(this.program, fragmentShader)
    this.gl.linkProgram(this.program)

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      throw new Error('Could not initialize shaders.')
    }

    this.useProgram()
  }

  private useProgram() {
    this.gl.useProgram(this.program)
  }

  public load(attributes: string[], uniforms: string[]) {
    this.useProgram()
    this.setAttributeLocations(attributes)
    this.setUniformLocations(uniforms)
  }

  /**
   * WebGLProgramから引数で指定したattributeのそれぞれの位置を取得し、このオブジェクトにキャッシュする
   * @param attributes
   */
  private setAttributeLocations(attributes: string[]) {
    attributes.forEach(attribute => {
      this.attributes[attribute] = this.gl.getAttribLocation(this.program, attribute)
    })
  }

  /**
   * WebGLProgramから引数で指定したuniformのそれぞれの位置を取得し、このオブジェクトにキャッシュする
   * @param uniforms
   */
  private setUniformLocations(uniforms: string[]) {
    uniforms.forEach(uniform => {
      this.uniforms[uniform] = this.gl.getUniformLocation(this.program, uniform)!
    })
  }

  /**
   * 位置を指定してProgramオブジェクトに設定されている現在のUniformの値を取り出す
   * @param uniformLocation
   */
  public getUniform(uniformLocation: WebGLUniformLocation) {
    return this.gl.getUniform(this.program, uniformLocation)
  }

  /**
   * キャッシュしているattributeの位置を取り出す
   * @param key
   */
  public getAttributeLocation(key: string) {
    const attributeLocation = this.attributes[key]

    if(attributeLocation === undefined || attributeLocation === null ||attributeLocation < 0) {
      throw new Error('getAttributeLocation failed')
    }

    return attributeLocation
  }

  /**
   * キャッシュしているuniformの位置を取り出す
   * @param key
   */
  public getUniformLocation(key: string) {
    const uniformLocation = this.uniforms[key]

    if(uniformLocation === undefined || uniformLocation === null) {
      throw new Error('getUniformLocation failed')
    }

    return uniformLocation
  }
}

