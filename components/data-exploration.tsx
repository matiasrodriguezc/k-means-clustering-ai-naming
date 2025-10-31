"use client"

import { Card } from "@/components/ui/card"
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { DataState } from "@/app/page"

interface DataExplorationProps {
  dataState: DataState
}

export default function DataExploration({ dataState }: DataExplorationProps) {
  const previewData = dataState.data.slice(0, 5)

  const scatterData = dataState.data.map((row) => ({
    x: row[dataState.columnX] || 0,
    y: row[dataState.columnY] || 0,
  }))

  return (
    <div className="space-y-6">
      {/* Data Preview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Data Preview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-4 text-muted-foreground font-medium">{dataState.columnX}</th>
                <th className="text-left py-2 px-4 text-muted-foreground font-medium">{dataState.columnY}</th>
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, idx) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-2 px-4">{(row[dataState.columnX] || 0).toFixed(2)}</td>
                  <td className="py-2 px-4">{(row[dataState.columnY] || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Showing first 5 rows of {dataState.data.length} total records
        </p>
      </Card>

      {/* Scatter Plot */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Data Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
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
            <Scatter data={scatterData} fill="var(--chart-1)" opacity={0.6} name="Data Points" />
          </ScatterChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
