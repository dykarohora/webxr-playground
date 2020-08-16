#version 300 es
precision mediump float;

uniform float time;
uniform vec2 mouse;       // 0-1の範囲でマウス座標が渡される、ただし左上が原点
uniform vec2 resolution;  // ウィンドウの解像度

out vec4 fragColor;

void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);  // 描画位置を-1〜1の範囲に正規化

  vec3 cPos = vec3(0.0, 0.0, 3.0);    // カメラ位置
  vec3 cDir = vec3(0.0, 0.0, -1.0);   // カメラの向き
  vec3 cUp = vec3(0.0, 1.0, 0.0);     // カメラの上向き
  vec3 cSide = cross(cDir, cUp);      // カメラの右方向

  float targetDepth = 0.1;

  vec3 ray = normalize(cSide * p.x + cUp * p.y + cDir * targetDepth);

  fragColor = vec4(ray.xy, -ray.z, 1.0);
}

