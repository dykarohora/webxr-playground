import { mat4, vec3, vec4 } from 'gl-matrix'

export type CameraType = 'ORBITING' | 'TRACKING'

export class Camera {
  private _position: vec3 = vec3.create()
  private focus: vec3 = vec3.create()
  private home: vec3 = vec3.create()

  private up: vec3 = vec3.create()
  private right: vec3 = vec3.create()
  private normal: vec3 = vec3.create()

  private _elevation: number = 0   // X軸周りの回転角度(度数)
  private _azimuth: number = 0     // Y軸周りの回転角度(度数)

  private _matrix: mat4 = mat4.create()

  public constructor(private _cameraType: CameraType = 'ORBITING') {

  }

  public goHome(homePosition: vec3) {
    this.home = homePosition
    this.setPosition(this.home)
    this.setAzimuth(0)
    this.setElevation(0)
  }

  public setPosition(position: vec3) {
    vec3.copy(this._position, position)
    this.update()
  }

  /**
   * 新しい値をセットする
   * @param azimuth
   */
  public setAzimuth(azimuth: number) {
    this.changeAzimuth(azimuth - this._azimuth)
  }

  /**
   * 現在の値に
   * @param azimuth
   */
  public changeAzimuth(azimuth: number) {
    this._azimuth += azimuth

    if (this._azimuth > 360 || this._azimuth < -360) {
      this._azimuth = this._azimuth % 360
    }
    this.update()
  }

  public setElevation(elevation: number) {
    this.changeElevation(elevation - this._elevation)
  }

  public changeElevation(elevation: number) {
    this._elevation += elevation
    if (this._elevation > 360 || this._elevation < -360) {
      this._elevation = this._elevation % 360
    }
    this.update()
  }

  private update() {
    mat4.identity(this._matrix)

    switch (this._cameraType) {
      case 'TRACKING':
        // TRACKINGではカメラを動かしてから回す
        mat4.translate(this._matrix, this._matrix, this._position)
        mat4.rotateY(this._matrix, this._matrix, this._azimuth * Math.PI / 180)
        mat4.rotateX(this._matrix, this._matrix, this._elevation * Math.PI / 180)
        break
      case 'ORBITING':
        // ORBITINGではカメラを回してから動かす
        mat4.rotateY(this._matrix, this._matrix, this._azimuth * Math.PI / 180)
        mat4.rotateX(this._matrix, this._matrix, this._elevation * Math.PI / 180)
        mat4.translate(this._matrix, this._matrix, this._position)
        break
    }

    // Trackingカメラでは、カメラを動かしてから回すため、回転後のpositionを更新する必要がある？
    if (this._cameraType === 'TRACKING') {
      const position = vec4.create()
      vec4.set(position, 0, 0, 0, 1)
      vec4.transformMat4(position, position, this._matrix) // ゼロベクトルを現在の
      vec3.copy(this._position, position.slice(0, 3) as [number, number, number])
    }

    this.calculateOrientation()
  }

  private calculateOrientation() {
    const right = vec4.create()
    vec4.set(right, 1, 0, 0, 0)
    vec4.transformMat4(right, right, this._matrix)
    vec3.copy(this.right, right.slice(0, 3) as [number, number, number])

    const up = vec4.create()
    vec4.set(up, 0, 1, 0, 0)
    vec4.transformMat4(up, up, this._matrix)
    vec3.copy(this.up, up.slice(0, 3) as [number, number, number])

    const normal = vec4.create()
    vec4.set(normal, 0, 0, 1, 0)
    vec4.transformMat4(normal, normal, this._matrix)
    vec3.copy(this.normal, normal.slice(0, 3) as [number, number, number])
  }

  public getViewTransform() {
    // このクラスが持っている行列はカメラ空間→ワールド空間へ変換する行列
    // レンダリングパイプラインでは、ワールド空間→カメラ空間へ変換する行列がほしい
    // ということはこのクラスが持つ行列の逆行列を返せばよい
    const matrix = mat4.create()
    mat4.invert(matrix, this._matrix)
    return matrix
  }

  public get matrix() {
    return this._matrix
  }

  public get type() {
    return this._cameraType
  }

  public setType(type: CameraType) {
    this._cameraType = type
  }

  public get position() {
    return this._position
  }

  public get elevation() {
    return this._elevation
  }

  public get azimuth() {
    return this._azimuth
  }
}
