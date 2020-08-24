#version 300 es
precision mediump float;


uniform float time;
uniform vec2 mouse;// 0-1の範囲でマウス座標が渡される、ただし左上が原点
uniform vec2 resolution;// ウィンドウの解像度

out vec4 fragColor;

mat2 rotate(float angle) {
return mat2(cos(angle), sin(angle), sin(-angle), cos(angle));
}

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdBox(vec3 p, float r) {
  return length(max(abs(p) - vec3(r), 0.0));
}

float mat = 0.0;
float glow = 0.0;

// 原点にある球、その距離関数
float map(vec3 p, bool shadow) {
  p.yz *= rotate(time);
  p.xz *= rotate(time);

  // 厚みのある中身が空洞の球
  // 最後のfloatは厚さを決めるパラメータ
  float d = abs(sdSphere(p, 1.0)) - 0.01;

  vec3 rp = p;// レイポジション
  // foldを使い小さい球をたくさん作る
  for (int i=0; i<4; ++i) {
    rp = abs(rp) - 0.2;
  }
  float d1 = sdSphere(rp, 0.15);
  // 球からfoldでBOX上に5段ならべた小球を差っ引く
  d = max(d, -d1);
  // 大きな空洞球を作って包み込むようにする
  float d3 = abs(sdSphere(p, 4.0) - 0.1);
  d = min(d, d3);

  // 影を描画するときは
  if (shadow) {
    return d;
  }

  // 中心に小さな球を配置している
  float d2 = sdSphere(p, 0.1);
  glow += 0.01 / (0.01 + d2 * d2);
  // やっていることはmin(d, d2)
  // フラグを立てるため
  if (d < d2) {
    mat = 0.0;
    return d;
  } else {
    mat = 1.0;
    return d2;
  }
}

// r0 - レイの衝突点（レイポジション）
// ld - 光線ベクトル（レイポジションから光源へ）
float shadow(vec3 r0, vec3 rd, float maxDist) {
  float d = 0.05;
  float shadow = 1.0;

  while (d < maxDist) {
    // レイ衝突点から光線ベクトル方向への最短距離を計算する
    // 要はレイ衝突点からマーチングループを行う
    float t = map(r0 + d * rd, true);
    // レイが衝突したら影だった。黒く塗りつぶす。
    if (t < 0.01) return 0.0;
    // レイの伸び具合を更新する
    d+=t;
    // シャドウパラメータ
    // tが長いとshadowも大きく→暗くなる
    // tが小さいとshadowは小さく→明るくなる
    shadow = min(shadow, 60.0 * (t/d));
  }
  // レイがある一定以上だったら
  return shadow;
}

vec3 getNormal(vec3 p){
  float d = 0.0001;
  return normalize(vec3(
  map(p + vec3(d, 0.0, 0.0), false) - map(p + vec3(-d, 0.0, 0.0), false),
  map(p + vec3(0.0, d, 0.0), false) - map(p + vec3(0.0, -d, 0.0), false),
  map(p + vec3(0.0, 0.0, d), false) - map(p + vec3(0.0, 0.0, -d), false)
  ));
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);// 描画位置を-1〜1の範囲に正規化

  vec3 r0 = vec3(0.0, 2.4, 3.0);// カメラ位置
  vec3 tgt = vec3(0.0);
  // カメラ空間の基底ベクトル
  vec3 ww = normalize(tgt - r0);
  vec3 uu = normalize(cross(vec3(0.0, 1.0, 0.0), ww));
  vec3 vv = normalize(cross(ww, uu));

  vec3 rd = normalize(uv.x * uu + uv.y * vv + 0.95 * ww);

  vec3 col = vec3(0.0);

  float d = 0.0;
  vec3 p = r0;

  vec3 lp = vec3(0.0, 0.0, 0.0);// ライトポジション

  for (int i=0; i<100; i++) {
    p = r0 + d * rd;
    float t = map(p, false);
    d += t;

    if (abs(t) < 0.0001) {
      // 漏れ出した光を壁に？
      vec3 albedo = vec3(1.0);
      if (mat < 0.5) albedo = vec3(1.0, 0.0, 0.2);

      vec3 normal = getNormal(p);
      vec3 ld = normalize(lp - p);
      // ランバート
      vec3 diffuse = max(dot(normal, ld), 0.0) * vec3(0.4, 0.2, 0.8);
      // シャドウ
      float shad = shadow(p, ld, 8.0);
      col = diffuse * shad;
      break;
    }

    if (d>100.0) {
      break;
    }
  }

  const int numIter = 100;
  vec3 vD = rd;// レイベクトル
  // カメラから衝突地点の長さを100で割る
  float stepSize = length(p-r0)/float(numIter);
  // カメラから衝突方向へちょっと伸ばす
  vec3 vO = r0 + stepSize * vD;

  float accum = 0.0;
  for (int i=0; i<numIter; ++i) {
    vec3 ld = normalize(lp - vO);// カメラからライトポジションへのベクトル
    float shad = shadow(vO, ld, 4.0);
    float d = dot(vO, vO);
    accum += (0.01/d) * shad;
    vO += stepSize * vD;
  }

//  col += glow * vec3(0.4, 0.2, 0.8);
//  col += accum * vec3(0.4, 0.2, 0.8) * 16.0;

  fragColor = vec4(col, 1.0);
}

