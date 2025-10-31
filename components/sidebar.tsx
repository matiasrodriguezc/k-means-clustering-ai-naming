"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { kMeansClustering, standardizeData } from "@/lib/kmeans"
// --- 1. Importar tipos (NUEVO) ---
import type { DataState, ClusterName } from "@/app/page"
import { Upload } from "lucide-react"

interface SidebarProps {
  dataState: DataState
  setDataState: (state: DataState | ((prev: DataState) => DataState)) => void // 👈 Mejorar tipo para React
  onAnalysisComplete: () => void
}

export default function Sidebar({ dataState, setDataState, onAnalysisComplete }: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string
        const lines = csv.trim().split("\n")
        const headers = lines[0].split(",").map((h) => h.trim())

        const data = lines
          .slice(1)
          .map((line) => {
            const values = line.split(",").map((v) => v.trim())
            const record: Record<string, number> = {}
            headers.forEach((header, idx) => {
              const num = Number.parseFloat(values[idx])
              record[header] = isNaN(num) ? 0 : num
            })
            return record
          })
          .filter((row) => Object.values(row).some((v) => v !== 0))

        setColumns(headers)
        // Resetear estado al cargar nuevo archivo
        setDataState((prev) => ({
          ...prev,
          data,
          columnX: headers[0] || "Satisfaction",
          columnY: headers[1] || "Loyalty",
          wcssValues: [],
          clusters: [],
          centroids: [],
          clusterNames: [], // 👈 Resetear nombres
          processed: false,
        }))
      } catch (error) {
        console.error("Error parsing CSV:", error)
      }
    }
    reader.readAsText(file)
  }

  // --- 2. Lógica de Análisis y API (MODIFICADO) ---
  const handleExecuteAnalysis = async () => {
    if (dataState.data.length === 0) return

    setIsLoading(true)
    try {
      // Prepare data
      let processedData = dataState.data.map((row) => [row[dataState.columnX] || 0, row[dataState.columnY] || 0])

      // Standardize if needed
      if (dataState.shouldStandardize) {
        processedData = standardizeData(processedData)
      }

      // Calculate WCSS for elbow method
      const wcssValues: number[] = []
      for (let k = 1; k <= 9; k++) {
        const result = kMeansClustering(processedData, k, 100)
        wcssValues.push(result.wcss)
      }

      // Calculate final clusters
      const finalResult = kMeansClustering(processedData, dataState.k, 100)

      // --- 3. Calcular Estadísticas (NUEVO) ---
      // Usamos los datos *originales* (dataState.data) para que los promedios sean interpretables
      const clusterStats = Array.from({ length: dataState.k }, (_, i) => {
        const members = dataState.data.filter((_, idx) => finalResult.assignments[idx] === i)
        const count = members.length

        const sumX = members.reduce((acc, row) => acc + (row[dataState.columnX] || 0), 0)
        const sumY = members.reduce((acc, row) => acc + (row[dataState.columnY] || 0), 0)

        return {
          cluster: i,
          count: count,
          avgX: count > 0 ? sumX / count : 0,
          avgY: count > 0 ? sumY / count : 0,
        }
      })

      // --- 4. Llamar a la API de Gemini (NUEVO) ---
      let clusterNames: ClusterName[] = []
      try {
        const nameResponse = await fetch("/api/name_clusters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clusterStats,
            columnX: dataState.columnX,
            columnY: dataState.columnY,
          }),
        })

        if (!nameResponse.ok) {
          console.error("API Error:", await nameResponse.text())
        } else {
          clusterNames = await nameResponse.json()
        }
      } catch (apiError) {
        console.error("Failed to fetch cluster names:", apiError)
        // Opcional: crear nombres placeholder si la API falla
        clusterNames = clusterStats.map(c => ({
          cluster: c.cluster,
          name: `Cluster ${c.cluster}`,
          description: "AI naming failed. Check API logs."
        }))
      }

      // --- 5. Actualizar estado (MODIFICADO) ---
      setDataState((prev) => ({
        ...prev,
        wcssValues,
        clusters: finalResult.assignments,
        centroids: finalResult.centroids,
        clusterNames: clusterNames, // 👈 Guardar nombres
        processed: true,
      }))
    } catch (error) {
      console.error("Clustering error:", error)
    } finally {
      setIsLoading(false)
      onAnalysisComplete() // 👈 Llamar al autoscroll
    }
  }

  return (
    <aside className="w-80 bg-sidebar border-r border-sidebar-border p-6 overflow-y-auto h-full">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-sidebar-foreground">Configuration</h2>
          <p className="text-sidebar-foreground/60 text-sm mt-1">Setup your clustering parameters</p>
        </div>

        {/* File Upload */}
        <Card className="bg-sidebar-accent/10 border-sidebar-border p-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-sidebar-foreground">Upload CSV File</label>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
            {dataState.data.length > 0 && (
              <p className="text-xs text-sidebar-foreground/60">✓ {dataState.data.length} records loaded</p>
            )}
          </div>
        </Card>

        {/* Column Selection */}
        {columns.length > 0 && (
          <>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-sidebar-foreground">X Variable (Horizontal)</label>
              <Select
                value={dataState.columnX}
                onValueChange={(val) => setDataState((prev) => ({ ...prev, columnX: val, processed: false }))}
              >
                {/* Añadir "text-sidebar-foreground" aquí */}
                <SelectTrigger className="bg-sidebar-accent/10 border-sidebar-border text-sidebar-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-sidebar-foreground">Y Variable (Vertical)</label>
              <Select
                value={dataState.columnY}
                onValueChange={(val) => setDataState((prev) => ({ ...prev, columnY: val, processed: false }))}
              >
                {/* Añadir "text-sidebar-foreground" aquí */}
                <SelectTrigger className="bg-sidebar-accent/10 border-sidebar-border text-sidebar-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Standardize Checkbox */}
        {dataState.data.length > 0 && (
          <div className="flex items-center space-x-3 p-3 bg-sidebar-accent/10 rounded-lg border border-sidebar-border">
            <Checkbox
              id="standardize"
              checked={dataState.shouldStandardize}
              onCheckedChange={(checked) =>
                setDataState((prev) => ({ ...prev, shouldStandardize: !!checked, processed: false }))
              }
            />
            <label
              htmlFor="standardize"
              className="text-sm font-medium text-sidebar-foreground cursor-pointer flex-1"
            >
              Standardize Data
            </label>
          </div>
        )}

        {/* K Slider */}
        {dataState.data.length > 0 && (
          <div className="space-y-4 p-4 bg-sidebar-accent/10 rounded-lg border border-sidebar-border">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-sidebar-foreground">Number of Clusters (K)</label>
              <span className="text-lg font-bold text-sidebar-primary">{dataState.k}</span>
            </div>
            <Slider
              value={[dataState.k]}
              onValueChange={(value) => setDataState((prev) => ({ ...prev, k: value[0], processed: false }))}
              min={2}
              max={9}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-sidebar-foreground/60">Range: 2 - 9 clusters</p>
          </div>
        )}

        {/* Execute Button */}
        {dataState.data.length > 0 && (
          <Button
            onClick={handleExecuteAnalysis}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-violet-600 text-sidebar-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? "Analyzing..." : "Execute Analysis"}
          </Button>
        )}
      </div>
    </aside>
  )
}