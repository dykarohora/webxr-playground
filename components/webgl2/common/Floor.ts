import { IObject } from './IObject'

export class Floor implements IObject{
  public readonly alias: string
  private _vertices: number[] = []
  private _indices: number[] = []

  public readonly wireframe = true
  public readonly visible = true

  public get vertices() {
    return this._vertices
  }

  public get indices() {
    return this._indices
  }

  public constructor(private dimension: number = 50, private lines: number = 5) {
    this.alias = 'floor'
    this.build(this.dimension, this.lines)
  }

  private build(dimension: number, lines: number) {
    if (dimension !== undefined) {
      this.dimension = dimension
    }

    if (lines !== undefined) {
      this.lines = 2 * this.dimension / lines
    }

    const inc = 2 * this.dimension / this.lines
    const v: number[] = []
    const i: number[] = []

    for (let l = 0; l <= this.lines; l++) {
      v[6 * l] = -this.dimension
      v[6 * l + 1] = 0
      v[6 * l + 2] = -this.dimension + (l * inc)

      v[6 * l + 3] = this.dimension
      v[6 * l + 4] = 0
      v[6 * l + 5] = -this.dimension + (l * inc)

      v[6 * (this.lines + 1) + 6 * l] = -this.dimension + (l * inc)
      v[6 * (this.lines + 1) + 6 * l + 1] = 0
      v[6 * (this.lines + 1) + 6 * l + 2] = -this.dimension

      v[6 * (this.lines + 1) + 6 * l + 3] = -this.dimension + (l * inc)
      v[6 * (this.lines + 1) + 6 * l + 4] = 0
      v[6 * (this.lines + 1) + 6 * l + 5] = this.dimension

      i[2 * l] = 2 * l
      i[2 * l + 1] = 2 * l + 1
      i[2 * (this.lines + 1) + 2 * l] = 2 * (this.lines + 1) + 2 * l
      i[2 * (this.lines + 1) + 2 * l + 1] = 2 * (this.lines + 1) + 2 * l + 1
    }

    this._vertices = v
    this._indices = i
  }
}
