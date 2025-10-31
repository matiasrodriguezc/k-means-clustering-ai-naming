/**
 * K-Means Clustering Implementation
 */

export function kMeansClustering(data: number[][], k: number, maxIterations = 100) {
  if (data.length === 0 || k <= 0) {
    return { assignments: [], centroids: [], wcss: 0 }
  }

  // Initialize centroids randomly
  let centroids = initializeCentroids(data, k)
  let assignments = new Array(data.length).fill(0)
  let wcss = 0

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign points to nearest centroid
    assignments = data.map((point) =>
      centroids.reduce((nearest, centroid, idx) => {
        const distance = euclideanDistance(point, centroid)
        const nearestDistance = euclideanDistance(point, centroids[nearest])
        return distance < nearestDistance ? idx : nearest
      }, 0),
    )

    // Calculate WCSS
    wcss = 0
    for (let i = 0; i < data.length; i++) {
      wcss += Math.pow(euclideanDistance(data[i], centroids[assignments[i]]), 2)
    }

    // Calculate new centroids
    const newCentroids = Array.from({ length: k }, (_, i) => {
      const clusterPoints = data.filter((_, idx) => assignments[idx] === i)
      if (clusterPoints.length === 0) return centroids[i]

      return [
        clusterPoints.reduce((sum, p) => sum + p[0], 0) / clusterPoints.length,
        clusterPoints.reduce((sum, p) => sum + p[1], 0) / clusterPoints.length,
      ]
    })

    // Check for convergence
    if (
      newCentroids.every((centroid, idx) => centroid.every((val, dim) => Math.abs(val - centroids[idx][dim]) < 1e-10))
    ) {
      break
    }

    centroids = newCentroids
  }

  return {
    assignments,
    centroids: centroids as [number, number][],
    wcss,
  }
}

export function standardizeData(data: number[][]): number[][] {
  const means = [
    data.reduce((sum, p) => sum + p[0], 0) / data.length,
    data.reduce((sum, p) => sum + p[1], 0) / data.length,
  ]

  const stds = [
    Math.sqrt(data.reduce((sum, p) => sum + Math.pow(p[0] - means[0], 2), 0) / data.length),
    Math.sqrt(data.reduce((sum, p) => sum + Math.pow(p[1] - means[1], 2), 0) / data.length),
  ]

  return data.map((point) => [(point[0] - means[0]) / (stds[0] || 1), (point[1] - means[1]) / (stds[1] || 1)])
}

function euclideanDistance(point1: number[], point2: number[]): number {
  return Math.sqrt(point1.reduce((sum, val, i) => sum + Math.pow(val - point2[i], 2), 0))
}

function initializeCentroids(data: number[][], k: number): number[][] {
  const centroids: number[][] = []
  const indices = new Set<number>()

  while (centroids.length < k) {
    const randomIdx = Math.floor(Math.random() * data.length)
    if (!indices.has(randomIdx)) {
      indices.add(randomIdx)
      centroids.push([...data[randomIdx]])
    }
  }

  return centroids
}
