import { compileShader } from '../common/CompileShader'
import vertexShaderStr from './shader/point-light.vert'
import fragmentShaderStr from './shader/point-light.frag'
import { calculateNormals, configureControls, normalizeColor } from '../common/Utils'
import { mat4 } from 'gl-matrix'

export class PositionalLight {
  private gl!: WebGL2RenderingContext
  private program!: WebGLProgram

  private aVertexPosition!: number
  private aVertexNormal!: number

  private uModelViewMatrix!: WebGLUniformLocation
  private uProjectionMatrix!: WebGLUniformLocation
  private uNormalMatrix!: WebGLUniformLocation
// Lights
  private uLightPosition!: WebGLUniformLocation
  private uLightAmbient!: WebGLUniformLocation
  private uLightDiffuse!: WebGLUniformLocation
  private uLightSpecular!: WebGLUniformLocation
// Materials
  private uMaterialAmbient!: WebGLUniformLocation
  private uMaterialDiffuse!: WebGLUniformLocation
  private uMaterialSpecular!: WebGLUniformLocation
  private uShininess!: WebGLUniformLocation

  private lightPosition = [4.5, 3, 15]
  private shininess = 200
  private distance = -100
  private lastTime!: number
  private angle = 0

  private modelViewMatrix = mat4.create()
  private projectionMatrix = mat4.create()
  private normalMatrix = mat4.create()

  private objects: any[] = []

  public constructor(canvas: HTMLCanvasElement) {
    this.initProgram(canvas)
    this.initLights()
    this.initControls()
    this.load().then(() => {
      this.render()
    })
  }

  private initProgram(canvas: HTMLCanvasElement) {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const getContextResult = canvas.getContext('webgl2')
    if (getContextResult === null) {
      console.error('WebGL2 is not available in your browser')
      throw new Error('WebGL2 is not available in your browser')
    }

    this.gl = getContextResult

    this.gl.clearColor(0.9, 0.9, 0.9, 1)
    this.gl.clearDepth(100)
    this.gl.enable(this.gl.DEPTH_TEST)
    this.gl.depthFunc(this.gl.LEQUAL)

    const vertexShader = compileShader(this.gl, vertexShaderStr, 'VERTEX')
    const fragmentShader = compileShader(this.gl, fragmentShaderStr, 'FRAGMENT')

    this.program = this.gl.createProgram()!
    this.gl.attachShader(this.program, vertexShader)
    this.gl.attachShader(this.program, fragmentShader)
    this.gl.linkProgram(this.program)

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      throw new Error('Could not initialize shaders')
    }

    this.gl.useProgram(this.program)

    this.aVertexPosition = this.gl.getAttribLocation(this.program, 'aVertexPosition')
    this.aVertexNormal = this.gl.getAttribLocation(this.program, 'aVertexNormal')

    this.uProjectionMatrix = this.gl.getUniformLocation(this.program, 'uProjectionMatrix')!
    this.uModelViewMatrix = this.gl.getUniformLocation(this.program, 'uModelViewMatrix')!
    this.uNormalMatrix = this.gl.getUniformLocation(this.program, 'uNormalMatrix')!

    this.uMaterialAmbient = this.gl.getUniformLocation(this.program, 'uMaterialAmbient')!
    this.uMaterialDiffuse = this.gl.getUniformLocation(this.program, 'uMaterialDiffuse')!
    this.uMaterialSpecular = this.gl.getUniformLocation(this.program, 'uMaterialSpecular')!
    this.uShininess = this.gl.getUniformLocation(this.program, 'uShininess')!

    this.uLightPosition = this.gl.getUniformLocation(this.program, 'uLightPosition')!
    this.uLightAmbient = this.gl.getUniformLocation(this.program, 'uLightAmbient')!
    this.uLightDiffuse = this.gl.getUniformLocation(this.program, 'uLightDiffuse')!
    this.uLightSpecular = this.gl.getUniformLocation(this.program, 'uLightSpecular')!
  }

  private initLights() {
    this.gl.uniform3fv(this.uLightPosition, this.lightPosition)
    this.gl.uniform4f(this.uLightAmbient, 1, 1, 1, 1)
    this.gl.uniform4f(this.uLightDiffuse, 1, 1, 1, 1)
    this.gl.uniform4f(this.uLightSpecular, 1, 1, 1, 1)
    this.gl.uniform4f(this.uMaterialDiffuse, 0.1, 0.1, 0.1, 1)
    this.gl.uniform4f(this.uMaterialAmbient, 0.5, 0.8, 0.1, 1)
    this.gl.uniform4f(this.uMaterialSpecular, 0.6, 0.6, 0.6, 1)
    this.gl.uniform1f(this.uShininess, this.shininess)
  }

  private async loadObject(filePath: string, alias: string) {
    const response = await fetch(filePath)
    const data = await response.json()
    data.alias = alias

    // Configure VAO
    const vao = this.gl.createVertexArray()
    this.gl.bindVertexArray(vao)

    // Vertices
    const vertexBufferObject = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBufferObject)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data.vertices), this.gl.STATIC_DRAW)
    // Configure instructions for VAO
    this.gl.enableVertexAttribArray(this.aVertexPosition)
    this.gl.vertexAttribPointer(this.aVertexPosition, 3, this.gl.FLOAT, false, 0, 0)

    // Normals
    const normalBufferObject = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBufferObject)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(calculateNormals(data.vertices, data.indices)), this.gl.STATIC_DRAW)
    // Configure instructions for VAO
    this.gl.enableVertexAttribArray(this.aVertexNormal)
    this.gl.vertexAttribPointer(this.aVertexNormal, 3, this.gl.FLOAT, false, 0, 0)

    // Indices
    const indexBufferObject = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBufferObject)
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), this.gl.STATIC_DRAW)

    // Attach values to be able to reference later for drawing
    data.vao = vao
    data.ibo = indexBufferObject

    // Push onto objects for later reference
    this.objects.push(data)

    // Clean
    this.gl.bindVertexArray(vao)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null)
  }

  private getObject(alias: string) {
    return this.objects.find(object => object.alias === alias)
  }

  private async load() {
    await Promise.all([
      this.loadObject('/common/models/geometries/plane.json', 'plane'),
      this.loadObject('/common/models/geometries/cone2.json', 'cone'),
      this.loadObject('/common/models/geometries/sphere1.json', 'sphere'),
      this.loadObject('/common/models/geometries/sphere3.json', 'light')
    ])
  }

  private render = () => {
    requestAnimationFrame(this.render)
    this.draw()
    this.animate()
  }

  private draw = () => {
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

    mat4.perspective(this.projectionMatrix, 45, this.gl.canvas.width / this.gl.canvas.height, 0.1, 10000)

    this.objects.forEach(object => {
      mat4.identity(this.modelViewMatrix)
      mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [0, 0, this.distance])
      mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, 30 * Math.PI / 180, [1, 0, 0])
      mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, this.angle * Math.PI / 180, [0, 1, 0])

      if (object.alias === 'light') {
        const lightPosition = this.gl.getUniform(this.program, this.uLightPosition)
        mat4.translate(this.modelViewMatrix, this.modelViewMatrix, lightPosition)
      }

      mat4.copy(this.normalMatrix, this.modelViewMatrix)
      mat4.invert(this.normalMatrix, this.normalMatrix)
      mat4.transpose(this.normalMatrix, this.normalMatrix)

      this.gl.uniformMatrix4fv(this.uModelViewMatrix, false, this.modelViewMatrix)
      this.gl.uniformMatrix4fv(this.uProjectionMatrix, false, this.projectionMatrix)
      this.gl.uniformMatrix4fv(this.uNormalMatrix, false, this.normalMatrix)

      // Set lighting data
      this.gl.uniform4fv(this.uMaterialAmbient, object.ambient)
      this.gl.uniform4fv(this.uMaterialDiffuse, object.diffuse)
      this.gl.uniform4fv(this.uMaterialSpecular, object.specular)

      // Bind
      this.gl.bindVertexArray(object.vao)
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, object.ibo)

      // Draw
      this.gl.drawElements(this.gl.TRIANGLES, object.indices.length, this.gl.UNSIGNED_SHORT, 0)

      // Clean
      this.gl.bindVertexArray(null)
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null)
    })
  }

  private animate = () => {
    let timeNow = new Date().getTime()
    if (this.lastTime) {
      const elapsed = timeNow - this.lastTime
      this.angle += (90 * elapsed) / 10000.0
    }
    this.lastTime = timeNow
  }

  private initControls = () => {
    configureControls({
      'Sphere Color': {
        value: [0, 255, 0],
        onChange: (v: any) => this.getObject('sphere').diffuse = [...normalizeColor(v), 1.0]
      },
      'Cone Color': {
        value: [235, 0, 210],
        onChange: (v: any) => this.getObject('cone').diffuse = [...normalizeColor(v), 1.0]
      },
      Shininess: {
        value: this.shininess,
        min: 1,
        max: 50,
        step: 0.1,
        onChange: (v: any) => this.gl.uniform1f(this.uShininess, v)
      },
      Distance: {
        value: this.distance,
        min: -200,
        max: -50,
        step: 0.1,
        onChange: (v: any) => this.distance = v
      },
      ...['Translate X', 'Translate Y', 'Translate Z'].reduce<{ [key: string]: any }>((result, name, i) => {
        result[name] = {
          value: this.lightPosition[i],
          min: -50,
          max: 50,
          step: -0.1,
          onChange: (v: any, state: { [key: string]: any }) => {
            this.gl.uniform3fv(this.uLightPosition, [
              state['Translate X'],
              state['Translate Y'],
              state['Translate Z']
            ])
          }
        }
        return result
      }, {})
    })
  }
}
