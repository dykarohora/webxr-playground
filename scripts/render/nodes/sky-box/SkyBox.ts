import { Node } from '../../core/Node'
import { Renderer } from '../../core/Renderer'
import { Primitive } from '../../core/Primitive'
import { Material, MaterialSampler, MaterialUniform, RENDER_ORDER } from '../../core/Material'

import vertexShaderStr from './skybox.vert'
import fragmentShaderStr from './skybox.frag'
import { Texture, UrlTexture } from '../../core/Texture'
import { PrimitiveAttribute } from '../../core/PrimitiveAttribute'

const GL = WebGLRenderingContext

class SkyboxMaterial extends Material {
  private readonly _image: MaterialSampler
  private _texCoordScaleOffset: MaterialUniform

  public constructor(texture: Texture) {
    super()
    this._renderOrder = RENDER_ORDER.SKY  // スカイボックスなのではやめに描画する
    this._state.setDepthFunc(GL.LEQUAL)
    this._state.setDepthMask(false)

    this._image = this.defineSampler('diffuse', texture)
    this._texCoordScaleOffset = this.defineUniform('texCoordScaleOffset',
      [1.0, 1.0, 0.0, 0.0,
        1.0, 1.0, 0.0, 0.0], 4)
  }

  public get materialName() {
    return 'SKYBOX'
  }

  public get vertexSource() {
    return vertexShaderStr
  }

  public get fragmentSource() {
    return fragmentShaderStr
  }

  public get image() {
    return this._image
  }

  public setTexCoordScaleOffset(value: number[]) {
    this._texCoordScaleOffset.setValue(value)
  }
}

export class SkyboxNode extends Node {
  private _url: string = ''
  private _displayMode: string = 'mono'
  private _rotationY: number = 0

  public constructor(options: SkyboxOption) {
    super()
    this._url = options.url
    this._displayMode = options.displayMode ?? 'mono'
    this._rotationY = options.rotationY ?? 0
  }

  protected async onRendererChanged(renderer: Renderer) {
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

        if (i < latSegments && j < lonSegments) {
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
      new PrimitiveAttribute('TEXCOORD_0', vertexBuffer, 2, GL.FLOAT, 20, 12)
    ]

    let primitive = new Primitive(attribs, {
      count: indices.length,
      buffer: indexBuffer,
      offset: 0,
      type: GL.UNSIGNED_SHORT,
      mode: GL.TRIANGLES
    })

    const texture = new UrlTexture(this._url)
    await texture.waitForComplete()
    let material = new SkyboxMaterial(texture)

    switch (this._displayMode) {
      case 'mono':
        material.setTexCoordScaleOffset([1.0, 1.0, 0.0, 0.0,
          1.0, 1.0, 0.0, 0.0])
        break
      case 'stereoTopBottom':
        material.setTexCoordScaleOffset([1.0, 0.5, 0.0, 0.0,
          1.0, 0.5, 0.0, 0.5])
        break
      case 'stereoLeftRight':
        material.setTexCoordScaleOffset([0.5, 1.0, 0.0, 0.0,
          0.5, 1.0, 0.5, 0.0])
        break
    }

    let renderPrimitive = renderer.createRenderPrimitive(primitive, material)
    this.addRenderPrimitive(renderPrimitive)
  }
}

export interface SkyboxOption {
  url: string
  displayMode?: string
  rotationY?: number
}
