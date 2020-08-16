#version 300 es
precision mediump float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 fragColor;

const float sphereSize = 0.5;
const vec3 lightDir = normalize(vec3(-1.0, 2.0, 1.0));

const float PI = 3.14159265;
const float angle = 60.0;
const float fov = angle * 0.5 * PI / 180.0;

float sphere(vec3 p) {
  return length(p) - sphereSize;
}

float box(vec3 p) {
  return length(max(abs(p) - vec3(0.1, 0.5, 0.5), 0.0)) - 0.1;
}

float distanceFunc(vec3 p) {
  float d1 = sphere(p);
  float d2 = box(p);
  return min(d1, d2);
}

vec3 getNormal(vec3 p) {
  float d = 0.0001;
  return normalize(vec3(
  distanceFunc(p + vec3(d, 0.0, 0.0)) - distanceFunc(p + vec3(-d, 0.0, 0.0)),
  distanceFunc(p + vec3(0.0, d, 0.0)) - distanceFunc(p + vec3(0.0, -d, 0.0)),
  distanceFunc(p + vec3(0.0, 0.0, d)) - distanceFunc(p + vec3(0.0, 0.0, -d))
  ));
}

void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

  vec3 cPos = vec3(-cos(time / 10.0), sin(time / 10.0), 3.0);

  vec3 ray = normalize(vec3(sin(fov) * p.x, sin(fov) * p.y, -cos(fov)));

  float distance = 0.0;
  float rLen = 0.0;
  vec3 rPos = cPos;

  for (int i=0; i<64; i++) {
    distance = distanceFunc(rPos);
    rLen += distance;
    rPos = cPos + ray * rLen;
  }

  if (abs(distance) < 0.0001) {
    vec3 normal = getNormal(rPos);
    float diffuse = clamp(dot(normal, lightDir), 0.1, 1.0);
    fragColor = vec4(vec3(diffuse), 1.0);
  } else {
    fragColor = vec4(vec3(0), 1.0);
  }
}
