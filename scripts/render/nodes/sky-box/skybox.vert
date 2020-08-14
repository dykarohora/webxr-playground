uniform int EYE_INDEX;
uniform vec4 texCoordScaleOffset[2];
attribute vec3 POSITION;
attribute vec2 TEXCOORD_0;
varying vec2 vTexCoord;

vec4 vertex_main(mat4 proj, mat4 view, mat4 model) {
  vec4 scaleOffset = texCoordScaleOffset[EYE_INDEX];
  vTexCoord = (TEXCOORD_0 * scaleOffset.xy) + scaleOffset.zw;
  // Drop the translation portion of the view matrix
  view[3].xyz = vec3(0.0, 0.0, 0.0);
  vec4 out_vec = proj * view * model * vec4(POSITION, 1.0);

  // Returning the W component for both Z and W forces the geometry depth to
  // the far plane. When combined with a depth func of LEQUAL this makes the
  // sky write to any depth fragment that has not been written to yet.
  return out_vec.xyww;
}
