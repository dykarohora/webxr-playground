import { Result } from 'type-result'

export function createWebGLContext(glAttribs: WebGLContextAttributes): Result<WebGL2RenderingContext, string> {
  const webglCanvas = document.createElement('canvas')
  const context = webglCanvas.getContext('webgl2', glAttribs)

  if (!context) {
    console.error('This browser does not support webgl2')
    return Result.fail('This browser does not support webgl2')
  }

  return Result.ok(context)
}
