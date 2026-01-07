# 🤖 AI-Powered K-Means Clustering App

> **Transforming raw data into actionable business segments with a single click.**

This application is a **Generative BI tool** that bridges the gap between classic Machine Learning and Large Language Models. It doesn't just calculate clusters; it interprets them, providing human-readable insights for marketing and business strategy.

View Demo [Here](https://k-means-clustering-ai-naming.vercel.app)

---

## 🌟 Key Features

* **📂 Intelligent CSV Parsing:** Robust data ingestion supporting custom variable selection.
* **📈 Elbow Method Optimization:** Built-in WCSS (Within-Cluster Sum of Squares) calculation to mathematically determine the optimal .
* **🧠 AI Semantic Interpretation:** Leverages **Google Gemini 1.5 Flash** to analyze cluster centroids and statistics, generating creative names (e.g., *"Loyal Champions"*) and marketing descriptions.
* **🖱️ Interactive Visuals:** A dynamic scatter plot built with **Recharts** featuring a "Highlighter Mode" to isolate specific clusters via UI summary cards.
* **📊 Enterprise-Grade Export:** Generate comprehensive reports in **PDF** or **Excel (.xlsx)**, preserving both the raw mathematical results and the AI-generated insights.

---

## 🏗️ Architecture & Logic

The project follows a modular architecture to separate data processing from AI interpretation:

1. **Preprocessing:** Data is cleaned and optionally standardized using a Z-score normalization layer.
2. **Clustering Engine:** A custom implementation of the K-Means algorithm handles the iterative centroid assignment.
3. **Heuristic Feed:** Instead of sending raw data to the LLM (preserving privacy and tokens), we send **statistical heuristics** (centroids, density, and average values) to Gemini.
4. **JSON Mapping:** Gemini is prompted to return strictly structured JSON, which the frontend then maps to the UI state.

---

## 🛠️ Tech Stack

| Category | Technology |
| --- | --- |
| **Framework** | Next.js 14 (App Router), TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Data Viz** | Recharts |
| **AI Integration** | Google Generative AI SDK (@google/generative-ai) |
| **Export Engines** | jsPDF, xlsx (SheetJS) |
| **Package Manager** | pnpm |

---

## ⚙️ Getting Started

### 1. Prerequisites

* Node.js (v18+)
* pnpm (`npm install -g pnpm`)

### 2. Installation

```bash
git clone https://github.com/matiasrodriguezc/k-means-clustering-ai-naming.git
cd k-means-clustering-ai-naming
pnpm install

```

### 3. Environment Variables

Create a `.env.local` in the root directory:

```env
GEMINI_API_KEY="your_api_key_from_google_ai_studio"

```

### 4. Development

```bash
pnpm run dev

```

---

## 📬 Contact

**Matías Rodríguez Cárdenas** - Systems Engineering Student

* **LinkedIn:** [linkedin.com/in/matiasrodriguezc](https://www.linkedin.com/in/matiasrodriguezc)
* **GitHub:** [@matiasrodriguezc](https://github.com/matiasrodriguezc)
* **Email:** [matiasrodriguezc01@gmail.com](mailto:matiasrodriguezc01@gmail.com)
