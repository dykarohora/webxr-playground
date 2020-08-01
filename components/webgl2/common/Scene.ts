import { Program } from './Program'
import { IObject } from './IObject'
import { calculateNormals } from './Utils'
import { vec3 } from 'gl-matrix'

export class Scene {
  private objects: IObject[] = []

  public constructor(private gl: WebGL2RenderingContext, private program: Program) {
  }

  public get(alias: string) {
    return this.objects.find(object => object.alias === alias)
  }

  public load(filename: string, alias?: string) {
    return fetch(filename)
      .then(res => res.json())
      .then((object:IObject) => {
        object.visible = true
        object.alias = alias || object.alias
        this.add(object)
      })
      .catch((err) => console.error(err, ...arguments))
  }

  public async loadByParts(path: string, count: number, alias?: string) {
    const tasks: Promise<void>[] = []
    for(let i=1; i<=count; i++) {
      const part = `${path}${i}.json`
      const task = this.load(part, alias)
      tasks.push(task)
    }
    await Promise.all(tasks)
  }

  public add(object: IObject) {
    object.diffuse = object.diffuse || [1, 1, 1, 1]
    object.Kd = object.Kd || object.diffuse.slice(0, 3) as vec3

    object.ambient = object.ambient || [0.2, 0.2, 0.2, 1.0]
    object.Ka = object.Ka || object.ambient.slice(0, 3) as vec3

    object.specular = object.specular || [1, 1, 1, 1]
    object.Ks = object.Ks || object.specular.slice(0, 3) as vec3

    object.specularExponent = object.specularExponent || 0
    object.Ns = object.Ns || object.specularExponent

    object.d = object.d || 1
    object.transparency = object.transparency || object.d

    object.illum = object.illum || 1

    object.ibo = this.gl.createBuffer()!
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, object.ibo)
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(object.indices), this.gl.STATIC_DRAW)

    object.vao = this.gl.createVertexArray()!

    this.gl.bindVertexArray(object.vao)

    // positions
    if(this.program.getAttributeLocation('aVertexPosition') >= 0) {
      const vertexBufferObject = this.gl.createBuffer()
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBufferObject)
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.vertices), this.gl.STATIC_DRAW)
      this.gl.enableVertexAttribArray(this.program.getAttributeLocation('aVertexPosition'))
      this.gl.vertexAttribPointer(this.program.getAttributeLocation('aVertexPosition'), 3, this.gl.FLOAT, false, 0, 0)
    }

    // Normals
    if(this.program.getAttributeLocation('aVertexNormal') >= 0) {
      const normalBufferObject = this.gl.createBuffer()
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBufferObject)
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(calculateNormals(object.vertices, object.indices)), this.gl.STATIC_DRAW)
      this.gl.enableVertexAttribArray(this.program.getAttributeLocation('aVertexNormal'))
      this.gl.vertexAttribPointer(this.program.getAttributeLocation('aVertexNormal'), 3, this.gl.FLOAT, false, 0, 0)
    }

    // TODO Color

    // TODO Texture

    // TODO Tangents

    // TODO image

    this.objects.push(object)

    this.gl.bindVertexArray(null)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null)
  }

  public traverse(func: Function) {
    for(let i=0; i<this.objects.length; i++) {
      if(func(this.objects[i], i) !== undefined) break
    }
  }
}
