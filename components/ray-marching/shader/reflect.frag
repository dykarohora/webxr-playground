#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;// 0-1の範囲でマウス座標が渡される、ただし左上が原点
uniform vec2 resolution;// ウィンドウの解像度

out vec4 fragColor;

const float EPS = 0.01;
const float OFFSET = EPS * 100.0;
const vec3 lightDir = vec3(0.48666426339228763, 0.8111071056538127, 0.3244428422615251);

const float PI = 3.14159265;
const float angle = 60.0;
const float fov = angle * 0.5 * PI / 180.0;

float smoothMin(float d1, float d2, float k) {
  float h = exp(-k*d1) + exp(-k*d2);
  return -log(h)/k;
}

// 繰り返し
vec3 opRep(vec3 p, float interval) {
  // レイポジションを-interval/2 〜 interval/2の範囲で正規化する。
  // それによって距離関数の結果も正規化されるので、繰り返し表現が可能となる。

  // 繰り返したい軸方向を決めることによってパターンをコントロールできる
  // xz平面で繰り返したい→レイポジションのx,zを正規化する
  vec2 q = mod(p.xz, interval) - interval * 0.5;
  return vec3(q.x, p.y, q.y);
}

float torusDist(vec3 p, float posX, float dist) {
  p.x -= posX;
  p.y -= 1.0;
  //  vec2 t = vec2(1.5, 0.25);
  //  vec2 r = vec2(length(p.xy) - t.x, p.z);
  //  return length(r) - t.y;
  float r = 0.3;
  float R = 1.0;
  return sqrt(p.x*p.x+p.y*p.y+p.z*p.z + R*R - 2.0 * R * sqrt(p.x*p.x+p.y*p.y+p.z*p.z*abs(sin(time + dist)))) - r;
}

// 球の距離関数
float sphereDist(vec3 p, float r) {
  return length(opRep(p, 4.0)) - 1.0;
}

// 床の距離関数
float floorDist(vec3 p) {
  return dot(p, vec3(0.0, 1.0, 0.0)) + 1.0;
}

// vec4の第四成分を見て、値が小さい方のvec4を返す
vec4 minVec4(vec4 a, vec4 b) {
  return (a.a < b.a) ? a : b;
}

// 床のテクスチャ
float checkeredPattern(vec3 p) {
  // 0 〜 1.999999 → 0 or 1
  float u = 1.0 - floor(mod(p.x, 2.0));// 0 or 1
  float v = 1.0 - floor(mod(p.z, 2.0));

  // uとvの組み合わせは4通り(0,0) (0,1) (1,0) (1,1)
  // xz平面で計算しているのでuv座標のマッピングは次のようになる
  // (0,1) | (1,1) | (0,1) | (1,1)
  // (0,0) | (1,0) | (0,0) | (1,0)
  // (0,1) | (1,1) | (0,1) | (1,1)
  // (0,0) | (1,0) | (0,0) | (1,0)
  if ((u == 1.0 && v < 1.0) || (u < 1.0 && v == 1.0)) {
    return 0.2;
  } else {
    return 1.0;
  }
}

// HSV → RGB
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// 球と床を合成
float sceneDist(vec3 p) {
  //  return min(
  //  sphereDist(p, 1.0),
  //  floorDist(p)
  //  );
  float min1 = smoothMin(
  torusDist(p, 1.0, 0.0),
  torusDist(p, -1.0, 2.0),
  8.0
  );
  return min(min1, floorDist(p));
}

// 色を返す
vec4 sceneColor(vec3 p) {
  //  return minVec4(
  //  vec4(hsv2rgb(vec3((p.z + p.x) / 9.0, 1.0, 1.0)), sphereDist(p, 1.0)),
  //  vec4(vec3(0.5) * checkeredPattern(p), floorDist(p))
  //  );
  vec4 min1 = minVec4(
  vec4(hsv2rgb(vec3((p.z + p.x) / 9.0, 1.0, 1.0)), torusDist(p, 3.0, 0.0)),
  vec4(hsv2rgb(vec3((p.z + p.x) / 9.0, 1.0, 1.0)), torusDist(p, -3.0, 2.0))
  );
  return minVec4(
  min1,
  vec4(vec3(0.5) * checkeredPattern(p), floorDist(p))
  );
}

vec3 getNormal(vec3 p) {
  return normalize(vec3(
  sceneDist(p + vec3(EPS, 0.0, 0.0)) - sceneDist(p + vec3(-EPS, 0.0, 0.0)),
  sceneDist(p + vec3(0.0, EPS, 0.0)) - sceneDist(p + vec3(0.0, -EPS, 0.0)),
  sceneDist(p + vec3(0.0, 0.0, EPS)) - sceneDist(p + vec3(0.0, 0.0, -EPS))
  ));
}

float getShadow(vec3 ro, vec3 rd) {
  float h = 0.0;
  float c = 0.0;
  float r = 1.0;
  float shadowCoef = 0.5;

  for (float t = 0.0; t < 50.0; t++) {
    h = sceneDist(ro + rd * c);
    if (h<EPS) return shadowCoef;
    r = min(r, h*4.0/c);
    c+=h;
  }

  return 1.0 - shadowCoef + r * shadowCoef;
}

vec3 getRayColor(vec3 origin, vec3 ray, out vec3 pos, out vec3 normal, out bool hit) {
  // マーチングループ
  float dist;
  float depth = 0.0;
  pos = origin;

  for (int i=0; i<64; i++) {
    dist = sceneDist(pos);
    depth += dist;
    pos = origin + depth * ray;

    if (abs(dist) < EPS) break;
  }

  vec3 color;

  if (abs(dist) < EPS) {
    normal = getNormal(pos);
    float diffuse = clamp(dot(lightDir, normal), 0.1, 1.0);
    float specular = pow(clamp(dot(reflect(lightDir, normal), ray), 0.0, 1.0), 10.0);
    float shadow = getShadow(pos + normal * OFFSET, lightDir);
    color = (sceneColor(pos).rgb * diffuse + vec3(0.8) * specular) * max(0.5, shadow);
  } else {
    color = vec3(0.0);
  }

  return color;
}

void main() {
  vec2 screenPos = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

  vec3 cPos = vec3(0.0, 1.0, 3.0);// カメラ位置
  vec3 cDir = vec3(0.0, 0.0, -1.0);// カメラの向き
  vec3 cUp = vec3(0.0, 1.0, 0.0);// カメラの上向き
  vec3 cSide = cross(cDir, cUp);// カメラの右方向

  float targetDepth = 1.0;

  vec3 ray = normalize(cSide * screenPos.x + cUp * screenPos.y + cDir * targetDepth);

  vec3 color = vec3(0.0);
  vec3 pos;// レイポジション
  vec3 normal;// 法線
  bool hit;// 衝突フラグ
  float alpha = 1.0;

  for (int i=0; i<3; i++) {
    color += alpha * getRayColor(cPos, ray, pos, normal, hit);
    alpha *= 0.3;
    ray = normalize(reflect(ray, normal));
    cPos = pos + normal * OFFSET;
  }

  fragColor = vec4(color, 1.0);
}
