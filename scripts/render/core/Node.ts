import { Renderer } from './Renderer'

export abstract class Node {
  protected children: Node[] = []
  protected parent: Node | null = null
  protected _renderer: Renderer | null = null
  protected _renderPrimitives: any = null

  public constructor() {
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
    if(this._renderer === renderer) {
      return
    }

    if(this._renderer !== null) {
      this.clearRenderPrimitives()
    }

    this._renderer = renderer

    this.onRendererChanged(renderer)

    for(let child of this.children) {
      child._setRenderer(renderer)
    }
  }

  protected abstract onRendererChanged(renderer: Renderer): void

  private clearRenderPrimitives() {
    // TODO
  }
}
