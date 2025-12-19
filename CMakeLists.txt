cmake_minimum_required(VERSION 3.20)

project(BlackHole)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release)
endif()

set(CMAKE_CXX_FLAGS_RELEASE "-O3 -ffast-math")

include(FetchContent)

# GLFW
FetchContent_Declare(
  glfw
  GIT_REPOSITORY https://github.com/glfw/glfw.git
  GIT_TAG 3.4
)
FetchContent_MakeAvailable(glfw)

# GLAD (OpenGL loader, v2)
FetchContent_Declare(
  glad
  GIT_REPOSITORY https://github.com/Dav1dde/glad.git
  GIT_TAG v2.0.6
  SOURCE_SUBDIR cmake
)
FetchContent_MakeAvailable(glad)

# GLM
FetchContent_Declare(
  glm
  GIT_REPOSITORY https://github.com/g-truc/glm.git
  GIT_TAG 1.0.1
)
FetchContent_MakeAvailable(glm)

glad_add_library(glad STATIC API gl:core=3.3)

add_executable(blackhole src/main.cpp)
target_link_libraries(blackhole PRIVATE glfw glad glm::glm)
# macOS: link Cocoa frameworks automatically through GLFW
if(APPLE)
  target_compile_definitions(blackhole PRIVATE GL_SILENCE_DEPRECATION)
endif()

# Copy shaders to build directory
add_custom_command(TARGET blackhole POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory
        ${CMAKE_SOURCE_DIR}/src/shaders
        ${CMAKE_BINARY_DIR}/src/shaders)
