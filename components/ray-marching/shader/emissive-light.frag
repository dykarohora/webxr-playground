#version 300 es
precision highp float;

#define EPS 0.0001
#define PI 3.14159265359
#define FLT_MAX 3.402823466e+38
#define FLT_MIN 1.175494351e-38
#define DBL_MAX 1.7976931348623158e+308
#define DBL_MIN 2.2250738585072014e-308

uniform float time;
uniform vec2 mouse;// 0-1の範囲でマウス座標が渡される、ただし左上が原点
uniform vec2 resolution;// ウィンドウの解像度

out vec4 fragColor;

const int maxIterations = 64;
const float stepScale = 1.;
const float stopThreshold = .005;

float fov = .6;
float nearClip = 0.;
float farClip = 80.;

struct Surface {
  float dist;
  vec3 position;
  vec3 baseColor;
  vec3 normal;
  vec3 emissiveColor;
};

struct Hit {
  Surface sufrace;
  Surface near;
};

struct Light {
  vec3 position;
  float intensity;
  vec3 color;
};

float invert(float m) {
  return 1.0 / m;
}

mat2 invert(mat2 m) {
  return mat2(m[1][1], -m[0][1],
  -m[1][0], m[0][0]) / (m[0][0]*m[1][1] - m[0][1]*m[1][0]);
}

mat3 invert(mat3 m) {
  float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];
  float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];
  float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];

  float b01 = a22 * a11 - a12 * a21;
  float b11 = -a22 * a10 + a12 * a20;
  float b21 = a21 * a10 - a11 * a20;

  float det = a00 * b01 + a01 * b11 + a02 * b21;

  return mat3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11),
  b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10),
  b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) / det;
}

mat4 invert(mat4 m) {
  float
  a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
  a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
  a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
  a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],

  b00 = a00 * a11 - a01 * a10,
  b01 = a00 * a12 - a02 * a10,
  b02 = a00 * a13 - a03 * a10,
  b03 = a01 * a12 - a02 * a11,
  b04 = a01 * a13 - a03 * a11,
  b05 = a02 * a13 - a03 * a12,
  b06 = a20 * a31 - a21 * a30,
  b07 = a20 * a32 - a22 * a30,
  b08 = a20 * a33 - a23 * a30,
  b09 = a21 * a32 - a22 * a31,
  b10 = a21 * a33 - a23 * a31,
  b11 = a22 * a33 - a23 * a32,

  det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  return mat4(
  a11 * b11 - a12 * b10 + a13 * b09,
  a02 * b10 - a01 * b11 - a03 * b09,
  a31 * b05 - a32 * b04 + a33 * b03,
  a22 * b04 - a21 * b05 - a23 * b03,
  a12 * b08 - a10 * b11 - a13 * b07,
  a00 * b11 - a02 * b08 + a03 * b07,
  a32 * b02 - a30 * b05 - a33 * b01,
  a20 * b05 - a22 * b02 + a23 * b01,
  a10 * b10 - a11 * b08 + a13 * b06,
  a01 * b08 - a00 * b10 - a03 * b06,
  a30 * b04 - a31 * b02 + a33 * b00,
  a21 * b02 - a20 * b04 - a23 * b00,
  a11 * b07 - a10 * b09 - a12 * b06,
  a00 * b09 - a01 * b07 + a02 * b06,
  a31 * b01 - a30 * b03 - a32 * b00,
  a20 * b03 - a21 * b01 + a22 * b00) / det;
}

mat4 scale(vec3 s) {
  return invert(mat4(
  s.x, 0., 0., 0.,
  0., s.y, 0., 0.,
  0., 0., s.z, 0.,
  0., 0., 0., 1.
  ));
}

mat4 rotateX(float angle) {
  return invert(mat4(
  1., 0., 0., 0.,
  0., cos(angle), -sin(angle), 0.,
  0., sin(angle), cos(angle), 0.,
  0., 0., 0., 1.
  ));
}

mat4 rotateY(float angle) {
  return invert(mat4(
  cos(angle), 0., sin(angle), 0.,
  0., 1., 0., 0.,
  -sin(angle), 0., cos(angle), 0.,
  0., 0., 0., 1.
  ));
}

mat4 rotateZ(float angle) {
  return invert(mat4(
  cos(angle), -sin(angle), 0., 0.,
  sin(angle), cos(angle), 0., 0.,
  0., 0., 1., 0.,
  0., 0., 0., 1.
  ));
}

mat4 translate(vec3 p) {
  return invert(mat4(
  1., 0., 0., p.x,
  0., 1., 0., p.y,
  0., 0., 1., p.z,
  0., 0., 0., 1.
  ));
}

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float box(vec3 p, vec3 size) {
  vec3 d = abs(p) - size;
  return length(max(d, 0.)) + min(max(d.x, max(d.y, d.z)), 0.);
}

float scene(vec3 p) {
  float d1 = sdSphere((vec4(p, 1.) * translate(vec3(-.7, 0., 0.))).xyz, .5);
  float d2 =box((vec4(p, 1.) * translate(vec3(.7, 0., 0.))).xyz, vec3(.45));

  p.x = cos(time*1.6)*2.0;
  p.z = sin(time*1.6)*2.0;

  float d3 = sdSphere(p, 1.0);
  return min(d3,min(
  d1, d2
  ));
}

// origin - レイの始点
// dir - レイの向き
// start - ニアクリップ
// end - ファークリップ
Hit rayMarching(vec3 origin, vec3 dir, float start, float end) {
  Surface cs;
  cs.dist = -1.;

  Surface ns;
  ns.dist = FLT_MAX;

  Hit hit;

  float sceneDist = 0.;
  float rayDepth = start;

  for (int i=0; i<maxIterations; i++) {
    sceneDist = scene(origin + dir * rayDepth);

    if (sceneDist < ns.dist) {
      ns.dist = sceneDist;// オブジェクトまでの最短距離をキャッシュ
    }

    if ((sceneDist < stopThreshold) || (rayDepth >= end)) {
      break;
    }
    rayDepth += sceneDist * stepScale;// レイの進行距離を更新
    cs.dist = rayDepth;// レイの進行距離をキャッシュ
  }

  // 最短距離が衝突判定の閾値以上ならば、レイの進行距離はファークリップ
  if (sceneDist >= stopThreshold) {
    rayDepth = end;
  }

  cs.dist = rayDepth;// レイの進行距離
  hit.sufrace = cs;
  hit.near = ns;

  return hit;
}

vec3 getNormal(vec3 p) {
  const float e = EPS;
  return normalize(vec3(
  scene(p + vec3(e, 0.0, 0.0)) - scene(p + vec3(-e, 0.0, 0.0)),
  scene(p + vec3(0.0, e, 0.0)) - scene(p + vec3(0.0, -e, 0.0)),
  scene(p + vec3(0.0, 0.0, e)) - scene(p + vec3(0.0, 0.0, -e))
  ));
}

float getSpecular(vec3 position, vec3 normal, Light light, float diffuse, vec3 cameraPos) {
  vec3 lightDir = light.position - position;
  vec3 ref = reflect(-normalize(lightDir), normal);
  float specular = 0.;
  if (diffuse > 0.) {
    specular = max(0., dot(ref, normalize(cameraPos - normal)));
    float specularPower = 32.;
    specular = pow(specular, specularPower) * light.intensity;
  }
  return specular;
}

vec3 lighting(Surface surface, vec3 cameraPos) {
  vec3 position = surface.position;

  vec3 color = vec3(0.);
  vec3 sceneColor = vec3(0.);
  vec3 normal = getNormal(position);// 衝突点の法線

  vec3 objColor = vec3(.4, .4, .4);
  vec3 specularColor = vec3(.6, .6, .6);

  Light directionalLight;
  directionalLight.position = vec3(5., 5., 5.);
  directionalLight.intensity = .8;
  directionalLight.color = vec3(.4, .4, .4);

  Light pointLight;
  pointLight.position = vec3(5., 5., 5.);
  pointLight.intensity = .8;
  pointLight.color = vec3(.5, .5, .5);

  Light ambientLight;
  ambientLight.color = vec3(.1, .1, .1);
  ambientLight.intensity = .3;

  // directionalLightのdiffuseとspecular
  float dDiffuse = max(0., dot(normal, normalize(directionalLight.position)));
  dDiffuse *= directionalLight.intensity;
  vec3 dDiffuseColor = dDiffuse * directionalLight.color * objColor;
  float dSpecular = getSpecular(position, normal, directionalLight, dDiffuse, cameraPos);
  vec3 dSpecularColor = dSpecular * specularColor;

  // pointLight
  vec3 pLightDir = pointLight.position - position;
  float pDiffuse = max(0., dot(normal, normalize(pLightDir)));
  vec3 pDiffuseColor = pDiffuse * pointLight.color * objColor;
  float d = distance(pointLight.position, position);
  vec3 k = vec3(.05, .9, .06);
  float attenuation = 1. / (k.x + (k.y * d), (k.z * d * d));
  pDiffuse *= pointLight.intensity;
  pDiffuse *= attenuation;// 距離に応じて
  float pSpecular = getSpecular(position, normal, pointLight, pDiffuse, cameraPos);
  pSpecular *= attenuation;
  vec3 pSpecularColor = pSpecular * specularColor;

  vec3 diffuse = dDiffuseColor + pDiffuseColor;
  vec3 specular = dSpecularColor + pSpecularColor;

  // TODO AO

  color += objColor * diffuse + specular;
  return color;
}

// orogin - 視線方向
// ray - レイの方向
// point - ライトの位置
float distanceToLine(vec3 origin, vec3 dir, vec3 point) {

  vec3 pointToOrigin = point - origin;
  float pointToOriginLength = length(pointToOrigin);
  vec3 pointToOriginNorm = normalize(pointToOrigin);

  float theta = dot(dir, pointToOriginNorm);

  return pointToOriginLength * sqrt(1. - theta * theta);
}

// light - Lightオブジェクト
// Surface - 衝突点の位置や法線情報が入っている
// rayOrigin - rayの発射地点
// rayDirection - レイの方向
vec3 emissiveLight(Light light, Surface surface, vec3 rayOrigin, vec3 rayDirection) {
  // 視線方向
  vec3 eyeDirection = rayOrigin + rayDirection;
  float lightEmissive = pow(distanceToLine(eyeDirection, rayDirection, light.position) + .95, -2.);

  // 衝突点の法線と、衝突点から光源のベクトルの内積をとる
  // 衝突していなければ、surface.positionはfarclip
  float c = dot(surface.normal, normalize(light.position - surface.position));
  c = clamp(c, 0., 1.);
  float em = 0.;

  em = c + (1. - c) * step(farClip, surface.dist);

  return lightEmissive * light.color * light.intensity * em;
}

vec3 emissiveLighting(Surface surface, vec3 rayOrigin, vec3 rayDirection) {
  Light pointLightRed;
  pointLightRed.color = vec3(1., .1, .1);
  pointLightRed.intensity = 1.;
  pointLightRed.position = vec3(cos(time * 1.4) * 2., sin(time * 1.4) * 2., 0.);

  Light pointLightGreen;
  pointLightGreen.color = vec3(.4, 1., .4);
  pointLightGreen.intensity = 1.;
  pointLightGreen.position = vec3(cos(time * 1.6) * 2., 0., sin(time * 1.6) * 2.);

  Light pointLightBlue;
  pointLightBlue.color = vec3(.1, .1, 1.);
  pointLightBlue.intensity = 1.;
  pointLightBlue.position = vec3(0., sin(time * 1.8) * 2., cos(time * 1.8) * 2.);


  vec3 color = vec3(0.);
    color += emissiveLight(pointLightRed, surface, rayOrigin, rayDirection);
  color += emissiveLight(pointLightGreen, surface, rayOrigin, rayDirection);
    color += emissiveLight(pointLightBlue, surface, rayOrigin, rayDirection);

  return color;
}


void main() {
  vec2 screenCoord = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

  // camera
  vec3 lookAt = vec3(0.0);
  vec3 cameraPos = vec3(1., 1., 15.);

  vec3 forward = normalize(lookAt - cameraPos);
  vec3 right = normalize(cross(forward, vec3(0., 1., 0.)));
  vec3 up = normalize(cross(right, forward));

  // raymarch
  vec3 rayOrigin = cameraPos;
  vec3 rayDirection = normalize(forward + fov * screenCoord.x * right + fov * screenCoord.y * up);
  Hit hit = rayMarching(rayOrigin, rayDirection, nearClip, farClip);

  // この時点ではマーチングループを実行した結果のレイの進行距離とオブジェクトまでの最短距離がセットされているだけ
  Surface surface = hit.sufrace;
  Surface near = hit.near;

  // レイの衝突点の座標をセットする
  surface.position = rayOrigin + rayDirection * surface.dist;

  vec3 sceneColor = vec3(0.);

  if (surface.dist >= farClip) {
    // レイがヒットしなかった
    vec3 bgColor = vec3(0.);
    sceneColor = vec3(0.);
  } else {
    // レイがヒットした
    sceneColor += lighting(surface, cameraPos);
  }

  surface.normal = getNormal(surface.position);
  sceneColor += emissiveLighting(surface, rayOrigin, rayDirection);

  fragColor = vec4(sceneColor, 1.);
}
