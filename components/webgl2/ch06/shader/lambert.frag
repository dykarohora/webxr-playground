#version 300 es
precision mediump float;

uniform vec4 uMaterialAmbient;
uniform vec4 uMaterialDiffuse;
uniform bool uWireframe;

uniform bool uLightSource;
uniform vec4 uLightAmbient;

uniform vec4 uDiffuseRedLight;
uniform vec4 uDiffuseGreenLight;
uniform float uCutOff;

in vec3 vNormal;
in vec3 vRedRay;
in vec3 vGreenRay;
in vec4 vFinalColor;

out vec4 fragColor;

void main() {
  if(uWireframe || uLightSource) {
    fragColor = uMaterialDiffuse;
  } else {
    vec4 Ia = uLightAmbient * uMaterialAmbient;
    vec4 Id1 = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 Id2 = vec4(0.0, 0.0, 0.0, 1.0);

    // 正規化する
    vec3 N = normalize(vNormal);

    // それぞれのライトについてランバート反射を計算する
    float lambertTermOne = dot(N, -normalize(vRedRay));
    float lambertTermTwo = dot(N, -normalize(vGreenRay));

    // 閾値以上ならそれぞれのdiffuseを計算する
    if(lambertTermOne > uCutOff) {
      Id1 = uDiffuseRedLight * uMaterialDiffuse * lambertTermOne;
    }

    if(lambertTermTwo > uCutOff) {
      Id2 = uDiffuseGreenLight * uMaterialDiffuse * lambertTermTwo;
    }

    // 重ねる
    fragColor = vec4(vec3(Ia + Id1 + Id2), 1.0);
  }
}
