import { Renderer } from './Renderer'
import { MaterialSampler } from './Material'
import { RenderTexture } from './RenderTexture'

/**
 * RenderTexture(WebGLTexture)とそれをシェーダと紐づけるUniform名をもつオブジェクト
 */
export class RenderMaterialSampler {
  private _renderer: Renderer
  public readonly uniformName: string                  // uniform名
  public readonly renderTexture: RenderTexture | null  // テクスチャデータ
  public readonly index: number                        // テクスチャのインデックス

  public constructor(renderer: Renderer, materialSampler: MaterialSampler, index: number) {
    this._renderer = renderer
    this.uniformName = materialSampler.uniformName
    this.renderTexture = renderer.getRenderTexture(materialSampler.texture)
    this.index = index
  }
}
