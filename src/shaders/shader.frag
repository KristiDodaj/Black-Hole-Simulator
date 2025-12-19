#version 330 core
out vec4 FragColor;

uniform vec2 uResolution;
uniform vec3 uCamPos;
uniform vec3 uCamDir;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform float uTime;

const float M = 1.0;
const float PI = 3.14159265359;
const float R_HORIZON = 2.0 * M;
const float R_MAX = 100.0;
const int MAX_STEPS = 256;
const float STEP_SIZE = 0.1;

struct State {
    float t, r, th, ph;
    float dt, dr, dth, dph;
};

void get_derivs(State s, out float ddt, out float ddr, out float ddth, out float ddph) {
    float r = s.r;
    float th = s.th;
    float r_2M = r - 2.0 * M;
    float r2 = r * r;
    float r3 = r2 * r;
    float sinTh = sin(th);
    float cosTh = cos(th);
    float sin2Th = sinTh * sinTh;

    ddt = -2.0 * (M / (r * r_2M)) * s.dt * s.dr;

    float term_r_tt = (M * r_2M / r3) * s.dt * s.dt;
    float term_r_rr = -(M / (r * r_2M)) * s.dr * s.dr;
    float term_r_thth = -r_2M * s.dth * s.dth;
    float term_r_phph = -r_2M * sin2Th * s.dph * s.dph;
    ddr = -(term_r_tt + term_r_rr + term_r_thth + term_r_phph);

    float term_th_rth = (1.0 / r) * s.dr * s.dth;
    float term_th_phph = -sinTh * cosTh * s.dph * s.dph;
    ddth = -(2.0 * term_th_rth + term_th_phph);

    float term_ph_rph = (1.0 / r) * s.dr * s.dph;
    float term_ph_thph = (cosTh / sinTh) * s.dth * s.dph;
    ddph = -(2.0 * term_ph_rph + 2.0 * term_ph_thph);
}

void rk4_step(inout State s, float h) {
    float k1_dt, k1_dr, k1_dth, k1_dph;
    get_derivs(s, k1_dt, k1_dr, k1_dth, k1_dph);
    
    State s2 = s;
    s2.t += 0.5 * h * s.dt; s2.r += 0.5 * h * s.dr; s2.th += 0.5 * h * s.dth; s2.ph += 0.5 * h * s.dph;
    s2.dt += 0.5 * h * k1_dt; s2.dr += 0.5 * h * k1_dr; s2.dth += 0.5 * h * k1_dth; s2.dph += 0.5 * h * k1_dph;
    
    float k2_dt, k2_dr, k2_dth, k2_dph;
    get_derivs(s2, k2_dt, k2_dr, k2_dth, k2_dph);

    State s3 = s;
    s3.t += 0.5 * h * s2.dt; s3.r += 0.5 * h * s2.dr; s3.th += 0.5 * h * s2.dth; s3.ph += 0.5 * h * s2.dph;
    s3.dt += 0.5 * h * k2_dt; s3.dr += 0.5 * h * k2_dr; s3.dth += 0.5 * h * k2_dth; s3.dph += 0.5 * h * k2_dph;

    float k3_dt, k3_dr, k3_dth, k3_dph;
    get_derivs(s3, k3_dt, k3_dr, k3_dth, k3_dph);

    State s4 = s;
    s4.t += h * s3.dt; s4.r += h * s3.dr; s4.th += h * s3.dth; s4.ph += h * s3.dph;
    s4.dt += h * k3_dt; s4.dr += h * k3_dr; s4.dth += h * k3_dth; s4.dph += h * k3_dph;

    float k4_dt, k4_dr, k4_dth, k4_dph;
    get_derivs(s4, k4_dt, k4_dr, k4_dth, k4_dph);

    s.t += (h/6.0) * (s.dt + 2.0*s2.dt + 2.0*s3.dt + s4.dt);
    s.r += (h/6.0) * (s.dr + 2.0*s2.dr + 2.0*s3.dr + s4.dr);
    s.th += (h/6.0) * (s.dth + 2.0*s2.dth + 2.0*s3.dth + s4.dth);
    s.ph += (h/6.0) * (s.dph + 2.0*s2.dph + 2.0*s3.dph + s4.dph);

    s.dt += (h/6.0) * (k1_dt + 2.0*k2_dt + 2.0*k3_dt + k4_dt);
    s.dr += (h/6.0) * (k1_dr + 2.0*k2_dr + 2.0*k3_dr + k4_dr);
    s.dth += (h/6.0) * (k1_dth + 2.0*k2_dth + 2.0*k3_dth + k4_dth);
    s.dph += (h/6.0) * (k1_dph + 2.0*k2_dph + 2.0*k3_dph + k4_dph);
}

float getRedshift(float r, float dt, float dph) {
    float Omega = sqrt(M / (r * r * r));
    float ut = 1.0 / sqrt(1.0 - 3.0 * M / r);
    float g_tt = -(1.0 - 2.0 * M / r);
    float g_pp = r * r;
    float kt = g_tt * dt;
    float kph = g_pp * dph;
    float factor = 1.0 + Omega * (kph / kt);
    return 1.0 / (ut * factor);
}

// Procedural diffused light for disk (Plasma)
vec3 getDiskPlasma(float r) {
    // Smooth radial falloff
    float intensity = exp(-(r - 3.0 * M) * 0.5);
    vec3 baseColor = vec3(1.0, 0.5, 0.1); // Hot orange
    return baseColor * intensity;
}

// Spacetime Grid on Equatorial Plane
vec3 getPlaneGrid(float r, float phi) {
    // Grid lines
    float r_grid = step(0.95, fract(r)); 
    float phi_grid = step(0.98, fract(phi * 16.0 / (2.0 * PI)));
    
    float grid = max(r_grid, phi_grid);
    
    // Blue grid, fades out at large distance
    float fade = 1.0 / (1.0 + r * 0.05);
    return vec3(0.0, 0.5, 1.0) * grid * fade;
}

// Simple Star Background
vec3 getBackground(float theta, float phi) {
    // Simple noise-like stars
    float star = step(0.998, fract(sin(phi * 100.0 + theta * 200.0) * 43758.5453));
    return vec3(star);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
    
    vec3 rayDirCart = normalize(uCamDir + uv.x * uCamRight + uv.y * uCamUp);
    
    float r = length(uCamPos);
    float th = acos(uCamPos.z / r);
    float ph = atan(uCamPos.y, uCamPos.x);
    
    float sinTh = sin(th); float cosTh = cos(th);
    float sinPh = sin(ph); float cosPh = cos(ph);
    
    vec3 e_r  = vec3(sinTh * cosPh, sinTh * sinPh, cosTh);
    vec3 e_th = vec3(cosTh * cosPh, cosTh * sinPh, -sinTh);
    vec3 e_ph = vec3(-sinPh,        cosPh,         0.0);
    
    float vr_hat = dot(rayDirCart, e_r);
    float vth_hat = dot(rayDirCart, e_th);
    float vph_hat = dot(rayDirCart, e_ph);
    
    float factor = sqrt(1.0 - 2.0 * M / r);
    float dr = vr_hat * factor;
    float dth = vth_hat / r;
    float dph = vph_hat / (r * sinTh);
    
    float A = 1.0 - 2.0 * M / r;
    float term1 = (dr * dr) / (A * A);
    float term2 = (r * r * dth * dth + r * r * sinTh * sinTh * dph * dph) / A;
    float dt = sqrt(term1 + term2);
    
    State s;
    s.t = 0.0; s.r = r; s.th = th; s.ph = ph;
    s.dt = dt; s.dr = dr; s.dth = dth; s.dph = dph;
    
    // Define Orbiting Object (Moon)
    float moonOrbitR = 8.0 * M;
    float moonSpeed = 0.3;
    vec3 moonPosSph = vec3(moonOrbitR, PI/2.0, uTime * moonSpeed);
    vec3 moonPos = vec3(
        moonPosSph.x * sin(moonPosSph.y) * cos(moonPosSph.z),
        moonPosSph.x * sin(moonPosSph.y) * sin(moonPosSph.z),
        moonPosSph.x * cos(moonPosSph.y)
    );
    float moonRadius = 1.0 * M; // Larger moon

    vec3 accumColor = vec3(0.0);
    vec3 glow = vec3(0.0);
    bool hit = false;

    for (int i = 0; i < MAX_STEPS; i++) {
        State prev_s = s;
        rk4_step(s, STEP_SIZE);
        
        // 1. Check Horizon
        if (s.r < R_HORIZON * 1.01) {
            break; // Hit black hole
        }
        
        // 2. Check Moon Hit (Approximate Cartesian distance)
        vec3 currPos = vec3(
            s.r * sin(s.th) * cos(s.ph),
            s.r * sin(s.th) * sin(s.ph),
            s.r * cos(s.th)
        );
        float distToMoon = length(currPos - moonPos);
        
        // Add glow from moon
        glow += vec3(0.2, 0.4, 1.0) * (0.1 / (distToMoon * distToMoon + 0.1));
        
        if (distToMoon < moonRadius) {
            accumColor = vec3(0.9, 0.95, 1.0); // Bright blue-white moon
            hit = true;
            break;
        }

        // 3. Check Equatorial Plane Intersection (Theta crosses PI/2)
        if ((s.th - PI/2.0) * (prev_s.th - PI/2.0) < 0.0) {
            float t = (PI/2.0 - prev_s.th) / (s.th - prev_s.th);
            float r_cross = mix(prev_s.r, s.r, t);
            float ph_cross = mix(prev_s.ph, s.ph, t);
            
            vec3 planeColor = vec3(0.0);
            bool planeHit = false;

            // A. Spacetime Grid (Infinite)
            vec3 gridCol = getPlaneGrid(r_cross, ph_cross);
            planeColor += gridCol;
            if (length(gridCol) > 0.0) planeHit = true;

            // B. Accretion Disk (Diffused Light)
            if (r_cross > 3.0 * M && r_cross < 12.0 * M) {
                // Calculate Doppler Shift
                float g = getRedshift(r_cross, s.dt, s.dph);
                
                vec3 plasma = getDiskPlasma(r_cross);
                
                // Apply relativistic beaming (intensity ~ g^4)
                plasma *= pow(g, 4.0);
                
                // Apply frequency shift
                plasma *= vec3(1.0/g, 1.0, g);
                
                planeColor += plasma;
                planeHit = true;
            }
            
            if (planeHit) {
                accumColor = planeColor;
                hit = true;
                break;
            }
        }
        
        if (s.r > R_MAX) break;
    }
    
    // Add glow to final color
    if (!hit) {
        accumColor = getBackground(s.th, s.ph);
    }
    FragColor = vec4(accumColor + glow, 1.0);
}
