#version 300 es
precision mediump float;

//#define rotate(angle) mat2(cos(angle), sin(angle), sin(-angle), cos(angle))

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 fragColor;

#define FLOAT_MAX 3.402823466e+38
#define MAX_DIST 1000.
#define EPS 0.0001

const vec3 worldUp = vec3(0.0, 1.0, 0.0);
const vec3 baseColor = vec3(0.1, 1.0, 0.1);

const float boxSize = 0.75;

struct Distance {
  float dist;
  float boxDist;
  vec3 rayPosition;
  int materialId;
};

vec3 hsv2rgb(vec3 hsv) {
  return ((clamp(abs(fract(hsv.x+vec3(0,2,1)/3.)*6.-3.)-1.,0.,1.)-1.)*hsv.y+1.)*hsv.z;
}

mat2 rotate(float angle) {
  return mat2(cos(angle), sin(angle), sin(-angle), cos(angle));
}

Distance minDistance(Distance a, Distance b) {
  // TODO step
  if(a.dist < b.dist) {
    return a;
  } else {
    return b;
  }
}

vec4 minVec4(vec4 a, vec4 b) {
  return (a.a < b.a) ? a : b;
}

float sdBox(vec3 p, float r) {
  p.y -= 1.;
  p.yz *= rotate(time);
  p.xz *= rotate(time);

  return length(max(abs(p) - vec3(r), 0.0));
}

float sdFloor(vec3 p) {
  return dot(p, vec3(0.0, 1.0, 0.0)) + 1.0;
}

Distance map(vec3 p) {
  Distance floorDistance;
  floorDistance.dist = sdFloor(p);
  floorDistance.materialId = 1;

  Distance boxDistance;
  boxDistance.dist = sdBox(p, boxSize);
  boxDistance.materialId = 0;

  Distance minDist = minDistance(boxDistance, floorDistance);
  minDist.boxDist = boxDistance.dist;
  return minDist;
}

Distance raymarching(vec3 origin, vec3 dir) {
  float minDist = 0.;
  float rayDistance = 0.;
  float minBoxDist = FLOAT_MAX;
  Distance distance;

  for(int i=0; i<100; i++) {
    vec3 p = origin + dir * rayDistance;
    distance = map(p);
    distance.rayPosition = p;

    if(distance.boxDist < minBoxDist) {
      minBoxDist = distance.boxDist;
    }

    if(abs(distance.dist) < EPS) {
      distance.boxDist = minBoxDist;
      return distance;
    }

    rayDistance += distance.dist;

    if(rayDistance > MAX_DIST) {
      distance.boxDist = minBoxDist;
      return distance;
    }
  }

  distance.boxDist = minBoxDist;
  return distance;
}

vec3 mapNormal(vec3 p) {
  return normalize(vec3(
  map(vec3(p.x + EPS, p.y, p.z)).dist - map(vec3(p.x - EPS, p.y, p.z)).dist,
  map(vec3(p.x, p.y + EPS, p.z)).dist - map(vec3(p.x, p.y - EPS, p.z)).dist,
  map(vec3(p.x, p.y, p.z  + EPS)).dist - map(vec3(p.x, p.y, p.z - EPS)).dist
  ));
}

vec3 getBoxColor() {
  return hsv2rgb(vec3(sin(time/4.), .85, .95));
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

vec3 reflectColor(Distance distance) {
  vec3 reflectionCol = vec3(0.);
  vec3 normal = mapNormal(distance.rayPosition);

  for(int i=0; i<3; i++) {
    vec3 rayPos = distance.rayPosition + normal * 0.3 * float(i);
    // 箱との距離を図る
    float boxDistance = sdBox(rayPos, boxSize);

    reflectionCol += pow(max(0.0, 1.0 - boxDistance / 3.0), 4.0) * .5 * getBoxColor();
  }
  return reflectionCol;
}

// box - emissive
// floor - texture + reflection + bloom
// none - bloom

vec3 sceneColor(Distance distance) {
  vec3 col = vec3(1.0);
  // material box:0 floor:1
  // box or floorを判定する
  // box - 色を付ける
  if(distance.materialId == 0) {
    col = getBoxColor();
  }

  // floor -
  // レイの衝突位置からチェッカーの色を計算
  // 衝突点から法線方向にレイを伸ばし、箱との距離を計算する
  // 箱との距離に応じて箱の色を重ねる
  // これを3回繰り返す
  if(distance.materialId == 1) {
    col = vec3(checkerPattern(distance.rayPosition)) * 0.05;
    col += reflectColor(distance);
  }

  return col;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

  vec3 cameraPos = vec3(0.0, 2.75, -3.75);
  vec3 lookAt = vec3(0.0);

  vec3 forward = normalize(lookAt - cameraPos);
  vec3 right = normalize(cross(worldUp, forward));
  vec3 up = normalize(cross(forward, right));

  vec3 intersection = cameraPos + forward + uv.x*right + uv.y*up;
  vec3 rayDirection = normalize(intersection - cameraPos);

  Distance marchingResult = raymarching(cameraPos, rayDirection);

  vec3 color = vec3(0.0);

  if(abs(marchingResult.dist) < EPS ) {
    color = sceneColor(marchingResult);
  }

  vec3 bloom = getBoxColor() * pow(marchingResult.boxDist + 1.5, -2.5);
  color += bloom;

  fragColor = vec4(color, 1.0);
}
