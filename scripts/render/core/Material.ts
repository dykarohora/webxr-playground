import { Texture } from './Texture'
import { RenderPrimitive } from './RenderPrimitive'

const GL = WebGLRenderingContext // For enums

/**
 * WebGLRenderingContext.enableで有効化するもの
 */
export const CAP = {
  // Enable caps
  CULL_FACE: 0x001,
  BLEND: 0x002,
  DEPTH_TEST: 0x004,
  STENCIL_TEST: 0x008,
  COLOR_MASK: 0x010,
  DEPTH_MASK: 0x020,
  STENCIL_MASK: 0x040
}

/**
 * アルファブレンディングとデプステスト
 */
export const MAT_STATE = {
  CAPS_RANGE: 0x000000FF,
  BLEND_SRC_SHIFT: 8,
  BLEND_SRC_RANGE: 0x00000F00,
  BLEND_DST_SHIFT: 12,
  BLEND_DST_RANGE: 0x0000F000,
  BLEND_FUNC_RANGE: 0x0000FF00,
  DEPTH_FUNC_SHIFT: 16,
  DEPTH_FUNC_RANGE: 0x000F0000
}

/**
 * レンダリングオーダー
 */
export const RENDER_ORDER = {
  // Render opaque objects first.
  OPAQUE: 0,

  // Render the sky after all opaque object to save fill rate.
  SKY: 1,

  // Render transparent objects next so that the opaqe objects show through.
  TRANSPARENT: 2,

  // Finally render purely additive effects like pointer rays so that they
  // can render without depth mask.
  ADDITIVE: 3,

  // Render order will be picked based on the material properties.
  DEFAULT: 4
} as const

export type RenderOrderKeys = keyof typeof RENDER_ORDER
export type RenderOrderValues = typeof RENDER_ORDER[keyof typeof RENDER_ORDER]

export abstract class Material {
  protected _renderOrder: RenderOrderValues     // レンダリングの順序ラベル
  protected _state: MaterialState               // アルファブレンド、デプステストの設定
  protected _samplers: MaterialSampler[] = []   // テクスチャ
  protected _uniforms: MaterialUniform[] = []   // パラメータ

  protected constructor() {
    this._state = new MaterialState()
    this._renderOrder = RENDER_ORDER.DEFAULT
  }

  public defineSampler(uniformName: string, texture: Texture) {
    let sampler = new MaterialSampler(uniformName, texture)
    this._samplers.push(sampler)
    return sampler
  }

  public defineUniform(uniformName: string, defaultValue: number[], length: number) {
    let uniform = new MaterialUniform(uniformName, defaultValue, length)
    this._uniforms.push(uniform)
    return uniform
  }

  public get stateFlags() {
    return this._state.stateFlags
  }

  public get renderOrder() {
    return this._renderOrder
  }

  public get samplers() {
    return this._samplers
  }

  public get uniforms() {
    return this._uniforms
  }

  /**
   * マテリアル名
   */
  public abstract get materialName(): string

  /**
   * 頂点シェーダ
   */
  public abstract get vertexSource(): string

  /**
   * フラグメントシェーダ
   */
  public abstract get fragmentSource(): string

  public getProgramDefines(renderPrimitive: RenderPrimitive): any {
    return {}
  }
}

/**
 * マテリアルのアルファブレンド、デプステストの設定を記述するオブジェクト
 */
export class MaterialState {
  // このマテリアルで有効化する機能
  // ビットフラグで表現されており、詳細はCAPをみること
  public stateFlags: number
  public blendFuncSrc: GLenum
  public blendFuncDst: GLenum
  public depthFunc: GLenum

  public constructor() {
    // デフォルトは
    // カリングの有効化
    // デプステストあり
    // カラーマスクあり
    // デプスマスクあり
    this.stateFlags = CAP.CULL_FACE | CAP.DEPTH_TEST | CAP.COLOR_MASK | CAP.DEPTH_MASK

    // アルファブレンディングの計算式は以下の通り
    // Sc * Sa + Dc * (1 - Sa)
    this.blendFuncSrc = GL.SRC_ALPHA
    this.blendFuncDst = GL.ONE_MINUS_SRC_ALPHA

    // デプステストは深度値が小さいもの、手前のものを成功とする
    this.depthFunc = GL.LESS
  }

  public enableDepthMask() {
    this.stateFlags |= CAP.DEPTH_MASK
  }

  public disableDepthMask() {
    this.stateFlags &= ~CAP.DEPTH_MASK
  }
}

/**
 * シェーダとJSコードを結びつけるUniformを表すオブジェクト
 * マテリアルのパラメータに相当する
 */
export class MaterialUniform {
  public constructor(
    public readonly uniformName: string,  // uniform名
    private _value: number[],             // uniformを経由してシェーダに渡すデータセット
    public readonly length: number        // uniformデータ1つあたりの要素の数
  ) {}

  public get value() {
    return this._value
  }

  public setValue(value: number[]) {
    if(value.length % this.length !== 0) {
      throw new Error(`セットされたデータとlengthプロパティに不整合があります length property:${this.length} method argument:${value.length}`)
    }
    this._value = value
  }
}

/**
 * テクスチャとそれを紐づけるUniform名を保持するオブジェクト
 */
export class MaterialSampler {

  public constructor(
    private _uniformName: string, // uniform名
    private _texture: Texture     // テクスチャのデータを保持するオブジェクト
  ) {
  }

  public get texture() {
    return this._texture
  }

  public get uniformName() {
    return this._uniformName
  }

}
