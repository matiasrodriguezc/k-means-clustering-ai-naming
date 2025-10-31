"use client"

import { useState } from "react"
import Link from "next/link"
import Sidebar from "@/components/sidebar"
import DataExploration from "@/components/data-exploration"
import ClusteringResults from "@/components/clustering-results"
import ExportPanel from "@/components/export-panel"
import { Card } from "@/components/ui/card"
import { Github, Linkedin, Mail } from "lucide-react"

// --- 1. Definición de la IA (NUEVO) ---
export interface ClusterName {
  cluster: number
  name: string
  description: string
}

// --- 2. Actualización de DataState (NUEVO) ---
export interface DataState {
  data: Array<Record<string, number>>
  columnX: string
  columnY: string
  shouldStandardize: boolean
  k: number
  wcssValues: number[]
  clusters: Array<number>
  centroids: Array<[number, number]>
  clusterNames: ClusterName[] // 👈 AÑADIDO
  processed: boolean
}

export default function Home() {
  const [dataState, setDataState] = useState<DataState>({
    data: [],
    columnX: "Satisfaction",
    columnY: "Loyalty",
    shouldStandardize: false,
    k: 3,
    wcssValues: [],
    clusters: [],
    centroids: [],
    clusterNames: [], // 👈 AÑADIDO
    processed: false,
  })

  const scrollToElbowMethod = () => {
    setTimeout(() => {
      const targetElement = document.getElementById("elbow-method-wcss")
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    }, 100)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed top-4 right-4 z-50 flex gap-3">
        <Link
          href="https://github.com/matiasrodriguezc"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          aria-label="GitHub"
        >
          <Github className="w-5 h-5" />
        </Link>
        <Link
          href="https://www.linkedin.com/in/matiasrodriguezc"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          aria-label="LinkedIn"
        >
          <Linkedin className="w-5 h-5" />
        </Link>
        <Link
          href="mailto:matiasrodriguezc01@gmail.com"
          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          aria-label="Email"
        >
          <Mail className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar dataState={dataState} setDataState={setDataState} onAnalysisComplete={scrollToElbowMethod} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-balance">K-Means Clustering Analysis</h1>
              <p className="text-muted-foreground mt-2">
                Customer segmentation and data analysis. Powered by AI to Cluster naming and description
              </p>
            </div>

            {dataState.data.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground text-lg">Upload a CSV file to get started with clustering analysis</p>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Data Exploration */}
                <DataExploration dataState={dataState} />

                {/* Clustering Results */}
                {dataState.processed && <ClusteringResults dataState={dataState} />}

                {dataState.processed && <ExportPanel dataState={dataState} />}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}