export class RenderBuffer {
  private _target: GLenum
  private _usage: GLenum
  private _length: number
  private _buffer: WebGLBuffer | null
  private readonly _promise: Promise<RenderBuffer>

  public constructor(target: GLenum, usage: GLenum, buffer: WebGLBuffer | Promise<WebGLBuffer>, length: number = 0) {
    this._target = target
    this._usage = usage
    this._length = length

    if (buffer instanceof Promise) {
      this._buffer = null
      this._promise = buffer.then(buffer => {
        this._buffer = buffer
        return this
      })
    } else {
      this._buffer = buffer
      this._promise = Promise.resolve(this)
    }
  }

  public waitForComplete() {
    return this._promise
  }

  public set length(value:number) {
    this._length = value
  }
}
