import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Matrix4,
  Mesh,
  MeshStandardMaterial, Vector,
  Vector3
} from 'three'

export class TubePainter {
  private readonly BUFFER_SIZE = 1000000 * 3

  private positions: BufferAttribute
  private normals: BufferAttribute
  private colors: BufferAttribute
  private geometry: BufferGeometry
  private _mesh: THREE.Mesh

  public constructor() {
    this.positions = new BufferAttribute(new Float32Array(this.BUFFER_SIZE), 3)
    this.positions.usage = DynamicDrawUsage
    this.normals = new BufferAttribute(new Float32Array(this.BUFFER_SIZE), 3)
    this.normals.usage = DynamicDrawUsage
    this.colors = new BufferAttribute(new Float32Array(this.BUFFER_SIZE), 3)
    this.colors.usage = DynamicDrawUsage

    this.geometry = new BufferGeometry()
    this.geometry.setAttribute('position', this.positions)
    this.geometry.setAttribute('normal', this.normals)
    this.geometry.setAttribute('color', this.colors)
    this.geometry.drawRange.count = 0

    const material = new MeshStandardMaterial({
      vertexColors: true
    })

    this._mesh = new Mesh(this.geometry, material)
    this._mesh.frustumCulled = false
  }

  private getPoints(size: number): Vector3[] {
    const PI2 = Math.PI * 2

    const sides = 10
    const array = []
    const radius = 0.01 * size

    for (let i = 0; i < sides; i++) {

      let angle = (i / sides) * PI2
      array.push(new Vector3(Math.sin(angle) * radius, Math.cos(angle) * radius, 0))
    }

    return array
  }

  public get mesh(): THREE.Mesh {
    return this._mesh
  }

  private vector1 = new Vector3()
  private vector2 = new Vector3()
  private vector3 = new Vector3()
  private vector4 = new Vector3()
  private size = 1
  private color = new Color(0xffffff)

  public stroke(position1: Vector3, position2: Vector3, matrix1: Matrix4, matrix2: Matrix4) {

    if (position1.distanceToSquared(position2) === 0) return

    let count = this.geometry.drawRange.count

    let points = this.getPoints(this.size)

    for (let i = 0, il = points.length; i < il; i++) {

      let vertex1 = points[i]
      let vertex2 = points[(i + 1) % il]

      // positions

      this.vector1.copy(vertex1).applyMatrix4(matrix2).add(position2)
      this.vector2.copy(vertex2).applyMatrix4(matrix2).add(position2)
      this.vector3.copy(vertex2).applyMatrix4(matrix1).add(position1)
      this.vector4.copy(vertex1).applyMatrix4(matrix1).add(position1)

      this.vector1.toArray(this.positions.array, (count + 0) * 3)
      this.vector2.toArray(this.positions.array, (count + 1) * 3)
      this.vector4.toArray(this.positions.array, (count + 2) * 3)

      this.vector2.toArray(this.positions.array, (count + 3) * 3)
      this.vector3.toArray(this.positions.array, (count + 4) * 3)
      this.vector4.toArray(this.positions.array, (count + 5) * 3)

      // normals

      this.vector1.copy(vertex1).applyMatrix4(matrix2).normalize()
      this.vector2.copy(vertex2).applyMatrix4(matrix2).normalize()
      this.vector3.copy(vertex2).applyMatrix4(matrix1).normalize()
      this.vector4.copy(vertex1).applyMatrix4(matrix1).normalize()

      this.vector1.toArray(this.normals.array, (count + 0) * 3)
      this.vector2.toArray(this.normals.array, (count + 1) * 3)
      this.vector4.toArray(this.normals.array, (count + 2) * 3)

      this.vector2.toArray(this.normals.array, (count + 3) * 3)
      this.vector3.toArray(this.normals.array, (count + 4) * 3)
      this.vector4.toArray(this.normals.array, (count + 5) * 3)

      // colors

      this.color.toArray(this.colors.array, (count + 0) * 3)
      this.color.toArray(this.colors.array, (count + 1) * 3)
      this.color.toArray(this.colors.array, (count + 2) * 3)

      this.color.toArray(this.colors.array, (count + 3) * 3)
      this.color.toArray(this.colors.array, (count + 4) * 3)
      this.color.toArray(this.colors.array, (count + 5) * 3)

      count += 6

    }

    this.geometry.drawRange.count = count
  }

  private up = new Vector3(0, 1, 0)

  private point1 = new Vector3()
  private point2 = new Vector3()

  private matrix1 = new Matrix4()
  private matrix2 = new Matrix4()

  public moveTo(position: Vector3) {
    this.point1.copy(position)
    this.matrix1.lookAt(this.point2, this.point1, this.up)

    this.point2.copy(position)
    this.matrix2.copy(this.matrix1)
  }

  public lineTo(position: Vector3) {
    this.point1.copy(position)
    this.matrix1.lookAt(this.point2, this.point1, this.up)

    this.stroke(this.point1, this.point2, this.matrix1, this.matrix2)

    this.point2.copy(this.point1)
    this.matrix2.copy(this.matrix1)
  }

  public setSize(value: number) {
    this.size = value
  }

  private count = 0

  public update() {

    let start = this.count
    let end = this.geometry.drawRange.count

    if (start === end) return

    this.positions.updateRange.offset = start * 3
    this.positions.updateRange.count = (end - start) * 3
    this.positions.needsUpdate = true

    this.normals.updateRange.offset = start * 3
    this.normals.updateRange.count = (end - start) * 3
    this.normals.needsUpdate = true

    this.colors.updateRange.offset = start * 3
    this.colors.updateRange.count = (end - start) * 3
    this.colors.needsUpdate = true

    this.count = this.geometry.drawRange.count
  }
}
