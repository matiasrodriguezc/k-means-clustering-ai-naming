"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, MailIcon, Loader2 } from "lucide-react" // 👈 Importar Loader2 para el spinner
import type { DataState } from "@/app/page" // Asume que DataState incluye clusterNames
import jsPDF from "jspdf"
import "jspdf-autotable" // Para tablas (aunque lo usaremos simple)
import * as XLSX from "xlsx"

interface ExportPanelProps {
  dataState: DataState
}

export default function ExportPanel({ dataState }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [email, setEmail] = useState("")
  const [showEmailForm, setShowEmailForm] = useState(false)

  // --- 1. Generador de PDF (Actualizado con Nombres/Descripciones IA) ---
  const generatePDF = () => {
    setIsExporting(true)
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 10

    doc.setFontSize(20)
    doc.text("K-Means Clustering Analysis Report", pageWidth / 2, yPosition, { align: "center" })
    yPosition += 15

    doc.setFontSize(12)
    doc.text("Analysis Parameters:", 10, yPosition)
    yPosition += 7

    doc.setFontSize(10)
    doc.text(`• X Variable: ${dataState.columnX}`, 15, yPosition); yPosition += 5
    doc.text(`• Y Variable: ${dataState.columnY}`, 15, yPosition); yPosition += 5
    doc.text(`• Number of Clusters (K): ${dataState.k}`, 15, yPosition); yPosition += 5
    doc.text(`• Data Standardized: ${dataState.shouldStandardize ? "Yes" : "No"}`, 15, yPosition); yPosition += 5
    doc.text(`• Total Records: ${dataState.data.length}`, 15, yPosition); yPosition += 10

    doc.setFontSize(12)
    doc.text("Cluster Summary & AI Insights:", 10, yPosition) // 👈 Título actualizado
    yPosition += 7

    doc.setFontSize(10)
    for (let i = 0; i < dataState.k; i++) {
      // Buscar datos del cluster
      const count = dataState.clusters.filter((c) => c === i).length
      const percentage = ((count / dataState.data.length) * 100).toFixed(2)
      const centroid = dataState.centroids[i]
      const aiName = dataState.clusterNames.find(c => c.cluster === i)

      // Añadir al PDF
      doc.setFontSize(11)
      doc.setTextColor(40, 40, 40) // Color oscuro
      doc.text(`Segment: ${aiName ? aiName.name : `Cluster ${i}`}`, 15, yPosition)
      yPosition += 6

      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100) // Color gris
      doc.text(`• AI Description: ${aiName ? aiName.description : "N/A"}`, 20, yPosition)
      yPosition += 5
      doc.text(`• Stats: ${count} customers (${percentage}%)`, 20, yPosition)
      yPosition += 5
      doc.text(`• Centroid (${dataState.columnX}, ${dataState.columnY}): (${centroid[0].toFixed(2)}, ${centroid[1].toFixed(2)})`, 20, yPosition)
      yPosition += 8 // Más espacio entre clusters

      if (yPosition > pageHeight - 20) {
        doc.addPage()
        yPosition = 10
      }
    }

    doc.save("clustering-analysis.pdf")
    setIsExporting(false)
  }

  // --- 2. Generador de Excel (Actualizado con Nombres/Descripciones IA) ---
  const generateExcel = () => {
    setIsExporting(true)
    const wb = XLSX.utils.book_new()

    // Sheet 1: Summary (Con IA)
    const summaryData: (string | number)[][] = [
      ["K-Means Clustering Analysis Report"],
      [],
      ["Analysis Parameters"],
      ["X Variable", dataState.columnX],
      ["Y Variable", dataState.columnY],
      ["Number of Clusters", dataState.k],
      ["Data Standardized", dataState.shouldStandardize ? "Yes" : "No"],
      ["Total Records", dataState.data.length],
      [],
      ["Cluster Summary & AI Insights"],
      [
        "Cluster ID",
        "AI-Generated Name",
        "AI Description",
        "Count",
        "Percentage (%)",
        `Centroid (${dataState.columnX})`,
        `Centroid (${dataState.columnY})`,
      ],
    ]

    for (let i = 0; i < dataState.k; i++) {
      const count = dataState.clusters.filter((c) => c === i).length
      const percentage = (count / dataState.data.length) * 100
      const centroid = dataState.centroids[i]
      const aiName = dataState.clusterNames.find(c => c.cluster === i)
      
      summaryData.push([
        i,
        aiName ? aiName.name : "N/A",
        aiName ? aiName.description : "N/A",
        count,
        percentage,
        centroid[0],
        centroid[1]
      ])
    }

    const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
    // Aplicar formato de número al porcentaje
    ws1["!cols"] = [ {wch: 10}, {wch: 25}, {wch: 40}, {wch: 10}, {wch: 12}, {wch: 20}, {wch: 20} ] // Anchos de columna
    for(let i = 12; i < 12 + dataState.k; i++) {
      const cellRef = XLSX.utils.encode_cell({c: 4, r: i});
      if(ws1[cellRef]) ws1[cellRef].z = "0.00\\%";
    }
    
    XLSX.utils.book_append_sheet(wb, ws1, "Summary")

    // Sheet 2: Raw Data (Con IA)
    const clusterNameMap = new Map(dataState.clusterNames.map(c => [c.cluster, c.name]));
    const dataWithClusters = dataState.data.map((row, idx) => ({
      ...row,
      Cluster_ID: dataState.clusters[idx],
      Cluster_Name: clusterNameMap.get(dataState.clusters[idx]) || "N/A" // 👈 Nombre IA añadido
    }))

    const ws2 = XLSX.utils.json_to_sheet(dataWithClusters)
    XLSX.utils.book_append_sheet(wb, ws2, "Data with Clusters")

    // Sheet 3: Centroids
    const centroidsData = dataState.centroids.map((centroid, idx) => ({
      Cluster: idx,
      Name: clusterNameMap.get(idx) || "N/A",
      [dataState.columnX]: centroid[0],
      [dataState.columnY]: centroid[1],
    }))

    const ws3 = XLSX.utils.json_to_sheet(centroidsData)
    XLSX.utils.book_append_sheet(wb, ws3, "Centroids")

    XLSX.writeFile(wb, "clustering-analysis.xlsx")
    setIsExporting(false)
  }

  // --- 3. Envío de Email (Actualizado con Nombres/Descripciones IA) ---
  const handleSendEmail = async () => {
    if (!email) return

    setIsExporting(true)
    try {
      const response = await fetch("/api/send-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          analysis: {
            columnX: dataState.columnX,
            columnY: dataState.columnY,
            k: dataState.k,
            standardized: dataState.shouldStandardize,
            totalRecords: dataState.data.length,
            clusters: dataState.clusters,
            centroids: dataState.centroids,
            clusterNames: dataState.clusterNames, // 👈 Nombres IA añadidos
          },
        }),
      })

      if (response.ok) {
        alert("Analysis sent successfully!")
        setEmail("")
        setShowEmailForm(false)
      } else {
        alert("Failed to send email")
      }
    } catch (error) {
      console.error("Error sending email:", error)
      alert("Error sending email")
    } finally {
      setIsExporting(false)
    }
  }

  // Helper para el spinner del botón
  const getIcon = (iconType: "pdf" | "excel" | "email") => {
    if (isExporting && iconType === "pdf") return <Loader2 className="w-4 h-4 mr-2 animate-spin" />
    if (isExporting && iconType === "excel") return <Loader2 className="w-4 h-4 mr-2 animate-spin" />
    if (isExporting && iconType === "email") return <Loader2 className="w-4 h-4 mr-2 animate-spin" />
    
    if (iconType === "pdf") return <Download className="w-4 h-4 mr-2" />
    if (iconType === "excel") return <Download className="w-4 h-4 mr-2" />
    if (iconType === "email") return <MailIcon className="w-4 h-4 mr-2" />
  }


  return (
    <Card className="p-4 bg-muted/50">
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Export Analysis</h3>
        <div className="flex gap-2">
          <Button
            onClick={generatePDF}
            disabled={isExporting || !dataState.processed}
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent"
          >
            {getIcon("pdf")}
            PDF
          </Button>
          <Button
            onClick={generateExcel}
            disabled={isExporting || !dataState.processed}
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent"
          >
            {getIcon("excel")}
            Excel
          </Button>
          <Button
            onClick={() => setShowEmailForm(!showEmailForm)}
            disabled={isExporting || !dataState.processed}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {getIcon("email")}
            Email
          </Button>
        </div>

        {showEmailForm && (
          <div className="space-y-2 pt-2 border-t">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              disabled={isExporting}
            />
            <div className="flex gap-2">
              <Button onClick={handleSendEmail} disabled={isExporting || !email} size="sm" className="flex-1">
                {isExporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : "Send"}
              </Button>
              <Button onClick={() => setShowEmailForm(false)} variant="outline" size="sm" className="flex-1" disabled={isExporting}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}