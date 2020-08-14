import { Result } from 'type-result'
import { vec3 } from 'gl-matrix'
import { Node } from './Node'
import { RenderBuffer } from './RenderBuffer'
import { RenderView } from './RenderView'
import { Primitive } from './Primitive'
import { CAP, Material } from './Material'
import { ATTRIB_MASK, RenderPrimitive } from './RenderPrimitive'
import { ImageTexture, Texture, UrlTexture } from './Texture'
import { RenderTexture } from './RenderTexture'
import { Program } from './Program'
import { RenderMaterial } from './RenderMaterial'
import { ATTRIB, ATTRIB_KEYS, ATTRIB_MAP, AttributeType } from './RenderPrimitiveAttribute'

const GL = WebGLRenderingContext

const PRECISION_REGEX = new RegExp('precision (lowp|mediump|highp) float;')

const VERTEX_SHADER_SINGLE_ENTRY = `
uniform mat4 PROJECTION_MATRIX, VIEW_MATRIX, MODEL_MATRIX;

void main() {
  gl_Position = vertex_main(PROJECTION_MATRIX, VIEW_MATRIX, MODEL_MATRIX);
}
`

const VERTEX_SHADER_MULTI_ENTRY = `
#ERROR Multiview rendering is not implemented
void main() {
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
}
`

const FRAGMENT_SHADER_ENTRY = `
void main() {
  gl_FragColor = fragment_main();
}
`

const DEF_LIGHT_DIR = new Float32Array([-0.1, -1.0, -0.2])
const DEF_LIGHT_COLOR = new Float32Array([3.0, 3.0, 3.0])

function isPowerOfTwo(n: number) {
  return (n & (n - 1)) === 0
}

export function createWebGLContext(glAttribs: WebGLContextAttributes): Result<WebGL2RenderingContext, string> {
  const webglCanvas = document.createElement('canvas')
  const context = webglCanvas.getContext('webgl2', glAttribs)

  if (!context) {
    console.error('This browser does not support webgl2')
    return Result.fail('This browser does not support webgl2')
  }

  return Result.ok(context)
}


export class Renderer {
  private _gl: WebGLRenderingContext | WebGL2RenderingContext
  private _frameId = 0
  private _cameraPositions: vec3[] = []
  private _renderPrimitives: RenderPrimitive[][] = []
  private _textureCache: Map<string, RenderTexture> = new Map<string, RenderTexture>()
  private _programCache: Map<string, any> = new Map<string, any>()

  private _defaultFragPrecision: string
  private _colorMaskNeedsReset: boolean = false
  private _depthMaskNeedsReset: boolean = false

  private _globalLightColor = vec3.clone(DEF_LIGHT_COLOR)
  private _globalLightDir = vec3.clone(DEF_LIGHT_DIR)

  private _vaoExt: OES_vertex_array_object | null

  public constructor(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this._gl = gl

    let fragHighPrecision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)!
    this._defaultFragPrecision = fragHighPrecision.precision > 0 ? 'highp' : 'mediump'

    this._vaoExt = gl.getExtension('OES_vertex_array_object')
  }

  /**
   * WebGLBufferを作成してバッファにデータをコピーする
   * @param target
   * @param data
   * @param usage
   */
  public createRenderBuffer(target: GLenum, data: Float32Array | Uint16Array, usage: GLenum = GL.STATIC_DRAW) {
    let gl = this._gl

    // TODO nullのときエラー吐かせた方がいい？
    let glBuffer = this._gl.createBuffer()!
    gl.bindBuffer(target, glBuffer)
    gl.bufferData(target, data, usage)
    return new RenderBuffer(target, usage, glBuffer, data.byteLength)
  }

  public createRenderPrimitive(primitive: Primitive, material: Material) {
    let renderPrimitive = new RenderPrimitive(primitive)

    let program = this.getMaterialProgram(material, renderPrimitive)
    let renderMaterial = new RenderMaterial(this, material, program)
    renderPrimitive.setRenderMaterial(renderMaterial)

    if (this._renderPrimitives[renderMaterial.renderOrder] === undefined) {
      this._renderPrimitives[renderMaterial.renderOrder] = []
    }
    this._renderPrimitives[renderMaterial.renderOrder].push(renderPrimitive)
    return renderPrimitive
  }

  /**
   * TextureオブジェクトからRenderTextureを生成する
   * RenderTextureはRendererにもハッシュマップでキャッシュしておく
   * @param texture
   */
  public getRenderTexture(texture: Texture | null) {
    if(texture === null) {
      return null
    }

    let key = texture.textureKey

    if (this._textureCache.has(key)) {
      return this._textureCache.get(key)!
    } else {
      let gl = this._gl
      // テクスチャオブジェクトの生成
      let textureHandle = gl.createTexture()!

      let renderTexture = new RenderTexture(textureHandle)
      this._textureCache.set(key, renderTexture)

      // TODO DataTexture やらなくていい
      if (texture instanceof ImageTexture || texture instanceof UrlTexture) {
        // WebGLにバインドする
        gl.bindTexture(gl.TEXTURE_2D, textureHandle)
        // テクスチャオブジェクトに画像データを流し込む
        gl.texImage2D(gl.TEXTURE_2D, 0, texture.format, texture.format, gl.UNSIGNED_BYTE, texture.source)
        this.setSamplerParameters(texture)
        renderTexture.setComplete()

        // texture.waitForComplete().then(() => {
        //   // テクスチャオブジェクトをGPUにバインドしてデータを流す
        //   gl.bindTexture(gl.TEXTURE_2D, textureHandle)
        //   gl.texImage2D(gl.TEXTURE_2D, 0, texture.format, texture.format, gl.UNSIGNED_BYTE, texture.source)
        //   this.setSamplerParameters(texture)
        //   renderTexture.setComplete()
        //   // TODO VideoTexture やらなくていい
        // })
      }
      return renderTexture
    }
  }

  /**
   *
   * @param material
   * @param renderPrimitive
   * @private
   */
  private getMaterialProgram(material: Material, renderPrimitive: RenderPrimitive) {
    const materialName = material.materialName
    const vertexSource = material.vertexSource
    const fragmentSource = material.fragmentSource
    const defines = material.getProgramDefines(renderPrimitive)
    const key = this.getProgramKey(materialName, defines)

    if (this._programCache.has(key)) {
      return this._programCache.get(key)!
    } else {
      const multiview = false // Handle this dynamically later

      let fullVertexSource = vertexSource
      fullVertexSource += multiview ? VERTEX_SHADER_MULTI_ENTRY :
        VERTEX_SHADER_SINGLE_ENTRY

      let precisionMatch = fragmentSource.match(PRECISION_REGEX)
      let fragPrecisionHeader = precisionMatch ? '' : `precision ${this._defaultFragPrecision} float;\n`

      let fullFragmentSource = fragPrecisionHeader + fragmentSource
      fullFragmentSource += FRAGMENT_SHADER_ENTRY

      const program = new Program(this._gl, fullVertexSource, fullFragmentSource, defines)
      this._programCache.set(key, program)

      program.onNextUse((program) => {
        // TODO やらなくていい
      })

      return program
    }
  }

  private getProgramKey(name: string, defines: { [key: string]: number }) {
    let key = `${name}:`

    for (let define in defines) {
      key += `${define}=${defines[define]},`
    }

    return key
  }

  /**
   * テクスチャパラメータをWebGLにセットする
   * @param texture
   * @private
   */
  private setSamplerParameters(texture: Texture) {
    let gl = this._gl

    let sampler = texture.sampler
    // テクスチャの縦幅横幅が2の冪乗かどうか
    let powerOfTow = isPowerOfTwo(texture.width) && isPowerOfTwo(texture.height)

    let mipmap = powerOfTow && texture.mipmap
    if (mipmap) {
      gl.generateMipmap(gl.TEXTURE_2D)
    }

    let minFilter = sampler.minFilter ?? (mipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR)
    let wrapS = sampler.wrapS ?? (powerOfTow ? gl.REPEAT : gl.CLAMP_TO_EDGE)
    let wrapT = sampler.wrapT ?? (powerOfTow ? gl.REPEAT : gl.CLAMP_TO_EDGE)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, sampler.magFilter ?? gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT)
  }

  /**
   *
   * @param views カメラ？
   * @param rootNode シーングラフ
   */
  public drawViews(views: RenderView[], rootNode: Node) {
    let gl = this._gl
    this._frameId++

    rootNode.markActive(this._frameId)

    if (views.length === 1 && views[0].viewport) {
      let vp = views[0].viewport
      gl.viewport(vp.x, vp.y, vp.width, vp.height)
    }

    // RenderView(カメラ？)の数だけループ
    for (let i = 0; i < views.length; ++i) {
      if (this._cameraPositions.length <= i) {
        this._cameraPositions.push(vec3.create())
      }

      // カメラのトランスフォームから、カメラ位置をキャッシュしておく
      let p = views[i].viewTransform.position
      this._cameraPositions[i][0] = p.x
      this._cameraPositions[i][1] = p.y
      this._cameraPositions[i][2] = p.z
    }

    for (let renderPrimitives of this._renderPrimitives) {
      if (renderPrimitives && renderPrimitives.length) {
        this._drawRenderPrimitiveSet(views, renderPrimitives)
      }
    }

    if (this._vaoExt) {
      this._vaoExt.bindVertexArrayOES(null)
    }

    if (this._depthMaskNeedsReset) {
      gl.depthMask(true)
    }
    if (this._colorMaskNeedsReset) {
      gl.colorMask(true, true, true, true)
    }
  }

  private _drawRenderPrimitiveSet(views: RenderView[], renderPrimitives: RenderPrimitive[]) {
    let gl = this._gl
    let program = null
    let material = null
    let attribMask = 0

    for (let primitive of renderPrimitives) {
      // TODO FrameId やらなくてもいい

      if (program !== primitive.material!.program) {
        program = primitive.material!.program
        program.use()

        if (program.uniform.has('LIGHT_DIRECTION')) {
          gl.uniform3fv(program.uniform.get('LIGHT_DIRECTION')!, this._globalLightDir)
        }

        if (program.uniform.has('LIGHT_COLOR')) {
          gl.uniform3fv(program.uniform.get('LIGHT_COLOR')!, this._globalLightColor)
        }

        if (views.length === 1) {
          gl.uniformMatrix4fv(program.uniform.get('PROJECTION_MATRIX')!, false, views[0].projectionMatrix)
          gl.uniformMatrix4fv(program.uniform.get('VIEW_MATRIX')!, false, views[0].viewMatrix)
          gl.uniform3fv(program.uniform.get('CAMERA_POSITION')!, this._cameraPositions[0])
          gl.uniform1i(program.uniform.get('EYE_INDEX')!, views[0].eyeIndex)
        }
      }

      if (material !== primitive.material!) {
        this._bindMaterialState(primitive.material!, material)
        // primitive.material!.bind(gl, program, material)
        primitive.material!.bind(gl)
        material = primitive.material
      }

      if (this._vaoExt !== null) {
        if (primitive.vao !== null) {
          this._vaoExt.bindVertexArrayOES(primitive.vao)
        } else {
          primitive.setVao(this._vaoExt.createVertexArrayOES()!)
          this._vaoExt.bindVertexArrayOES(primitive.vao)
          this.bindPrimitive(primitive)
        }
      } else {
        // TODO VAOが使えない場合 やらなくてもいい
      }

      for (let i = 0; i < views.length; ++i) {
        let view = views[i]

        if (views.length > 1) {
          // TODO viewが複数？ やらなくてもいい
        }

        for (let instance of primitive.instances) {
          // TODO frameId??
          gl.uniformMatrix4fv(program!.uniform.get('MODEL_MATRIX')!, false, instance.worldMatrix)

          if (primitive.indexBuffer !== null) {
            gl.drawElements(primitive.mode, primitive.elementCount, primitive.indexType, primitive.indexByteOffset)
          }
        }
      }
    }
  }

  private _bindMaterialState(material: RenderMaterial, prevMaterial: RenderMaterial | null = null) {
    let gl = this._gl

    let state = material.state
    let prevState = prevMaterial ? prevMaterial.state : ~state

    if (state === prevState) {
      return
    }

    if (material.capsDiff(prevState)) {
      this._setCap(gl.CULL_FACE, CAP.CULL_FACE, prevState, state)
      this._setCap(gl.BLEND, CAP.BLEND, prevState, state)
      this._setCap(gl.DEPTH_TEST, CAP.DEPTH_TEST, prevState, state)
      this._setCap(gl.STENCIL_TEST, CAP.STENCIL_TEST, prevState, state)

      const colorMaskChange = (state & CAP.COLOR_MASK) - (prevState & CAP.COLOR_MASK)
      if (colorMaskChange !== 0) {
        let mask = colorMaskChange > 1
        this._colorMaskNeedsReset = !mask
        gl.colorMask(mask, mask, mask, mask)
      }

      const depthMaskChange = (state & CAP.DEPTH_MASK) - (prevState & CAP.DEPTH_MASK)
      if (depthMaskChange !== 0) {
        this._depthMaskNeedsReset = !(depthMaskChange > 1)
        gl.depthMask(depthMaskChange > 1)
      }

      const stencilMaskChange = (state & CAP.STENCIL_MASK) - (prevState & CAP.STENCIL_MASK)
      if (stencilMaskChange) {
        //@ts-ignore
        gl.stencilMask(stencilMaskChange > 1)
      }
    }

    if (material.blendDiff(prevState)) {
      gl.blendFunc(material.blendFuncSrc, material.blendFuncDst)
    }

    if (material.depthFuncDiff(prevState)) {
      gl.depthFunc(material.depthFunc)
    }
  }

  private _setCap(glEnum: GLenum, cap: number, prevState: number, state: number) {
    const gl = this._gl

    let change = (state & cap) - (prevState & cap)
    if (change === 0) {
      return
    }

    if (change > 0) {
      gl.enable(glEnum)
    } else {
      gl.disable(glEnum)
    }
  }

  /**
   * OK
   * @param primitive
   * @private
   */
  private bindPrimitive(primitive: RenderPrimitive) {
    let gl = this._gl

    // RenderPrimitiveには使用するAttributeを判別するためのattributeMaskプロパティがある
    // これを使って
    for (const attrib of ATTRIB_KEYS) {
      if (primitive.attributeMask & ATTRIB_MASK[attrib]) {
        gl.enableVertexAttribArray(ATTRIB[attrib])
      } else {
        gl.disableVertexAttribArray(ATTRIB[attrib])
      }
    }

    // 頂点バッファのバインド
    for (const attributeBuffer of primitive.attributeBuffers) {
      gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffer.webglBuffer)
      for (const attribute of attributeBuffer.attributes) {
        gl.vertexAttribPointer(
          attribute.attribIndex, attribute.componentCount, attribute.componentType,
          attribute.normalized, attribute.stride, attribute.byteOffset
        )
      }
    }

    // インデックスバッファのバインド
    if (primitive.indexBuffer !== null) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, primitive.indexBuffer)
    } else {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
    }
  }
}

