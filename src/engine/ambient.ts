// An embedded torus knot. The radial and vertical unit directions span each
// tube cross-section; sharing the terminal vertex closes both periodic seams.
export const rings = 112
export const strands = 18

export function knotVertices() {
  const vertices = new Float64Array(rings * strands * 3)
  for (let ring = 0; ring < rings; ring++) {
    const t = 2 * Math.PI * ring / rings
    for (let strand = 0; strand < strands; strand++) {
      const u = 2 * Math.PI * strand / strands
      const radius = 1.06 + 0.39 * Math.cos(3 * t) + 0.18 * Math.cos(u)
      const index = 3 * (ring * strands + strand)
      vertices[index] = radius * Math.cos(2 * t)
      vertices[index + 1] = radius * Math.sin(2 * t)
      vertices[index + 2] = 0.58 * Math.sin(3 * t) + 0.18 * Math.sin(u)
    }
  }
  return vertices
}

export function projectKnot(vertices: Float64Array, points: Float64Array, yaw: number, pitch: number) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw)
  const cp = Math.cos(pitch), sp = Math.sin(pitch)
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i]!, y = vertices[i+1]!, z = vertices[i+2]!
    const rotated = x * sy + y * cy
    const depth = rotated * sp + z * cp
    const scale = 5 / (5 - depth)
    points[i] = (x * cy - y * sy) * scale
    points[i+1] = (rotated * cp - z * sp) * scale
    points[i+2] = depth
  }
}
