// Copyright 2018 The Immersive Web Community Group
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { Renderer } from '../core/Renderer'
import { mat3, mat4, vec3 } from 'gl-matrix'
import { PrimitiveAttribute } from '../core/PrimitiveAttribute'
import { Primitive } from '../core/Primitive'

const GL = WebGLRenderingContext

const tempVec3 = vec3.create()

export class PrimitiveStream {
  private _vertices: number[] = []
  private _indices: number[] = []

  private _geometryStarted = false

  private _vertexOffset = 0
  private _vertexIndex = 0
  private _highIndex = 0

  private _flipWinding = false
  private _invertNormals = false
  private _transform: mat4 | null = null
  private _normalTransform: mat3 | null = null
  private _min: vec3 | null = null
  private _max: vec3 | null = null


  public get transform() {
    return this._transform
  }

  public setTransform(transform: mat4) {
    if (this._geometryStarted) {
      throw new Error('構築中にTransformを変更することはできません')
    }

    this._transform = transform

    if (this._normalTransform === null) {
      this._normalTransform = mat3.create()
    }

    mat3.fromMat4(this._normalTransform, this._transform)
  }

  /**
   * ジオメトリの構築を開始する
   */
  public startGeometry() {
    if (this._geometryStarted) {
      throw new Error('すでに開始されています')
    }

    this._geometryStarted = true
    this._vertexIndex = 0
    this._highIndex = 0
  }

  /**
   * ジオメトリの構築を終了する
   */
  public endGeometry() {
    if (!this._geometryStarted) {
      throw new Error('開始されていません')
    }

    if (this._highIndex >= this._vertexIndex) {
      throw new Error('設定されているインデックスの数に対して、頂点の数が足りません')
    }

    this._geometryStarted = false
    this._vertexOffset += this._vertexIndex
  }

  /**
   * 頂点情報をセットする
   * @param x  頂点座標
   * @param y
   * @param z
   * @param u  UV座標
   * @param v
   * @param nx 頂点法線
   * @param ny
   * @param nz
   */
  public pushVertex(x: number, y: number, z: number, u: number = 0, v: number = 0, nx: number = 0, ny: number = 0, nz: number = 0) {
    if (!this._geometryStarted) {
      throw new Error('開始されていません')
    }

    if (this._transform !== null && this._normalTransform !== null) {
      tempVec3[0] = x
      tempVec3[1] = y
      tempVec3[2] = z
      vec3.transformMat4(tempVec3, tempVec3, this._transform)
      x = tempVec3[0]
      y = tempVec3[1]
      z = tempVec3[2]

      tempVec3[0] = nx
      tempVec3[1] = ny
      tempVec3[2] = nz
      vec3.transformMat3(tempVec3, tempVec3, this._normalTransform)
      nx = tempVec3[0]
      ny = tempVec3[1]
      nz = tempVec3[2]
    }

    if (this._invertNormals) {
      nx *= -1.0
      ny *= -1.0
      nz *= -1.0
    }

    this._vertices.push(x, y, z, u, v, nx, ny, nz)

    if (this._min !== null && this._max !== null) {
      this._min[0] = Math.min(this._min[0], x)
      this._min[1] = Math.min(this._min[1], y)
      this._min[2] = Math.min(this._min[2], z)
      this._max[0] = Math.min(this._max[0], x)
      this._max[1] = Math.min(this._max[1], y)
      this._max[2] = Math.min(this._max[2], z)
    } else {
      this._min = vec3.fromValues(x, y, z)
      this._max = vec3.fromValues(x, y, z)
    }

    return this._vertexIndex++
  }

  /**
   * 次の頂点のインデックスを取得する
   */
  public get nextVertexIndex() {
    return this._vertexIndex
  }

  /**
   * 使用する頂点のインデックスを指定してポリゴンを設定する
   * @param idxA
   * @param idxB
   * @param idxC
   */
  public pushTriangle(idxA: number, idxB: number, idxC: number) {
    if (!this._geometryStarted) {
      throw new Error('開始されていません')
    }

    this._highIndex = Math.max(this._highIndex, idxA, idxB, idxC)

    idxA += this._vertexOffset
    idxB += this._vertexOffset
    idxC += this._vertexOffset

    if (this._flipWinding) {
      this._indices.push(idxC, idxB, idxA)
    } else {
      this._indices.push(idxA, idxB, idxC)
    }
  }

  /**
   * 頂点情報やインデックス情報をクリアする
   */
  public clear() {
    if (this._geometryStarted) {
      throw new Error('ジオメトリの構築中にクリアはできません')
    }

    this._vertices = []
    this._indices = []
    this._vertexOffset = 0
    this._min = null
    this._max = null
  }

  /**
   * 設定された頂点情報、インデックス情報からPrimitiveオブジェクトを生成する
   * @param renderer
   */
  public finishPrimitive(renderer: Renderer) {
    if (!this._vertexOffset) {
      throw new Error('ジオメトリの構築が完了していません')
    }

    const vertexBuffer = renderer.createRenderBuffer(GL.ARRAY_BUFFER, new Float32Array(this._vertices))
    const indexBuffer = renderer.createRenderBuffer(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._indices))

    const attribs = [
      new PrimitiveAttribute('POSITION', vertexBuffer, 3, GL.FLOAT, 32, 0),
      new PrimitiveAttribute('TEXCOORD_0', vertexBuffer, 2, GL.FLOAT, 32, 12),
      new PrimitiveAttribute('NORMAL', vertexBuffer, 3, GL.FLOAT, 32, 20)
    ]

    const primitive = new Primitive(attribs, {
      count: this._indices.length,
      buffer: indexBuffer,
      offset: 0,
      type: GL.UNSIGNED_SHORT,
      mode: GL.TRIANGLES
    })

    if (this._min !== null && this._max !== null) {
      primitive.setBounds(this._min, this._max)
    }

    return primitive
  }
}
