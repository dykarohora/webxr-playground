import { Program } from '../common/Program'
import { Camera } from '../common/Camera'
import { Transforms } from '../common/Transforms'
import { compileShader } from '../common/CompileShader'
import vertexShaderStr from './shader/lambert.vert'
import fragmentShaderStr from './shader/lambert.frag'
import { Clock } from '../common/Clock'
import { Scene } from '../common/Scene'
import { Controls } from '../common/Controls'
import { Light } from '../common/Light'
import { Floor } from '../common/Floor'
import { IObject } from '../common/IObject'
import { mat4 } from 'gl-matrix'
import { configureControls } from '../common/Utils'

const GL = WebGL2RenderingContext

export class WallLight {
  private gl!: WebGL2RenderingContext
  private program!: Program
  private camera!: Camera
  private transforms!: Transforms

  private clock!: Clock
  private scene!: Scene

  private redLightPosition: [number, number, number] = [0, 7, 3]
  private greenLightPosition: [number, number, number] = [2.5, 3, 3]
  private lightCutOff = 0.3

  public constructor(canvas: HTMLCanvasElement) {
    this.configure(canvas)
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
    this.gl.enable(GL.DEPTH_TEST)
    this.gl.enable(GL.BLEND)
    this.gl.blendEquation(GL.FUNC_ADD)
    this.gl.depthFunc(GL.LEQUAL)

    const vertexShader = compileShader(this.gl, vertexShaderStr, 'VERTEX')
    const fragmentShader = compileShader(this.gl, fragmentShaderStr, 'FRAGMENT')

    this.clock = new Clock()
    this.program = new Program(this.gl, vertexShader, fragmentShader)

    const attributes = [
      'aVertexPosition',
      'aVertexNormal',
      'aVertexColor'
    ]

    const uniforms = [
      'uProjectionMatrix',
      'uModelViewMatrix',
      'uNormalMatrix',
      'uMaterialDiffuse',
      'uMaterialAmbient',
      'uLightAmbient',
      'uDiffuseRedLight',
      'uDiffuseGreenLight',
      'uPositionRedLight',
      'uPositionGreenLight',
      'uWireframe',
      'uLightSource',
      'uCutOff'
    ]

    // ProgramにてAttributeとUniformのLocationを保持しておく
    this.program.load(attributes, uniforms)
    this.scene = new Scene(this.gl, this.program)

    this.camera = new Camera('ORBITING')
    this.camera.goHome([0, 2, 50])
    this.camera.setFocus([0, 0, 0])
    this.camera.setAzimuth(0)
    this.camera.setElevation(-3)

    new Controls(this.camera, canvas)

    this.transforms = new Transforms(this.gl, this.program, this.camera, canvas)

    const redLight = new Light('redLight')
    redLight.setPosition(this.redLightPosition)
    redLight.setDiffuse([1, 0, 0, 1])

    const greenLight = new Light('greenLight')
    greenLight.setPosition(this.greenLightPosition)
    greenLight.setDiffuse([0, 1, 0, 1])

    this.gl.uniform3fv(this.program.getUniformLocation('uPositionRedLight'), redLight.position)
    this.gl.uniform3fv(this.program.getUniformLocation('uPositionGreenLight'), greenLight.position)

    this.gl.uniform4fv(this.program.getUniformLocation('uDiffuseRedLight'), redLight.diffuse)
    this.gl.uniform4fv(this.program.getUniformLocation('uDiffuseGreenLight'), greenLight.diffuse)

    this.gl.uniform1f(this.program.getUniformLocation('uCutOff'), this.lightCutOff)
    this.gl.uniform4fv(this.program.getUniformLocation('uLightAmbient'), [1, 1, 1, 1])
  }

  private async load() {
    this.scene.add(new Floor(80, 2))
    await Promise.all([
      this.scene.load('/common/models/geometries/wall.json', 'wall'),
      this.scene.load('/common/models/geometries/sphere3.json', 'redLight'),
      this.scene.load('/common/models/geometries/sphere3.json', 'greenLight')
    ])
  }

  private draw = () => {
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
    this.gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT)
    this.transforms.updatePerspective()

    try {
      this.scene.traverse((object: IObject) => {
        this.transforms.calculateModelView()
        this.transforms.push()

        this.gl.uniform1i(this.program.getUniformLocation('uLightSource'), 0)

        const {alias} = object
        // ライト発光源
        if (alias === 'redLight') {
          mat4.translate(this.transforms.modelViewMatrix, this.transforms.modelViewMatrix, this.program.getUniform(this.program.getUniformLocation('uPositionRedLight')))
          object.diffuse = this.program.getUniform(this.program.getUniformLocation('uDiffuseRedLight'))
          this.gl.uniform1i(this.program.getUniformLocation('uLightSource'), 1)
        }

        if (alias === 'greenLight') {
          mat4.translate(this.transforms.modelViewMatrix, this.transforms.modelViewMatrix, this.program.getUniform(this.program.getUniformLocation('uPositionGreenLight')))
          object.diffuse = this.program.getUniform(this.program.getUniformLocation('uDiffuseGreenLight'))
          this.gl.uniform1i(this.program.getUniformLocation('uLightSource'), 1)
        }

        this.transforms.setMatrixUniforms()
        this.transforms.pop()

        this.gl.uniform4fv(this.program.getUniformLocation('uMaterialDiffuse'), object.diffuse!)
        this.gl.uniform4fv(this.program.getUniformLocation('uMaterialAmbient'), object.ambient!)
        this.gl.uniform1i(this.program.getUniformLocation('uWireframe'), object.wireframe ? 1 : 0)

        this.gl.bindVertexArray(object.vao!)
        this.gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, object.ibo!)

        if (object.wireframe) {
          this.gl.drawElements(GL.LINES, object.indices.length, GL.UNSIGNED_SHORT, 0)
        } else {
          this.gl.drawElements(GL.TRIANGLES, object.indices.length, GL.UNSIGNED_SHORT, 0)
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
      'Light Cone Cut Off': {
        value: this.lightCutOff,
        min: 0, max: 1, step: 0.01,
        onChange: (v: any) => this.gl.uniform1f(this.program.getUniformLocation('uCutOff'), v)
      },
      ...[
        {
          name: 'Red Light',
          position: this.redLightPosition,
          uniform: this.program.getUniformLocation('uPositionRedLight')
        },
        {
          name: 'Green Light',
          position: this.greenLightPosition,
          uniform: this.program.getUniformLocation('uPositionGreenLight')
        }
      ].reduce((controls: any, light: any) => {
        const positionKeys = [
          `X - ${light.name}`,
          `Y - ${light.name}`,
          `Z - ${light.name}`
        ]

        controls[light.name] = positionKeys.reduce((positionControls: any, position: any, i) => {
          positionControls[position] = {
            value: light.position[i],
            min: -15, max: 15, step: 0.1,
            onChange: (v: any, state: any) => {
              this.gl.uniform3fv(light.uniform, positionKeys.map(p => state[p]))
            }
          }
          return positionControls
        }, {})
        return controls
      }, {})
    })
  }
}
