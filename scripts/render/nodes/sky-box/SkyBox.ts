import { Node } from '../../core/Node'
import { Renderer } from '../../core/Renderer'
import { Primitive, PrimitiveAttribute } from '../../core/Primitive'
import { Material, RENDER_ORDER } from '../../core/Material'

const GL = WebGLRenderingContext

class SkyboxMaterial extends Material {
  public constructor() {
    super();
    this._renderOrder = RENDER_ORDER.SKY
    this._state.depthFunc = GL.LEQUAL
  }
}

export class SkyboxNode extends Node {
  private _url: string = ''
  private _displayMode: string = 'mono'
  private _rotationY: number = 0

  public constructor(options?: SkyboxOption) {
    super()
  }

  protected onRendererChanged(renderer: Renderer) {
    let vertices: number[] = []
    let indices: number[] = []

    let latSegments = 40
    let lonSegments = 40

    // 球の頂点、インデックス、uv座標を生成する
    // 参考 http://fnorio.com/0098spherical_trigonometry1/spherical_trigonometry1.html
    for (let i = 0; i <= latSegments; ++i) {
      // 4.5度ずつ刻む
      let theta = i * Math.PI / latSegments
      let sinTheta = Math.sin(theta)
      let cosTheta = Math.cos(theta)

      // 0  - 41 -  82 - 123
      let idxOffsetA = i * (lonSegments + 1)
      // 41 - 82 - 123 - 164
      let idxOffsetB = (i + 1) * (lonSegments + 1)

      for (let j = 0; j <= lonSegments; ++j) {
        let phi = (j * 2 * Math.PI / lonSegments) + this._rotationY
        let x = Math.sin(phi) * sinTheta
        let y = cosTheta
        let z = -Math.cos(phi) * sinTheta
        let u = (j / lonSegments)
        let v = (i / latSegments)

        vertices.push(x, y, z, u, v)

        if (i < latSegments && i < lonSegments) {
          let idxA = idxOffsetA + j
          let idxB = idxOffsetB + j

          indices.push(idxA, idxB, idxA + 1, idxB, idxB + 1, idxA + 1)
        }
      }
    }

    // 頂点バッファとインデックスバッファの生成
    let vertexBuffer = renderer.createRenderBuffer(GL.ARRAY_BUFFER, new Float32Array(vertices))
    let indexBuffer = renderer.createRenderBuffer(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices))

    // 頂点バッファに入っているデータはFloat(4byte)が5つ = 20byte
    // 最初の12バイトが頂点 残り8バイトがUV座標となる
    let attribs = [
      new PrimitiveAttribute('POSITION', vertexBuffer, 3, GL.FLOAT, 20, 0),
      new PrimitiveAttribute('TEXCOORD_0', vertexBuffer, 2, GL.FLOAT, 20, 12),
    ]

    let primitive = new Primitive(attribs, indices.length)
    primitive.setIndexBuffer(indexBuffer)

    let material = new SkyboxMaterial()
  }
}

export interface SkyboxOption {
  url?: string
  displayMode?: string
  rotationY?: number
}
