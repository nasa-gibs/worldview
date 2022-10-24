precision mediump float;

uniform sampler2D u_wind;
uniform vec2 u_wind_min;
uniform vec2 u_wind_max;
uniform sampler2D u_color_ramp;

varying vec2 v_particle_pos;
float min = 0.01;
void main() {
    vec2 velocity = mix(u_wind_min, u_wind_max, texture2D(u_wind, v_particle_pos).rg);
    float speed_t = length(velocity) / length(u_wind_max);

    // color ramp is encoded in a 16x16 texture
    if(abs(speed_t) < min) {
        gl_FragColor = vec4(255.0, 255.0, 255.0, 0.0);
    } else {
        vec2 ramp_pos = vec2(
        fract(16.0 * speed_t),
        floor(16.0 * speed_t) / 16.0);
        // gl_FragColor = vec4(255.0, 255.0, 255.0, 255.0);
        gl_FragColor = texture2D(u_color_ramp, ramp_pos);
    }
}
