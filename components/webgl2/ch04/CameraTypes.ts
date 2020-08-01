import { Program } from '../common/Program'
import { mat4, vec3 } from 'gl-matrix'
import { Clock } from '../common/Clock'
import { Scene } from '../common/Scene'
import { compileShader } from '../common/CompileShader'
import vertexShaderStr from './shader/phong.vert'
import fragmentShaderStr from './shader/phong.frag'
import { Floor } from '../common/Floor'
import { Axis } from '../common/Axis'
import { IObject } from '../common/IObject'
import { Camera } from '../common/Camera'
import { configureControls } from '../common/Utils'

export class CameraTypes {
  private gl!: WebGL2RenderingContext
  private program!: Program
  private camera!: Camera

  private modelViewMatrix = mat4.create()
  private projectionMatrix = mat4.create()
  private normalMatrix = mat4.create()
  private cameraMatrix = mat4.create()

  private clock!: Clock
  private scene!: Scene

  public constructor(canvas: HTMLCanvasElement) {
    this.configure(canvas)
    this.initTransforms()
    this.initControls()

    this.load().then(() => {
      this.clock.on('tick', this.draw)
    })
  }

  private configure(canvas: HTMLCanvasElement) {
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

    this.clock = new Clock()
    this.program = new Program(this.gl, vertexShader, fragmentShader)

    // Uniforms to be set
    const uniforms = [
      'uProjectionMatrix',
      'uModelViewMatrix',
      'uNormalMatrix',
      'uMaterialDiffuse',
      'uLightAmbient',
      'uLightDiffuse',
      'uLightPosition',
      'uWireframe'
    ]

    // Attributes to be set
    const attributes = [
      'aVertexPosition',
      'aVertexNormal',
      'aVertexColor'
    ]

    this.program.load(attributes, uniforms)
    this.scene = new Scene(this.gl, this.program)

    this.camera = new Camera('ORBITING')
    this.camera.goHome([0, 2, 50])

    // TODO control

    this.gl.uniform3fv(this.program.getUniformLocation('uLightPosition'), [0, 120, 120])
    this.gl.uniform4fv(this.program.getUniformLocation('uLightAmbient'), [0.20, 0.20, 0.20, 1])
    this.gl.uniform4fv(this.program.getUniformLocation('uLightDiffuse'), [1, 1, 1, 1])
  }

  private async load() {
    this.scene.add(new Floor(100, 2))
    this.scene.add(new Axis(50))
    return this.scene.load('/common/models/geometries/cone3.json', 'cone')
  }

  private initTransforms() {
    this.modelViewMatrix = this.camera.getViewTransform()
    // プロジェクション行列
    mat4.identity(this.projectionMatrix)
    this.updateTransforms()
    // 法線行列
    mat4.identity(this.normalMatrix)
    mat4.copy(this.normalMatrix, this.modelViewMatrix)
    mat4.invert(this.normalMatrix, this.normalMatrix)
    mat4.transpose(this.normalMatrix, this.normalMatrix)
  }

  private updateTransforms() {
    mat4.perspective(this.projectionMatrix, 45, this.gl.canvas.width / this.gl.canvas.height, 0.1, 1000)
  }

  private setMatrixUniforms() {
    this.cameraMatrix = this.camera.getViewTransform()
    this.gl.uniformMatrix4fv(this.program.getUniformLocation('uModelViewMatrix'), false, this.cameraMatrix)
    this.gl.uniformMatrix4fv(this.program.getUniformLocation('uProjectionMatrix'), false, this.projectionMatrix)
    mat4.transpose(this.normalMatrix, this.camera.matrix)
    this.gl.uniformMatrix4fv(this.program.getUniformLocation('uNormalMatrix'), false, this.normalMatrix)
  }

  private draw = () => {
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

    try {
      this.updateTransforms()
      this.setMatrixUniforms()

      this.scene.traverse((object: IObject) => {
        this.gl.uniform4fv(this.program.getUniformLocation('uMaterialDiffuse'), object.diffuse!)
        this.gl.uniform1i(this.program.getUniformLocation('uWireframe'), object.wireframe ? 1 : 0)

        this.gl.bindVertexArray(object.vao!)
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, object.ibo!)

        if (object.wireframe) {
          this.gl.drawElements(this.gl.LINES, object.indices.length, this.gl.UNSIGNED_SHORT, 0)
        } else {
          this.gl.drawElements(this.gl.TRIANGLES, object.indices.length, this.gl.UNSIGNED_SHORT, 0)
        }

        this.gl.bindVertexArray(null)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null)
      })

    } catch (error) {
      console.error(error)
    }
  }

  private initControls() {
    configureControls({
      'Camera Type': {
        value: this.camera.type,
        options: ['TRACKING', 'ORBITING'],
        onChange: (v: 'TRACKING' | 'ORBITING') => {
          this.camera.goHome([0, 2, 50])
          this.camera.setType(v)
        }
      },
      Position: {
        ...['X', 'Y', 'Z'].reduce<{ [key: string]: any }>((result, name, i) => {
          result[name] = {
            value: this.camera.position[i],
            min: -100, max: 100, step: 0.1,
            onChange: (v: any, state: any) => {
              this.camera.setPosition([state.X, state.Y, state.Z])
            }
          }
          return result
        }, {})
      },
      Rotation: {
        Elevation: {
          value: this.camera.elevation,
          min: -180, max: 180, step: 0.1,
          onChange: (v: number) => this.camera.setElevation(v)
        },
        Azimuth: {
          value: this.camera.azimuth,
          min: -180, max: 180, step: 0.1,
          onChange: (v: number) => this.camera.setAzimuth(v)
        }
      }
    })
  }
}
