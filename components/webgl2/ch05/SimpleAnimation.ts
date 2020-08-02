import vertexShaderStr from './shader/phong.vert'
import fragmentShaderStr from './shader/phong.frag'
import { Program } from '../common/Program'
import { Camera } from '../common/Camera'
import { mat4 } from 'gl-matrix'
import { Clock } from '../common/Clock'
import { Scene } from '../common/Scene'
import { compileShader } from '../common/CompileShader'
import { Controls } from '../common/Controls'
import { Floor } from '../common/Floor'
import { Axis } from '../common/Axis'
import { Transforms } from '../common/Transforms'
import { IObject } from '../common/IObject'
import { configureControls } from '../common/Utils'

export class SimpleAnimation {

  private gl!: WebGL2RenderingContext
  private program!: Program
  private camera!: Camera
  private transforms!: Transforms

  private clock!: Clock
  private scene!: Scene

  private initialTime!: number
  private elapsedTime!: number
  private readonly frequency = 5

  private dxSphere = 0.1
  private dxCone = 0.15

  private spherePosition = 0
  private conePosition = 0

  private lightPosition: [number, number, number] = [0, 120, 120]

  public constructor(canvas: HTMLCanvasElement) {
    this.configure(canvas)
    this.initControls()
    this.load().then(() => {
      this.render()
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

    new Controls(this.camera, canvas)

    this.transforms = new Transforms(this.gl, this.program, this.camera, canvas)

    this.gl.uniform3fv(this.program.getUniformLocation('uLightPosition'), this.lightPosition)
    this.gl.uniform4fv(this.program.getUniformLocation('uLightAmbient'), [0.20, 0.20, 0.20, 1])
    this.gl.uniform4fv(this.program.getUniformLocation('uLightDiffuse'), [1, 1, 1, 1])
  }

  private async load() {
    this.scene.add(new Floor(100, 2))
    this.scene.add(new Axis(50))
    await Promise.all([
      this.scene.load(`/common/models/geometries/sphere2.json`, 'sphere'),
      this.scene.load(`/common/models/geometries/cone3.json`, 'cone')
    ])
  }

  private render = () => {
    this.initialTime = new Date().getTime()
    setInterval(this.onFrame, this.frequency / 1000)
  }

  private onFrame = () => {
    this.elapsedTime = (new Date()).getTime() - this.initialTime
    if(this.elapsedTime < this.frequency) return

    let steps = Math.floor(this.elapsedTime / this.frequency)
    while(steps > 0) {
      this.animate()
      steps -= 1
    }

    this.initialTime = (new Date()).getTime()
  }

  private animate = () => {
    this.spherePosition += this.dxSphere

    if(this.spherePosition >= 30 || this.spherePosition <= -30) {
      this.dxSphere = -this.dxSphere
    }

    this.conePosition += this.dxCone
    if(this.conePosition >= 35 || this.conePosition <= -35) {
      this.dxCone = -this.dxCone
    }

    this.draw()
  }

  private draw = () => {
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

    try {
      this.scene.traverse((object: IObject) => {
        this.transforms.calculateModelView()
        this.transforms.push()

        if(object.alias === 'sphere') {
          const sphereTransform = this.transforms.modelViewMatrix
          mat4.translate(sphereTransform ,sphereTransform, [0, 0, this.spherePosition])
        } else if(object.alias === 'cone') {
          const coneTransform = this.transforms.modelViewMatrix
          mat4.translate(coneTransform, coneTransform, [this.conePosition, 0, 0])
        }

        this.transforms.setMatrixUniforms()
        this.transforms.pop()

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
    } catch(error) {
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
      },
      'Light Position': {
        ...['X', 'Y', 'Z'].reduce<{ [key: string]: any }>((result, name, i) => {
          result[name] = {
            value: this.lightPosition[i],
            min: -1000, max: 1000, step: 0.5,
            onChange: (v: any, state: any) => {
              this.lightPosition[0] = state.X
              this.lightPosition[1] = state.Y
              this.lightPosition[2] = state.Z

              this.gl.uniform3fv(this.program.getUniformLocation('uLightPosition'), this.lightPosition)
            }
          }
          return result
        }, {})
      }
    })
  }
}

