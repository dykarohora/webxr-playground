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

import { GeometryBuilderBase } from './GeometryBuilderBase'
import { vec3 } from 'gl-matrix'

export class BoxBuilder extends GeometryBuilderBase {
  public pushBox(min: vec3, max: vec3) {
    const stream = this.primitiveStream

    const w = max[0] - min[0]   // 幅
    const h = max[1] - min[1]   // 高さ
    const d = max[2] - min[2]   // 奥行

    // それぞれを0.5倍
    const wh = w * 0.5
    const hh = h * 0.5
    const dh = d * 0.5

    // Boxの中心座標
    const cx = min[0] + wh
    const cy = min[1] + hh
    const cz = min[2] + dh

    stream.startGeometry()

    // bottom
    let idx = stream.nextVertexIndex
    stream.pushTriangle(idx, idx + 1, idx + 2)
    stream.pushTriangle(idx, idx + 2, idx + 3)

    //                 X       Y       Z      U    V    NX    NY   NZ
    stream.pushVertex(-wh + cx, -hh + cy, -dh + cz, 0.0, 1.0, 0.0, -1.0, 0.0)
    stream.pushVertex(+wh + cx, -hh + cy, -dh + cz, 1.0, 1.0, 0.0, -1.0, 0.0)
    stream.pushVertex(+wh + cx, -hh + cy, +dh + cz, 1.0, 0.0, 0.0, -1.0, 0.0)
    stream.pushVertex(-wh + cx, -hh + cy, +dh + cz, 0.0, 0.0, 0.0, -1.0, 0.0)


    // Top
    idx = stream.nextVertexIndex
    stream.pushTriangle(idx, idx + 2, idx + 1)
    stream.pushTriangle(idx, idx + 3, idx + 2)

    stream.pushVertex(-wh + cx, +hh + cy, -dh + cz, 0.0, 0.0, 0.0, 1.0, 0.0)
    stream.pushVertex(+wh + cx, +hh + cy, -dh + cz, 1.0, 0.0, 0.0, 1.0, 0.0)
    stream.pushVertex(+wh + cx, +hh + cy, +dh + cz, 1.0, 1.0, 0.0, 1.0, 0.0)
    stream.pushVertex(-wh + cx, +hh + cy, +dh + cz, 0.0, 1.0, 0.0, 1.0, 0.0)

    // Left
    idx = stream.nextVertexIndex
    stream.pushTriangle(idx, idx + 2, idx + 1)
    stream.pushTriangle(idx, idx + 3, idx + 2)

    stream.pushVertex(-wh + cx, -hh + cy, -dh + cz, 0.0, 1.0, -1.0, 0.0, 0.0)
    stream.pushVertex(-wh + cx, +hh + cy, -dh + cz, 0.0, 0.0, -1.0, 0.0, 0.0)
    stream.pushVertex(-wh + cx, +hh + cy, +dh + cz, 1.0, 0.0, -1.0, 0.0, 0.0)
    stream.pushVertex(-wh + cx, -hh + cy, +dh + cz, 1.0, 1.0, -1.0, 0.0, 0.0)

    // Right
    idx = stream.nextVertexIndex
    stream.pushTriangle(idx, idx + 1, idx + 2)
    stream.pushTriangle(idx, idx + 2, idx + 3)

    stream.pushVertex(+wh + cx, -hh + cy, -dh + cz, 1.0, 1.0, 1.0, 0.0, 0.0)
    stream.pushVertex(+wh + cx, +hh + cy, -dh + cz, 1.0, 0.0, 1.0, 0.0, 0.0)
    stream.pushVertex(+wh + cx, +hh + cy, +dh + cz, 0.0, 0.0, 1.0, 0.0, 0.0)
    stream.pushVertex(+wh + cx, -hh + cy, +dh + cz, 0.0, 1.0, 1.0, 0.0, 0.0)

    // Back
    idx = stream.nextVertexIndex
    stream.pushTriangle(idx, idx + 2, idx + 1)
    stream.pushTriangle(idx, idx + 3, idx + 2)

    stream.pushVertex(-wh + cx, -hh + cy, -dh + cz, 1.0, 1.0, 0.0, 0.0, -1.0)
    stream.pushVertex(+wh + cx, -hh + cy, -dh + cz, 0.0, 1.0, 0.0, 0.0, -1.0)
    stream.pushVertex(+wh + cx, +hh + cy, -dh + cz, 0.0, 0.0, 0.0, 0.0, -1.0)
    stream.pushVertex(-wh + cx, +hh + cy, -dh + cz, 1.0, 0.0, 0.0, 0.0, -1.0)

    // Front
    idx = stream.nextVertexIndex
    stream.pushTriangle(idx, idx + 1, idx + 2)
    stream.pushTriangle(idx, idx + 2, idx + 3)

    stream.pushVertex(-wh + cx, -hh + cy, +dh + cz, 0.0, 1.0, 0.0, 0.0, 1.0)
    stream.pushVertex(+wh + cx, -hh + cy, +dh + cz, 1.0, 1.0, 0.0, 0.0, 1.0)
    stream.pushVertex(+wh + cx, +hh + cy, +dh + cz, 1.0, 0.0, 0.0, 0.0, 1.0)
    stream.pushVertex(-wh + cx, +hh + cy, +dh + cz, 0.0, 0.0, 0.0, 0.0, 1.0)

    stream.endGeometry()
  }

  public pushCube(center: vec3 = [0, 0, 0], size: number = 1.0) {
    const halfSize = size * 0.5
    this.pushBox([center[0] - halfSize, center[1] - halfSize, center[2] - halfSize], [center[0] + halfSize, center[1] + halfSize, center[2] + halfSize])
  }
}
