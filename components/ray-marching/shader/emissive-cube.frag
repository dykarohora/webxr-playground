#version 300 es
precision mediump float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 fragColor;

#define FLOAT_MAX 3.402823466e+38
#define MAX_DIST 1000.

const vec3 worldUp = vec3(0.0, 1.0, 0.0);
const vec3 baseColor = vec3(0.1, 1.0, 0.1);

mat2 rotate(float angle) {
return mat2(cos(angle), sin(angle), sin(-angle), cos(angle));
}

// vec4の第四成分を見て、値が小さい方のvec4を返す
vec4 minVec4(vec4 a, vec4 b) {
  return (a.a < b.a) ? a : b;
}

float sdBox(vec3 p, float r) {
  p.y -= 0.5;
  p.yz *= rotate(time);
  p.xz *= rotate(time);

  return length(max(abs(p) - vec3(r), 0.0));
}

float sdFloor(vec3 p) {
  return dot(p, vec3(0.0, 1.0, 0.0)) + 1.0;
}

float map(vec3 p, out float boxDistance) {
  float distanceBox = sdBox(p, 0.75);
  boxDistance = distanceBox;

  float distanceFloor = sdFloor(p);
  return min(distanceBox, distanceFloor);
}

// レイの進行距離と最短距離を返す
vec3 rayMarching(vec3 origin, vec3 direction, out vec3 p) {
  float distance = 0.;
  float closestBox = FLOAT_MAX;
  float boxDist;

  for (int i=0; i<100; i++) {
    p = origin + direction * distance;
    float mapDistance = map(p, boxDist);
    distance += mapDistance;

    if (boxDist < closestBox) {
      closestBox = boxDist;
    }

    if (distance > MAX_DIST) {
      // レイは遠くに飛んで行った
      return vec3(distance, closestBox, 0.);
    }

    if (abs(mapDistance) < 0.001) {
      // レイは衝突した
      return vec3(distance, closestBox, 1.);
    }
  }

  return vec3(distance, closestBox, 0.);
}

float checkerPattern(vec3 p) {
  float u = 1.0 - floor(mod(p.x, 2.0));
  float v = 1.0 - floor(mod(p.z, 2.0));

  if((u == 1.0 && v < 1.0) || (u < 1.0 && v == 1.0)) {
    return 0.2;
  } else {
    return 1.0;
  }
}

vec3 sceneColor(vec3 p) {
  vec3 color = minVec4(
    vec4(vec3(baseColor), sdBox(p, 0.75)),
    vec4(vec3(0.5) * checkerPattern(p), sdFloor(p))
  ).rgb;
  return color;
}


void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

  vec3 cameraPos = vec3(0.0, 2.5, -5.0);
  vec3 lookAt = vec3(0.0);

  vec3 forward = normalize(lookAt - cameraPos);
  vec3 right = normalize(cross(worldUp, forward));
  vec3 up = normalize(cross(forward, right));

  vec3 intersection = cameraPos + forward + uv.x*right + uv.y*up;
  vec3 cameraDir = normalize(intersection - cameraPos);

  vec3 hit;
  vec3 rayMarchResult = rayMarching(cameraPos, cameraDir, hit);

  float distance = rayMarchResult.x;
  float closest = rayMarchResult.y;
  float matId = rayMarchResult.z;


  // 色を返す方針
  // 1. 衝突したのがcubeならbaseColor
  // 2. 衝突したのがfloorならテクスチャ+ bloom + boxの反射光
  // 3. 衝突していないならbloom

  vec3 color = vec3(0.);

  if(matId == 1.) {
    // カラーを計算
    color = sceneColor(hit);
  }

  // bloomを計算
  vec3 bloom = baseColor * pow(closest + 1., -2.5);

  color += bloom;
  fragColor = vec4(color, 1.);
}
