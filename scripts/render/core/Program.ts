import { ATTRIB, ATTRIB_KEYS } from './RenderPrimitiveAttribute'

export class Program {
  private readonly _program: WebGLProgram
  private readonly _gl: WebGLRenderingContext | WebGL2RenderingContext
  private _uniform: Map<string, WebGLUniformLocation> = new Map<string, WebGLUniformLocation>()

  private _firstUse = true
  private _nextUseCallbacks: ((program: Program) => any)[] = []

  private readonly _vertexShader: WebGLShader
  private readonly _fragmentShader: WebGLShader

  public get uniform() {
    return this._uniform
  }

  // WebGLProgramを生成し、シェーダをコンパイルする
  public constructor(gl: WebGLRenderingContext | WebGL2RenderingContext, vertSrc: string, fragSrc: string, defines: any) {
    this._gl = gl
    this._program = gl.createProgram()!

    let definesString = ''
    if (defines) {
      // TODO define string やらなくて大丈夫
    }

    // 頂点シェーダとフラグメントシェーダのコンパイル
    this._vertexShader = gl.createShader(gl.VERTEX_SHADER)!
    gl.attachShader(this._program, this._vertexShader)
    gl.shaderSource(this._vertexShader, definesString + vertSrc)
    gl.compileShader(this._vertexShader)

    this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.attachShader(this._program, this._fragmentShader)
    gl.shaderSource(this._fragmentShader, definesString + fragSrc)
    gl.compileShader(this._fragmentShader)

    // Attribute Locationの設定
    for (const key of ATTRIB_KEYS) {
      gl.bindAttribLocation(this._program, ATTRIB[key], key)
      // TODO Attributeのキャッシュ やらなくて大丈夫
    }

    gl.linkProgram(this._program)
  }

  public onNextUse(callback: (program: Program) => any) {
    this._nextUseCallbacks.push(callback)
  }

  public use() {
    let gl = this._gl

    if (this._firstUse) {
      this._firstUse = false
      // はじめてこのProgramオブジェクトを使用するときはシェーダのコンパイル にエラーがないか確認する

      if (!gl.getProgramParameter(this._program!, gl.LINK_STATUS)) {
        if (!gl.getShaderParameter(this._vertexShader, gl.COMPILE_STATUS)) {
          console.error('Vertex shader compile error: ' + gl.getShaderInfoLog(this._vertexShader))
        } else if (!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS)) {
          console.error('Fragment shader compile error: ' + gl.getShaderInfoLog(this._fragmentShader))
        } else {
          console.error('Program link error: ' + gl.getProgramInfoLog(this._program!))
        }
        gl.deleteProgram(this._program)
      } else {
        // TODO Attributeの設定を取得 やらなくて大丈夫
        // シェーダ内のuniformの数を取得する
        const uniformCount = gl.getProgramParameter(this._program, gl.ACTIVE_UNIFORMS)

        for (let i = 0; i < uniformCount; i++) {
          const uniformInfo = gl.getActiveUniform(this._program, i)!
          const uniformName = uniformInfo.name.replace('[0]', '')
          this._uniform.set(uniformName, gl.getUniformLocation(this._program, uniformName)!)
        }
      }
      gl.deleteShader(this._vertexShader)
      gl.deleteShader(this._fragmentShader)
    }

    gl.useProgram(this._program)

    if (this._nextUseCallbacks.length > 0) {
      for (const callback of this._nextUseCallbacks) {
        callback(this)
      }
      this._nextUseCallbacks = []
    }
  }
}
