uniform sampler2D diffuse;
varying vec2 vTexCoord;

vec4 fragment_main() {
  return texture2D(diffuse, vTexCoord);
}
