#version 300 es
precision mediump float;

#define STEPS 128
#define PREC_MULT 0.0001
#define TMAX 150.0
#define TMIN 1.0
#define PI 3.14159265359

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

vec3 mainLightDir;
vec3 mainLightColor;
vec3 ambientColor;

out vec4 fragColor;

float ucos(float t) {
  return cos(t) * 0.5 + 0.5;
}

vec2 rotate(vec2 axis, float angle) {
  return vec2(
  cos(angle) * axis.x + sin(angle) * axis.y,
  -sin(angle) * axis.x + cos(angle) * axis.y
  );
}

vec3 FastHSL(vec3 hsl) {
  vec3 c = hsl;
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0., 1.), c.y);
}


float box(vec3 p, float r) {
  return length(max(abs(p) - vec3(r), 0.0));
}

float plane(vec3 p, vec3 n, float d) {
  return dot(p, n) - d;
}

float roundBox(vec3 p, vec3 b, float r) {
  vec3 d = abs(p) - b;
  return length(max(d, 0.0)) - r + min(max(d.x, max(d.y, d.z)), 0.0);
}

vec2 mat(float f, float m) {
  return vec2(f, m);
}

// 時間経過で色相を変化される、レインボー
vec3 matGlow(vec3 p) {
  // hsl
  vec3 hsl = vec3(mod(time*0.2+p.x*0.02+p.z*0.01, 1.0), 0.90, 1.);
  return FastHSL(hsl);
}

vec2 un(vec2 a, vec2 b) {
  // TODO step
  if (a.x < b.x) {
    return a;
  } else {
    return b;
  }
}

vec3 matChecker(vec3 p) {
  vec2 uv = p.xz;
  vec2 grid = floor(mod(uv, 2.0));
  vec3 baseColor;
  if (grid.x == grid.y) {
    baseColor = vec3(1.);
  } else {
    baseColor = vec3(0.);
  }
  baseColor = baseColor * 0.1 + vec3(0.1);
  return baseColor;
}

void mapAll(vec3 p, inout vec2 base, inout float occ, inout vec3 light) {
  light = vec3(0.);

  vec3 boxp = p;
  boxp = p - vec3(0., 2. + ucos(time) * 2., 0.);  // 上下移動
  boxp.z = mod(boxp.z + 4.0, 8.0) - 4.0;// repeat
  //  boxp.xz = rotate(boxp.xz, time + p.y);  // 変形
  //  float roundBoxd = roundBox(boxp, vec3(1.0 + mod(p.y*1.0+time*3.0,2.0) ,2.0+ucos(time),1.0) * 0.5, 0.3);

  // ボックスとの最短距離
  float boxd = box(boxp, 1.);

  // 平面を歪ませる
//  float planei = abs(mod(p.x, 2.) - 1.);
//  float planes = floor(mod(p.x * 0.5 - 0.5, 2.)) * 2.0 - 1.0;
//  planei = pow(planei, 0.2);

  vec3 planep = p;
  //  planep.y -= (planei * planes) * .2;
  float planed = plane(planep, vec3(0., 1., 0.), 0.);

  // 箱との距離が遠ければ遠いほど減衰させる、箱の色を重ねる
  light += pow(max(0.0, 1.0 - boxd / 5.0), 3.0) * matGlow(p);

  // オブジェクトとの最短距離
  base = un(mat(planed, 0.), mat(boxd, 1.0));

  occ = planed;
}

vec2 map(vec3 p) {
  vec2 base;
  float occ;
  vec3 light;
  mapAll(p, base, occ, light);
  return base;
}

  #define EPSILON 0.0001
vec3 mapNormal(vec3 p) {
  return normalize(vec3(
  map(vec3(p.x + EPSILON, p.y, p.z)).x - map(vec3(p.x - EPSILON, p.y, p.z)).x,
  map(vec3(p.x, p.y + EPSILON, p.z)).x - map(vec3(p.x, p.y - EPSILON, p.z)).x,
  map(vec3(p.x, p.y, p.z  + EPSILON)).x - map(vec3(p.x, p.y, p.z - EPSILON)).x
  ));
}

// pos - 衝突点
// n - 衝突点の法線
vec4 computeAO(vec3 pos, vec3 n) {
  float occ = 0.0;
  vec3 light = vec3(0, 0, 0);

  for (int i=0; i<3; i++)
  {
    // 衝突点から法線方向にレイを伸ばしていく、一定距離でね
    vec3 aopos = pos + n * 0.3 * float(i);

    vec2 baseStep;    // レイとオブジェクトの最短距離
    float occStep;    // あんま気にしなくていい
    vec3 lightStep;   //

    mapAll(aopos, baseStep, occStep, lightStep);

    occ += occStep;
    light += lightStep;

  }

  float ao = clamp(occ, 0.0, 1.0);

  return vec4(light, ao);
}

// rayOrigin - レイの発射地点、カメラ位置
// rayDir - レイの進行方向
// t - レイマーチングの結果のレイの進行距離
// m - マテリアルID
vec3 shade(vec3 rayOrigin, vec3 rayDir, float t, float m) {
  vec3 p = rayOrigin + rayDir * t;
  vec3 n = mapNormal(p);

  float nDotL = max(0.0, dot(n, -mainLightDir));
  vec3 lightColor = ambientColor + nDotL * mainLightColor;

  vec3 baseColor = vec3(1.);

  if (m == 0.) {
    // 床のライティング
    baseColor = matChecker(p);    // チェッカーテクスチャをはる

    vec4 ao = computeAO(p, n);
    baseColor += ao.xyz;
  } else if (m == 1.) {
    // cubeのライティング
    // とくにライトは考慮せず、色相間を時間でずらして色をつける
    baseColor = matGlow(p) * 5.;
  }
  vec3 objColor = baseColor * lightColor;
  return objColor;
}

void main() {
  mainLightDir = normalize(vec3(-0.5, -1, -2));
  mainLightColor = normalize(vec3(1.1, 1.2, 1)) * 0.5;
  ambientColor = normalize(vec3(1.)) * 0.7;

  vec2 xy = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

  float yaw = time * 0.5;
  float pitch = -PI * 0.2;
  vec3 lookAt = vec3(0., 2., 0.);
  vec3 lookDir = vec3(0., 0., -1.);
  lookDir.zy = rotate(lookDir.zy, pitch);
  lookDir.xz = rotate(lookDir.xz, yaw);
  float lookDist = 8.0 + ucos(time) * 25.0;
  vec3 camPos = lookAt - lookDir * lookDist;
  vec3 o = camPos;
  vec3 d = normalize(vec3(xy.x, xy.y, -1.5));
  d.zy = rotate(d.zy, pitch);
  d.xz = rotate(d.xz, yaw);

  float tmin = TMIN;
  float tmax = TMAX;
  float t = tmin;
  vec2 trace;
  float thres = 0.;

  // マーチングループ
  for (int i=0; i<STEPS; i++) {
    thres = PREC_MULT * t;
    vec3 pos = o + d * t;
    trace = map(pos);
    float dist = trace.x;// 最短距離
    if (dist < thres || t > tmax) {
      break;
    }
    t += dist * 0.6;// レイの進行距離
  }

  vec3 color = vec3(0.);
  if (t<tmax) {
    // レイがオブジェクトに衝突したのでライティングを計算する
    color = shade(o, d, t, trace.y);
  }

  fragColor = vec4(color, 1.0);

}
