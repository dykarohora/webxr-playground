const GL = WebGL2RenderingContext

export class TextureSampler {
  public constructor(
    public minFilter: number | null = null,
    public magFilter: number | null = null,
    public wrapS: number | null = null,
    public wrapT: number | null = null
  ) {
  }
}

let nextDataTextureIndex = 0

/**
 * テクスチャデータを保持するオブジェクト
 * データ自体は具象クラスが持つ
 */
export abstract class Texture {
  private readonly _sampler: TextureSampler
  public readonly mipmap = true

  protected constructor() {
    this._sampler = new TextureSampler()
  }

  public get sampler() {
    return this._sampler
  }

  public abstract get format(): GLenum

  public abstract get width(): number

  public abstract get height(): number

  public abstract get textureKey(): string

  public abstract get source(): any
}

export class ImageTexture extends Texture {
  private readonly _img: HTMLImageElement
  private _imgBitmap?: ImageBitmap
  private _manualKey: string

  private readonly _promise: Promise<any>

  public constructor(img: HTMLImageElement) {
    super()

    this._img = img
    this._manualKey = ''
    if (img.src && img.complete) {
      if (img.naturalWidth) {
        this._promise = this.finishImage()
      } else {
        this._promise = Promise.reject('Image provided had failed to load.')
      }
    } else {
      this._promise = new Promise((resolve, reject) => {
        img.addEventListener('load', () => resolve(this.finishImage()))
        img.addEventListener('error', reject)
      })
    }
  }

  private finishImage = () => {
    if (window.createImageBitmap !== undefined) {
      return window.createImageBitmap(this._img).then((imgBitmap) => {
        this._imgBitmap = imgBitmap
        return Promise.resolve(this)
      })
    }
    return Promise.resolve(this)
  }

  // イメージのロードの非同期読み込みのPromise
  public waitForComplete() {
    return this._promise
  }

  public get format(): GLenum {
    return GL.RGBA
  }

  public get width(): number {
    return this._img.width
  }

  public get height(): number {
    return this._img.height
  }

  public get textureKey(): string {
    if (this._manualKey === '') {
      return this._img.src
    } else {
      return this._manualKey
    }
  }

  public get source() {
    return this._imgBitmap ?? this._img
  }

  public getDataKey() {
    this._manualKey = `DATA_${nextDataTextureIndex}`
    nextDataTextureIndex++
  }
}

export class UrlTexture extends ImageTexture {
  public constructor(url: string) {
    const img = new Image()
    img.src = url
    super(img)
  }
}
