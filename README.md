# Schwarzschild Black Hole Visualization

![Demo](content/demo.gif)

A real-time General Relativistic ray marcher written in C++ and OpenGL. This simulation visualizes the gravitational lensing and optical distortion caused by a Schwarzschild black hole, featuring a relativistic accretion disk, an orbiting body, and a spacetime grid.

## Features

*   **Real-time Ray Marching**: Solves the geodesic equations for every pixel on the GPU.
*   **General Relativity**: Simulates light bending (gravitational lensing) using the Schwarzschild metric.
*   **Accretion Disk**: Volumetric rendering of a relativistic accretion disk with **Doppler beaming** (blueshift/redshift effects).
*   **Spacetime Grid**: Visualizes the curvature of space on the equatorial plane, showing how the black hole "drills" into spacetime.
*   **Orbiting Body**: A dynamic moon orbiting the black hole at $8M$, demonstrating time-dependent lensing.
*   **Free Camera**: Full 6DOF camera controls to explore the scene.

## Controls

| Key | Action |
| :--- | :--- |
| **W, A, S, D** | Move Camera (Forward, Left, Back, Right) |
| **Space** | Move Up (Global Y) |
| **Left Shift** | Move Down (Global Y) |
| **Mouse** | Look around |
| **ESC** | Exit Application |

## Technical Details

The simulation uses **GLSL Fragment Shaders** to perform ray marching. For each pixel, a ray is cast into the scene. The path of the ray is determined by numerically integrating the geodesic equations of the Schwarzschild metric using the **Runge-Kutta 4 (RK4)** method.

The metric used is:

$$
ds^2 = -\left(1-\frac{r_s}{r}\right)dt^2 + \left(1-\frac{r_s}{r}\right)^{-1}dr^2 + r^2(d\theta^2 + \sin^2\theta d\phi^2)
$$

Where $r_s = 2M$ is the Schwarzschild radius.

## Building & Running

### Prerequisites
*   **CMake** (3.20 or higher)
*   **C++17** compatible compiler (Clang, GCC, MSVC)
*   **Python 3** (required for GLAD generation)
*   **Jinja2**: `pip install jinja2`

### Build Steps

```bash
# 1. Create build directory
mkdir build
cd build

# 2. Configure project
cmake ..

# 3. Build
make
```

### Run

```bash
./blackhole
```

## Dependencies

This project uses `FetchContent` to automatically download and build:
*   [GLFW](https://www.glfw.org/) - Windowing and Input
*   [GLAD](https://github.com/Dav1dde/glad) - OpenGL Loading
*   [GLM](https://github.com/g-truc/glm) - Mathematics
