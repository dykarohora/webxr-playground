import { Renderer } from './Renderer'
import { RenderPrimitive } from './RenderPrimitive'
import { mat4 } from 'gl-matrix'

export class Node {
  protected children: Node[] = []
  protected parent: Node | null = null
  protected _visible = true
  protected _renderer: Renderer | null = null
  protected _renderPrimitives: RenderPrimitive[] = []
  protected _activeFrameId = -1

  protected _worldMatrix!: mat4

  public constructor() {
  }

  public get visible() {
    return this._visible
  }

  // TODO これなにやっているかよくわからないなあ
  public markActive(frameId: number) {
    if (this._visible && this._renderPrimitives.length !== 0) {
      this._activeFrameId = frameId
      for(const primitive of this._renderPrimitives) {
        primitive.markActive(frameId)
      }
    }

    for(const child of this.children) {
      if(child._visible) {
        child.markActive(frameId)
      }
    }
  }

  public get worldMatrix() {
    if (this._worldMatrix === undefined || this._worldMatrix === null) {
      this._worldMatrix = mat4.create()
    }

    return this._worldMatrix
  }

  /**
   * 指定されたNodeを子として加える
   * @param value
   */
  public addNode(value: Node) {
    if (value.parent == this) {
      return
    }

    if (value.parent !== null) {
      value.parent.removeNode(value)
    }

    value.parent = this

    this.children.push(value)

    if (this._renderer !== null) {
      value._setRenderer(this._renderer)
    }
  }

  /**
   * 指定されたNodeを子から取り除く
   * @param value
   */
  public removeNode(value: Node) {
    const i = this.children.indexOf(value)
    if (i > -1) {
      this.children.splice(i, 1)
      value.parent = null
    }
  }

  public _setRenderer(renderer: Renderer) {
    if (this._renderer === renderer) {
      return
    }

    if (this._renderer !== null) {
      this.clearRenderPrimitives()
    }

    this._renderer = renderer

    this.onRendererChanged(renderer)

    for (let child of this.children) {
      child._setRenderer(renderer)
    }
  }

  protected onRendererChanged(renderer: Renderer) {
  }

  public addRenderPrimitive(primitive: RenderPrimitive) {
    this._renderPrimitives.push(primitive)
    primitive.instances.push(this)
  }

  private clearRenderPrimitives() {
    // TODO やらなくて大丈夫
  }
}
