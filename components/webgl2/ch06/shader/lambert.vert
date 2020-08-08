#version 300 es
precision mediump float;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;
uniform vec4 uMaterialDiffuse;
uniform vec3 uPositionRedLight;
uniform vec3 uPositionGreenLight;

in vec3 aVertexPosition;
in vec3 aVertexNormal;
in vec4 aVertexColor;

out vec3 vNormal;
out vec3 vRedRay;
out vec3 vGreenRay;

void main() {
  // 頂点をワールド空間に変換
  vec4 vertex = uModelViewMatrix * vec4(aVertexPosition, 1.0);
  // 法線をワールド空間に変換
  vNormal = vec3(uNormalMatrix * vec4(aVertexNormal, 1.0));

  vec4 redLightPosition = uModelViewMatrix * vec4(uPositionRedLight, 1.0);
  vec4 greenLightPosition = uModelViewMatrix * vec4(uPositionGreenLight, 1.0);

  // RedLightから頂点への光線ベクトル
  vRedRay = vertex.xyz - redLightPosition.xyz;
  // GreenLightから頂点への光線ベクトル
  vGreenRay = vertex.xyz - greenLightPosition.xyz;

  // 頂点をクリッピング空間に変換
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
}
