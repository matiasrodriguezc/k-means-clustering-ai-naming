"use client"

import { useState, useMemo } from "react" // 👈 1. Importar useMemo
import { Card } from "@/components/ui/card"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceDot, // 👈 2. Importar ReferenceDot
} from "recharts"
import type { DataState, ClusterName } from "@/app/page"

interface ClusteringResultsProps {
  dataState: DataState
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
  "var(--chart-9)",
]

export default function ClusteringResults({ dataState }: ClusteringResultsProps) {
  const [highlightedCluster, setHighlightedCluster] = useState<number | null>(null)

  const handleClusterClick = (clusterId: number) => {
    setHighlightedCluster((prevId) => (prevId === clusterId ? null : clusterId))
  }

  // Preparar datos (usar WCSS como número para el cálculo)
  const elbowData = dataState.wcssValues.map((wcss, idx) => ({
    k: idx + 1,
    wcss: wcss, // Usar el número crudo
  }))

  // --- 3. Calcular el "Codo" (NUEVO) ---
  const optimalElbowK = useMemo(() => {
    const points = elbowData
    if (points.length < 3) return null // Necesitamos al menos 3 puntos

    const p1 = points[0] // Primer punto (K=1)
    const pn = points[points.length - 1] // Último punto (K=9)

    // Ecuación de la línea Ax + By + C = 0
    const A = pn.wcss - p1.wcss
    const B = p1.k - pn.k
    const C = pn.k * p1.wcss - p1.k * pn.wcss
    const denom = Math.sqrt(A * A + B * B)

    let maxDistance = -1
    let bestK = -1

    // Omitir el primer y último punto
    for (let i = 1; i < points.length - 1; i++) {
      const p = points[i]
      const distance = Math.abs(A * p.k + B * p.wcss + C) / denom
      if (distance > maxDistance) {
        maxDistance = distance
        bestK = p.k
      }
    }
    return bestK > -1 ? bestK : null
  }, [elbowData]) // Recalcular solo si 'elbowData' cambia

  // Formatear WCSS a string *después* del cálculo
  const formattedElbowData = elbowData.map((d) => ({
    ...d,
    wcss: d.wcss.toFixed(2),
  }))

  // ... (preparación de scatterData, scatterByCluster, clusterCounts)
  const scatterData = dataState.data.map((row, idx) => ({
    x: row[dataState.columnX] || 0,
    y: row[dataState.columnY] || 0,
    cluster: dataState.clusters[idx] || 0,
  }))

  const scatterByCluster = Array.from({ length: dataState.k }, (_, i) =>
    scatterData.filter((point) => point.cluster === i),
  )

  const clusterCounts = Array.from({ length: dataState.k }, (_, i) => {
    const count = dataState.clusters.filter((c) => c === i).length
    return { cluster: i, count }
  })

  return (
    <div className="space-y-6">
      {/* Elbow Method Chart */}
      <Card id="elbow-method-wcss" className="p-6">
        <h3 className="text-lg font-semibold mb-4">Elbow Method - WCSS Optimization</h3>
        <ResponsiveContainer width="100%" height={300}>
          {/* Usar los datos formateados para el gráfico */}
          <LineChart data={formattedElbowData}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
            <XAxis
              dataKey="k"
              label={{ value: "Number of Clusters", position: "insideBottomRight", offset: -5 }}
              stroke="currentColor"
              opacity={0.5}
            />
            <YAxis label={{ value: "WCSS", angle: -90, position: "insideLeft" }} stroke="currentColor" opacity={0.5} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="wcss"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ fill: "var(--chart-1)", r: 4 }}
            />

            {/* --- 4. Añadir el resaltado (NUEVO) --- */}
            {optimalElbowK && (
              <>
                {/* Anillo exterior pulsante */}
                <ReferenceDot
                  x={optimalElbowK}
                  y={elbowData.find((p) => p.k === optimalElbowK)?.wcss.toFixed(2)}
                  r={12}
                  fill="var(--chart-1)"
                  opacity={0.3}
                  isFront={true}
                />
                {/* Punto central sólido */}
                <ReferenceDot
                  x={optimalElbowK}
                  y={elbowData.find((p) => p.k === optimalElbowK)?.wcss.toFixed(2)}
                  r={6}
                  fill="var(--chart-1)"
                  stroke="var(--background)"
                  strokeWidth={2}
                  isFront={true}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* ... (resto del JSX: Clustering Results Scatter, Cluster Summary) ... */}
      {/* Clustering Results Scatter */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Clustering Results (K={dataState.k})</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
            <XAxis type="number" dataKey="x" name={dataState.columnX} stroke="currentColor" opacity={0.5} />
            <YAxis type="number" dataKey="y" name={dataState.columnY} stroke="currentColor" opacity={0.5} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
              cursor={{ strokeDasharray: "3 3" }}
            />

            {scatterByCluster.map((clusterData, idx) => {
              const isActive = highlightedCluster === null || highlightedCluster === idx
              const opacity = isActive ? 0.85 : 0.15

              return (
                <Scatter
                  key={idx}
                  data={clusterData}
                  fill={COLORS[idx % COLORS.length]}
                  opacity={opacity}
                  name={`Cluster ${idx}`}
                  className="transition-opacity duration-200"
                />
              )
            })}

            <Scatter
              data={dataState.centroids.map(([x, y]) => ({ x, y }))}
              fill="currentColor"
              shape="diamond"
              opacity={1}
              name="Centroids"
              size={150}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </Card>

      {/* Cluster Summary & AI Insights */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Cluster Summary & AI Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusterCounts.map((item) => {
            const isCardActive = highlightedCluster === item.cluster
            const aiNames = dataState.clusterNames.find((c) => c.cluster === item.cluster)

            return (
              <Card
                key={item.cluster}
                className={`p-6 transition-all duration-200 cursor-pointer flex flex-col ${
                  isCardActive
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleClusterClick(item.cluster)}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[item.cluster % COLORS.length] }}
                  />
                  <p className="text-lg font-bold text-foreground">
                    {aiNames ? aiNames.name : `Cluster ${item.cluster}`}
                  </p>
                </div>

                <p className="text-sm text-muted-foreground mb-4 min-h-[3em] flex-grow">
                  {aiNames ? aiNames.description : "No AI description available."}
                </p>

                <div>
                  <p className="text-3xl font-bold">{item.count}</p>
                  <p className="text-xs text-muted-foreground">clients in this segment</p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}