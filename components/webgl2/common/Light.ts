import { vec3, vec4 } from 'gl-matrix'

export class Light {
  public readonly id: string
  private _position: vec3 = [0, 0, 0]
  private _ambient: vec4 = [0, 0, 0, 0]
  private _diffuse: vec4 = [0, 0, 0, 0]
  private _specular: vec4 = [0, 0, 0, 0]

  private property: { [key: string]: any } = {}

  public constructor(id: string) {
    this.id = id
  }

  public get position() {
    return this._position
  }

  public setPosition(position: vec3) {
    vec3.copy(this._position, position)
  }

  public get diffuse() {
    return this._diffuse
  }

  public setDiffuse(diffuse: vec4) {
    vec4.copy(this._diffuse, diffuse)
  }

  public get ambient() {
    return this._ambient
  }

  public setAmbient(ambient: vec4) {
    vec4.copy(this._ambient, ambient)
  }

  public get specular() {
    return this._specular
  }

  public setSpecular(specular: vec4) {
    vec4.copy(this._specular, specular)
  }

  public setProperty(key: string, value: any) {
    this.property[key] = value
  }

  public getProperty(key: string) {
    return this.property[key]
  }
}

export class LightManager {
  private _list: Light[] = []

  public constructor() {
  }

  public add(light: Light) {
    this._list.push(light)
  }

  public get(index: string | number) {
    if (typeof index === 'string') {
      return this._list.find(light => light.id === index)
    } else {
      return this._list[index]
    }
  }

  public getPositionArray() {
    return this._list.reduce((result: number[], light: Light) => {
      result = result.concat(light.position as [number, number, number])
      return result
    }, [])
  }

  public getDiffuseArray() {
    return this._list.reduce((result: number[], light: Light) => {
      result = result.concat(light.diffuse as [number, number, number, number])
      return result
    }, [])
  }

  public getArray(key: string) {
    return this._list.reduce((result: any[], light: Light) => {
      result = result.concat(light.getProperty(key))
      return result
    }, [])
  }
}
