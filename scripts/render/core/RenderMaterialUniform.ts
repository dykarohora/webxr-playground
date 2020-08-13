import { MaterialUniform } from './Material'

/**
 * unifrom名とそのuniformに渡すデータを保持するオブジェクト
 */
export class RenderMaterialUniform {
  // uniform名
  public readonly uniformName: string
  // シェーダのuniformの位置
  private _uniform: WebGLUniformLocation | null = null
  // uniformに渡す値
  private readonly _value: Float32Array
  // データ1つあたりの要素の数 vec4なら4だしvec3なら3
  private readonly _length: number

  public constructor(materialUniform: MaterialUniform) {
    this.uniformName = materialUniform.uniformName
    this._length = materialUniform.length
    this._value = new Float32Array(materialUniform.value)
  }

  public setUniformLocation(uniformLocation: WebGLUniformLocation) {
    this._uniform = uniformLocation
  }

  public get uniform() {
    return this._uniform
  }

  public get length() {
    return this._length
  }

  public get value() {
    return this._value
  }

  public setValue(value: number | number[]) {
    if (value instanceof Array) {
      for (let i = 0; i < this._value.length; ++i) {
        this._value[i] = value[i]
      }
    } else {
      this._value[0] = value
    }
  }
}
