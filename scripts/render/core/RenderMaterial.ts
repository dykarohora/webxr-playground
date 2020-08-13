import { Renderer } from './Renderer'
import { CAP, MAT_STATE, Material, MaterialSampler, RENDER_ORDER, RenderOrderValues } from './Material'
import { Program } from './Program'
import { RenderMaterialSampler } from './RenderMaterialSampler'
import { RenderMaterialUniform } from './RenderMaterialUniform'

const GL = WebGL2RenderingContext

export class RenderMaterial {
  private readonly _program: Program
  private readonly _state: number      // アルファブレンド、デプステストなどの設定値
  private readonly _renderOrder: RenderOrderValues

  private _samplerDictionary: Map<string, RenderMaterialSampler> = new Map<string, RenderMaterialSampler>()
  private _samplers: RenderMaterialSampler[] = []
  private _uniformDictionary: Map<string, RenderMaterialUniform> = new Map<string, RenderMaterialUniform>()
  private _uniforms: RenderMaterialUniform[] = []

  private _firstBind = true
  private _activeFrameId = 0
  private _completeForActiveFrame = false

  public constructor(renderer: Renderer, material: Material, program: Program) {
    this._program = program
    this._state = material.stateFlags

    for (let i = 0; i < material.samplers.length; ++i) {
      const renderMaterialSampler = new RenderMaterialSampler(renderer, material.samplers[i], i)
      this._samplers.push(renderMaterialSampler)
      this._samplerDictionary.set(renderMaterialSampler.uniformName, renderMaterialSampler)
    }

    for (let i = 0; i < material.uniforms.length; ++i) {
      const renderMaterialUniform = new RenderMaterialUniform(material.uniforms[i])
      this._uniforms.push(renderMaterialUniform)
      this._uniformDictionary.set(renderMaterialUniform.uniformName, renderMaterialUniform)
    }

    this._renderOrder = material.renderOrder
    // アルファブレンディングが有効化されているならDEFAULTはTRANSPARENT
    // アルファブレンディングが無効化されているならDEFAULTはOPAQUEとする
    if (this._renderOrder === RENDER_ORDER.DEFAULT) {
      if (this._state & CAP.BLEND) {
        this._renderOrder = RENDER_ORDER.TRANSPARENT
      } else {
        this._renderOrder = RENDER_ORDER.OPAQUE
      }
    }
  }

  public get renderOrder() {
    return this._renderOrder
  }

  public get program() {
    return this._program
  }

  public get state() {
    return this._state
  }

  /**
   * 描画時にコールされる
   * テクスチャの有効化とマテリアル設定値をシェーダに流す
   * @param gl
   */
  public bind(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    if (this._firstBind) {
      // TODO これはなにをやっている？とりあえずは気にしなくてもいい
      for (let i = 0; i < this._samplers.length;) {
        let sampler = this._samplers[i]
        if (!this._program.uniform.get(sampler.uniformName)) {
          this._samplers.splice(i, 1)
          continue
        }
        ++i
      }

      // TODO これはなにをやっている？とりあえずは気にしなくてもいい
      for (let i = 0; i < this._uniforms.length;) {
        let uniform = this._uniforms[i]
        uniform.setUniformLocation(this._program.uniform.get(uniform.uniformName)!)
        if (!uniform.uniform) {
          this._uniforms.splice(i, 1)
          continue
        }
        ++i
      }
      this._firstBind = false
    }

    for (let sampler of this._samplers) {
      // テクスチャの有効化
      gl.activeTexture(gl.TEXTURE0 + sampler.index)
      if (sampler.renderTexture && sampler.renderTexture.complete) {
        gl.bindTexture(gl.TEXTURE_2D, sampler.renderTexture.textureHandle)
      } else {
        gl.bindTexture(gl.TEXTURE_2D, null)
      }
    }

    for (let uniform of this._uniforms) {
      switch (uniform.length) {
        case 1:
          gl.uniform1fv(uniform.uniform!, uniform.value)
          break
        case 2:
          gl.uniform2fv(uniform.uniform!, uniform.value)
          break
        case 3:
          gl.uniform3fv(uniform.uniform!, uniform.value)
          break
        case 4:
          gl.uniform4fv(uniform.uniform!, uniform.value)
          break
      }
    }
  }

  public get depthFunc() {
    return ((this._state & MAT_STATE.DEPTH_FUNC_RANGE) >> MAT_STATE.DEPTH_FUNC_SHIFT) + GL.NEVER
  }

  public get blendFuncSrc() {
    return stateToBlendFunc(this._state, MAT_STATE.BLEND_SRC_RANGE, MAT_STATE.BLEND_SRC_SHIFT)
  }

  public get blendFuncDst() {
    return stateToBlendFunc(this._state, MAT_STATE.BLEND_DST_RANGE, MAT_STATE.BLEND_SRC_SHIFT)
  }

  public capsDiff(otherState: number) {
    // XOR
    return (otherState & MAT_STATE.CAPS_RANGE) ^ (this._state & MAT_STATE.CAPS_RANGE)
  }

  public blendDiff(otherState: number) {
    if (!(this._state & CAP.BLEND)) {
      return 0
    }
    return (otherState & MAT_STATE.DEPTH_FUNC_RANGE) ^ (this._state & MAT_STATE.DEPTH_FUNC_RANGE)
  }

  public depthFuncDiff(otherState: number) {
    if (!(this._state & CAP.DEPTH_TEST)) {
      return 0
    }
    return (otherState & MAT_STATE.DEPTH_FUNC_RANGE) ^ (this._state & MAT_STATE.DEPTH_FUNC_RANGE)
  }

  public markActive(frameId: number) {
    if(this._activeFrameId != frameId) {
      this._activeFrameId = frameId
      this._completeForActiveFrame = true
      for(let i=0 ; i<this._samplers.length; i++) {
        const sampler = this._samplers[i]
        if(sampler.renderTexture) {
          if(!sampler.renderTexture.complete) {
            this._completeForActiveFrame = false
            break
          }
          sampler.renderTexture.markActive(frameId)
        }
      }
    }
    return this._completeForActiveFrame
  }
}

export function stateToBlendFunc(state: number, mask: number, shift: number) {
  let value = (state & mask) >> shift
  switch (value) {
    case 0:
    case 1:
      return value
    default:
      return (value - 2) + GL.SRC_COLOR
  }
}
