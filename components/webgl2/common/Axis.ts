import { IObject } from './IObject'

export class Axis implements IObject {
  public readonly alias: string
  private _vertices: number[] = []
  private _indices: number[] = [0, 1, 2, 3, 4, 5]

  public readonly wireframe = true
  public readonly visible = true

  public get vertices() {
    return this._vertices
  }

  public get indices() {
    return this._indices
  }

  public constructor(private dimension: number = 10) {
    this.alias = 'axis'
    this.build(this.dimension)
  }

  private build(dimension: number) {
    if (dimension !== undefined) {
      this.dimension = dimension
    }

    this._vertices = [
      -dimension, 0.0, 0.0,
      dimension, 0.0, 0.0,
      0.0, -dimension / 2, 0.0,
      0.0, dimension / 2, 0.0,
      0.0, 0.0, -dimension,
      0.0, 0.0, dimension
    ]
  }
}
