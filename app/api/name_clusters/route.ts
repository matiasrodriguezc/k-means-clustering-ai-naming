// src/app/api/name_clusters/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// 1. Inicializar el cliente de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// 2. Definir la estructura de los datos
interface ClusterData {
  cluster: number;
  count: number;
  avgX: number; // Promedio de la variable X
  avgY: number; // Promedio de la variable Y
}

interface RequestBody {
  clusterStats: ClusterData[];
  columnX: string;
  columnY: string;
}

// 3. Crear el manejador POST
export async function POST(req: NextRequest) {
  try {
    const { clusterStats, columnX, columnY }: RequestBody = await req.json();

    // --- 4. Construir el Prompt (en Inglés) ---
    const prompt = `
      You are an expert marketing analyst specializing in customer segmentation.
      I have performed K-Means clustering on my customers using two variables: "${columnX}" (X-axis) and "${columnY}" (Y-axis).

      Here is a statistical summary for each cluster:
      ${clusterStats
        .map(
          (c) => `
      - Cluster ${c.cluster}:
        - Number of Customers: ${c.count}
        - Average ${columnX}: ${c.avgX.toFixed(2)}
        - Average ${columnY}: ${c.avgY.toFixed(2)}
      `,
        )
        .join("")}

      Your task is to generate a creative and actionable segment name (e.g., "Loyal Champions", "At-Risk Customers", "New Prospects") and a brief description (1-2 sentences) for each cluster.

      Respond ONLY with a valid JSON array, using this exact structure:
      [
        { "cluster": 0, "name": "Cluster 0 Name", "description": "Cluster 0 Description" },
        { "cluster": 1, "name": "Cluster 1 Name", "description": "Cluster 1 Description" }
      ]
    `;

    // --- 5. Llamar a la API de Gemini (Corrección del Modelo) ---
    //
    // CAMBIO: Usar "gemini-1.0-pro", que es el modelo estable.
    //
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Limpiar la respuesta para asegurar que sea JSON válido
    const jsonResponse = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

    // Parsear el JSON para enviarlo de vuelta al frontend
    const clusterNames = JSON.parse(jsonResponse);

    return NextResponse.json(clusterNames);

  } catch (error) {
    console.error("Error en la API de Gemini:", error);
    return NextResponse.json({ error: "Error naming clusters" }, { status: 500 });
  }
}