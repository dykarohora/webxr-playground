const GL = WebGLRenderingContext // For enums

export const CAP = {
  // Enable caps
  CULL_FACE: 0x001,
  BLEND: 0x002,
  DEPTH_TEST: 0x004,
  STENCIL_TEST: 0x008,
  COLOR_MASK: 0x010,
  DEPTH_MASK: 0x020,
  STENCIL_MASK: 0x040
}

export const MAT_STATE = {
  CAPS_RANGE: 0x000000FF,
  BLEND_SRC_SHIFT: 8,
  BLEND_SRC_RANGE: 0x00000F00,
  BLEND_DST_SHIFT: 12,
  BLEND_DST_RANGE: 0x0000F000,
  BLEND_FUNC_RANGE: 0x0000FF00,
  DEPTH_FUNC_SHIFT: 16,
  DEPTH_FUNC_RANGE: 0x000F0000
}

export const RENDER_ORDER = {
  // Render opaque objects first.
  OPAQUE: 0,

  // Render the sky after all opaque object to save fill rate.
  SKY: 1,

  // Render transparent objects next so that the opaqe objects show through.
  TRANSPARENT: 2,

  // Finally render purely additive effects like pointer rays so that they
  // can render without depth mask.
  ADDITIVE: 3,

  // Render order will be picked based on the material properties.
  DEFAULT: 4
}

export class MaterialState {
  public state: number
  public blendFuncSrc: number
  public blendFuncDst: number
  public depthFunc: number

  public constructor() {
    this.state = CAP.CULL_FACE | CAP.DEPTH_TEST | CAP.COLOR_MASK | CAP.DEPTH_MASK
    this.blendFuncSrc = GL.SRC_ALPHA
    this.blendFuncDst = GL.ONE_MINUS_SRC_ALPHA
    this.depthFunc = GL.LESS
  }
}

export class Material {
  protected _renderOrder: number
  protected _state: MaterialState
  protected _samplers: any[] = []
  protected _uniforms: any[] = []

  public constructor() {
    this._state = new MaterialState
    this._renderOrder = RENDER_ORDER.DEFAULT
  }
}
