#version 300 es
precision mediump float;
#define SPHERE_AMOUNT 14.

// Determines how quickly the camera moves through space.
#define MOVEMENT_SPEED 4.

// Determines how long it takes before the spectrum repeats itself.
// Values between [0, 1] make it go faster, values larger than 1 make it go slower.
#define SPECTRUM_SPEED 4.

// Determines how often colours repeat. Larger values will show more coloured 'stripes'.
#define SPECTRUM_REPETITION 2.

// All lights will spawn between [-interval, interval] on the x and y-axes.
#define INTERVAL 40.

// Repetition period per axis. Set to 0 for no repetitions.
// This case means repetition on the y and z axes.
#define REPEAT vec3(0., 5., 5.)

#define MAX_STEPS 50
#define MAX_DIST 1000.
#define SURF_DIST .02
#define Z_PLANE 15.
#define FLOAT_MAX 3.402823466e+38
#define WORLD_UP vec3(0., 1., 0.)
#define WHITE vec3(1.)

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 fragColor;

vec2 hash21(float p)
{
  vec3 p3 = fract(vec3(p) * vec3(.2602, .0905, .2019));
  p3 += dot(p3, p3.yzx + 19.98);
  return fract((p3.xx + p3.yz) * p3.zy);
}


float GetSphereDist(vec3 p) {
  float radius = (sin(time/6.) + 1.1) * .09;
  float minDist = FLOAT_MAX;

  for (float i=0.; i<SPHERE_AMOUNT; i++) {
    vec3 pos = vec3(hash21(i), Z_PLANE);
    pos.xy = pos.xy * INTERVAL * 2. - INTERVAL;
    vec3 repeater = mod(p - pos, REPEAT) - 0.5 * REPEAT;
    float dist = length(repeater) - radius;

    if (dist < minDist) {
      minDist = dist;
    }
  }

  return minDist;
}

// origin - カメラポジション
// direction - レイベクトル
vec4 RayMarch(vec3 origin, vec3 direction) {
  float distance = 0.;// レイの進行距離
  float closest = FLOAT_MAX;//
  vec2 closestPoint = vec2(0.);//

  for (int i=0; i<MAX_STEPS; i++) {
    // レイの伸ばしていくのはかわららない
    vec3 p = origin + direction * distance;
    float sphereDistnace = GetSphereDist(p);
    distance += sphereDistnace;

    // マーチングループの中での最短距離をキャッシュしておく
    // 最短地点のxy座標もキャッシュしておく
    if (sphereDistnace < closest) {
      closest = sphereDistnace;
      closestPoint = p.xy;
    }

    // レイの進行距離が一定数に到達したらreturn
    if (distance > MAX_DIST) {
      return vec4(-1., closest, closestPoint);
    }

    // レイが衝突の閾値に到達したらreturn
    if (sphereDistnace < SURF_DIST) {
      return vec4(distance, 0., closestPoint);
    }
  }

  return vec4(-1., closest, closestPoint);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

  vec3 cameraPos = vec3(0., 1., time * MOVEMENT_SPEED);

  float t = time / 4.;
  vec3 look = cameraPos * vec3(cos(t), sin(t), 3.);

  vec3 forward = normalize(look - cameraPos);
  vec3 right = normalize(cross(WORLD_UP, forward));
  vec3 up = normalize(cross(forward, right));

  vec3 intersection = cameraPos + forward + uv.x*right + uv.y*up;
  vec3 cameraDir = normalize(intersection - cameraPos);

  vec4 rayMarch = RayMarch(cameraPos, cameraDir);
  float distance = rayMarch.x;

  if (distance == -1.) {
    // bloomを計算する
    // レイがもっともオブジェクトに近づいた地点(xy平面)
    vec2 xy = rayMarch.zw;
    // 正規化
    xy = (xy + INTERVAL) / (2. * INTERVAL);

    float closest = rayMarch.y;
    vec3 bloom = vec3(0.5, 0.1, 0.2) * pow(closest + 1., -1.0);

    fragColor = vec4(bloom, 1.);
  } else {
    // 衝突していたら白くしておく
    fragColor = vec4(WHITE, 1.);
  }
}
