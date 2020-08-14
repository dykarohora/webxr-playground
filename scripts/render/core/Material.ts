import { Texture } from './Texture'
import { RenderPrimitive } from './RenderPrimitive'
import { stateToBlendFunc } from './RenderMaterial'

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

  public defineSampler(uniformName: string, texture: Texture | null = null) {
    let sampler = new MaterialSampler(uniformName, texture)
    this._samplers.push(sampler)
    return sampler
  }

  public defineUniform(uniformName: string, defaultValue: number[], length: number = 0) {
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

  public getProgramDefines(renderPrimitive: RenderPrimitive): { [key: string]: number } {
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

  public constructor() {
    // デフォルトは
    // カリングの有効化
    // デプステストあり
    // カラーマスクあり
    // デプスマスクあり
    this.stateFlags = CAP.CULL_FACE | CAP.DEPTH_TEST | CAP.COLOR_MASK | CAP.DEPTH_MASK

    // アルファブレンディングの計算式は以下の通り
    // Sc * Sa + Dc * (1 - Sa)
    this.setBlendFuncSrc(GL.SRC_ALPHA)
    this.setBlendFuncDst(GL.ONE_MINUS_SRC_ALPHA)

    // デプステストは深度値が小さいもの、手前のものを成功とする
    this.setDepthFunc(GL.LESS)
  }

  public get cullFace() {
    return !!(this.stateFlags & CAP.CULL_FACE)
  }

  public setCullFace(value: GLenum) {
    if (value) {
      this.stateFlags |= CAP.CULL_FACE
    } else {
      this.stateFlags &= ~CAP.CULL_FACE
    }
  }

  public get blend() {
    return !!(this.stateFlags & CAP.BLEND)
  }

  public setBlend(value: GLenum) {
    if (value) {
      this.stateFlags |= CAP.BLEND
    } else {
      this.stateFlags &= ~CAP.BLEND
    }
  }

  public get depthTest() {
    return !!(this.stateFlags & CAP.DEPTH_TEST)
  }

  public setDepthTest(value: GLenum) {
    if (value) {
      this.stateFlags |= CAP.DEPTH_TEST
    } else {
      this.stateFlags &= ~CAP.DEPTH_TEST
    }
  }

  public get stencilTest() {
    return !!(this.stateFlags & CAP.STENCIL_TEST)
  }

  public setStencilTest(value: GLenum) {
    if (value) {
      this.stateFlags |= CAP.STENCIL_TEST
    } else {
      this.stateFlags &= ~CAP.STENCIL_TEST
    }
  }

  public get colorMask() {
    return !!(this.stateFlags & CAP.COLOR_MASK)
  }

  public setColorMask(value: GLenum) {
    if (value) {
      this.stateFlags |= CAP.COLOR_MASK
    } else {
      this.stateFlags &= ~CAP.COLOR_MASK
    }
  }

  public get depthMask() {
    return !!(this.stateFlags & CAP.DEPTH_MASK)
  }

  public setDepthMask(value: boolean) {
    if (value) {
      this.stateFlags |= CAP.DEPTH_MASK
    } else {
      this.stateFlags &= ~CAP.DEPTH_MASK
    }
  }

  public get depthFunc() {
    return ((this.stateFlags & MAT_STATE.DEPTH_FUNC_RANGE) >> MAT_STATE.DEPTH_FUNC_SHIFT) + GL.NEVER
  }

  public setDepthFunc(value: GLenum) {
    value = value - GL.NEVER
    this.stateFlags &= ~MAT_STATE.DEPTH_FUNC_RANGE
    this.stateFlags |= (value << MAT_STATE.DEPTH_FUNC_SHIFT)
  }

  public get stencilMask() {
    return !!(this.stateFlags & CAP.STENCIL_MASK)
  }

  public setStencilMask(value: boolean) {
    if (value) {
      this.stateFlags |= CAP.STENCIL_MASK
    } else {
      this.stateFlags &= ~CAP.STENCIL_MASK
    }
  }

  public get blendFuncSrc() {
    return stateToBlendFunc(this.stateFlags, MAT_STATE.BLEND_SRC_RANGE, MAT_STATE.BLEND_SRC_SHIFT)
  }

  public setBlendFuncSrc(value: GLenum) {
    switch (value) {
      case 0:
      case 1:
        break
      default:
        value = (value - GL.SRC_COLOR) + 2
    }
    this.stateFlags &= ~MAT_STATE.BLEND_SRC_RANGE
    this.stateFlags |= (value << MAT_STATE.BLEND_SRC_SHIFT)
  }

  public get blendFuncDst() {
    return stateToBlendFunc(this.stateFlags, MAT_STATE.BLEND_DST_RANGE, MAT_STATE.BLEND_DST_SHIFT)
  }

  public setBlendFuncDst(value: GLenum) {
    switch (value) {
      case 0:
      case 1:
        break
      default:
        value = (value - GL.SRC_COLOR) + 2
    }
    this.stateFlags &= ~MAT_STATE.BLEND_DST_RANGE
    this.stateFlags |= (value << MAT_STATE.BLEND_DST_SHIFT)
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
  ) {
  }

  public get value() {
    return this._value
  }

  public setValue(value: number[]) {
    if (value.length % this.length !== 0) {
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
    private _texture: Texture | null = null     // テクスチャのデータを保持するオブジェクト
  ) {
  }

  public get texture() {
    return this._texture
  }

  public setTexture(texture: Texture) {
    this._texture = texture
  }

  public get uniformName() {
    return this._uniformName
  }

}
