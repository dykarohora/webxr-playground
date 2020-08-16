export function compileShader(gl: WebGL2RenderingContext, shaderString: string, type: 'VERTEX' | 'FRAGMENT') {
  let shader: WebGLShader
  switch (type) {
    case 'VERTEX':
      // Shaderオブジェクトの作成
      shader = gl.createShader(gl.VERTEX_SHADER)!
      break
    case 'FRAGMENT':
      shader = gl.createShader(gl.FRAGMENT_SHADER)!
      break
  }

  // shaderオブジェクトにシェーダコードをセットする
  gl.shaderSource(shader, shaderString.trim())
  // コンパイル
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(shader))
    throw new Error('Failed Shader Compile')
  }

  return shader
}
