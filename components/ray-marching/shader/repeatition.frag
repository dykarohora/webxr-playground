#version 300 es
precision mediump float;

uniform float time;
uniform vec2 mouse;// 0-1の範囲でマウス座標が渡される、ただし左上が原点
uniform vec2 resolution;// ウィンドウの解像度

out vec4 fragColor;

const float sphereSize = 1.0;
const vec3 lightDir = normalize(vec3(-1.0, 1.0, 1.0));

const float PI = 3.14159265;
const float angle = 60.0;
const float fov = angle * 0.5 * PI / 180.0;

vec3 trans(vec3 p) {
  return mod(p, 4.0) - 2.0;
}

// 原点にある球、その距離関数
float distanceFunc(vec3 p) {
  return length(trans(p)) - sphereSize;
}

// 法線を計算する、法線は距離関数の勾配に等しい
vec3 getNormal(vec3 p){
  float d = 0.0001;
  return normalize(vec3(
  distanceFunc(p + vec3(d, 0.0, 0.0)) - distanceFunc(p + vec3(-d, 0.0, 0.0)),
  distanceFunc(p + vec3(0.0, d, 0.0)) - distanceFunc(p + vec3(0.0, -d, 0.0)),
  distanceFunc(p + vec3(0.0, 0.0, d)) - distanceFunc(p + vec3(0.0, 0.0, -d))
  ));
}

void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);// 描画位置を-1〜1の範囲に正規化

  vec3 cPos = vec3(0.0, 0.0, 3.0);// カメラ位置
  vec3 cDir = vec3(0.0, 0.0, -1.0);// カメラの向き
  vec3 cUp = vec3(0.0, 1.0, 0.0);// カメラの上向き
  vec3 cSide = cross(cDir, cUp);// カメラの右方向

  float targetDepth = 1.0;

  // ray direction
  vec3 ray = normalize(vec3(sin(fov) * p.x, sin(fov) * p.y, -cos(fov)));

  float distance = 0.0;
  float rLen = 0.0;
  vec3 rPos = cPos;

  // カメラポジションからスクリーンの各ピクセルに向かってレイを伸ばしていくイメージ
  for (int i=0; i<64; i++) {
    distance = distanceFunc(rPos);// 現在のレイポイントと原点にある球との距離を算出
    rLen += distance;// 距離の分だけレイの長さを加算
    rPos = cPos + ray * rLen;// rLenの分だけレイの先端を伸ばしていく
  }

  // rPos(レイの先端)とdistanceが十分小さければ、レイはオブジェクトと衝突しているとみなせる
  if (abs(distance) < 0.0001) {
    vec3 normal = getNormal(rPos);// 例の先端座標を使って法線を計算する
    float diffuse = clamp(dot(lightDir, normal), 0.1, 1.0); // ランバート反射
    fragColor = vec4(vec3(diffuse), 1.0);
  } else {
    fragColor = vec4(vec3(0.0), 1.0);
  }
}

