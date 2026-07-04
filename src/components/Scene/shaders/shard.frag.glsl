uniform float uRim;
uniform vec3 uEmber;

varying vec3 vWorldNormal;
varying vec3 vViewDir;

void main() {
  float fresnel = pow(1.0 - clamp(dot(normalize(vViewDir), normalize(vWorldNormal)), 0.0, 1.0), 3.0);
  csm_Emissive = uEmber * fresnel * uRim;
  csm_DiffuseColor.rgb = mix(csm_DiffuseColor.rgb, uEmber * 0.25, fresnel * uRim * 0.4);
}
