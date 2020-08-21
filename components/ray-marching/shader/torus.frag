#version 300 es
precision mediump float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 fragColor;

const float PI = 3.14159265;
const float angle = 60.0;
const float fov = angle * 0.5 * PI / 180.0;

float smoothMin(float d1, float d2, float k) {
  float h = exp(-k*d1) + exp(-k*d2);
  return -log(h)/k;
}

float distFuncBox(vec3 p) {
  return length(max(abs(p) - vec3(2.0, 0.1, 0.5), 0.0)) - 0.1;
}

float distFuncTorus(vec3 p) {
  vec2 t = vec2(1.5, 0.25);
  vec2 r = vec2(length(p.xy) - t.x, p.z);
  return length(r) - t.y;
}

float distanceFunc(vec3 p) {
  float d1 = distFuncTorus(p);
  float d2 = distFuncBox(p);
  return smoothMin(d1, d2, 8.0);
}

vec3 getNormal(vec3 p) {
  float d = 0.0001;
  return normalize(vec3(
  distanceFunc(p + vec3(d, 0.0, 0.0)) - distanceFunc(p + vec3(-d, 0.0, 0.0)),
  distanceFunc(p + vec3(0.0, d, 0.0)) - distanceFunc(p + vec3(0.0, -d, 0.0)),
  distanceFunc(p + vec3(0.0, 0.0, d)) - distanceFunc(p + vec3(0.0, 0.0, -d))
  )
  );
}

void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

  vec3 cPos = vec3(-3.0, 3.0, 3.0);
  vec3 cDir = normalize(vec3(1, -1, -1));
  vec3 cUp = normalize(vec3(1, 1, -1));

  vec3 cSide = cross(cDir, cUp);
  float targetDepth = 1.0;
  vec3 ray = normalize(cSide*p.x + cUp*p.y + cDir*targetDepth);


  float distance = 0.0;
  float rLen = 0.0;
  vec3 rPos = cPos;

  for (int i=0; i<32; i++) {
    distance = distanceFunc(rPos);
    rLen += distance;
    rPos = cPos + ray * rLen;
  }

  if (abs(distance) < 0.0001) {
    vec3 lightDir = normalize(vec3(sin(time), cos(time) * 0.5, 0.5));
    vec3 normal = getNormal(rPos);
    float diffuse = clamp(dot(normal, lightDir), 0.2, 1.0);
    fragColor = vec4(vec3(diffuse), 1.0);
  } else {
    fragColor = vec4(vec3(0.0), 1.0);
  }
}
