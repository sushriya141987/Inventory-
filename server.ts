import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Inventory Brief & Reorder Insights API
  app.post("/api/inventory/insights", async (req, res) => {
    try {
      const { items, logs, businessName } = req.body;

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Invalid items dataset provided" });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // High quality fallback insight if API key is not present
        const lowStockCount = items.filter((i: any) => i.quantity <= i.reorderPoint).length;
        const outOfStockCount = items.filter((i: any) => i.quantity === 0).length;

        return res.json({
          executiveSummary: `Inventory snapshot for ${businessName || "Small Business"}: ${lowStockCount} item(s) require reordering, including ${outOfStockCount} out-of-stock item(s). Reorder immediately to prevent stockouts.`,
          urgentActionRequired: lowStockCount > 0,
          healthScore: Math.max(20, Math.round(100 - (lowStockCount * 15) - (outOfStockCount * 25))),
          recommendations: items
            .filter((i: any) => i.quantity <= i.reorderPoint)
            .map((i: any) => ({
              sku: i.sku,
              itemName: i.name,
              reason: i.quantity === 0 ? "OUT OF STOCK - Critical loss of sales!" : `Quantity (${i.quantity}) is below reorder threshold (${i.reorderPoint}).`,
              suggestedReorderQty: i.idealStock - i.quantity,
              estimatedCost: Math.round((i.idealStock - i.quantity) * i.unitCost * 100) / 100,
              priority: i.quantity === 0 ? "CRITICAL" : "MEDIUM"
            })),
          inventoryHealthObservations: [
            "Current stock turnover requires proactive restocking.",
            "Consider setting safety stock levels for items with lead times > 4 days.",
            "Review supplier lead times to optimize order placement schedule."
          ]
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const prompt = `Analyze the following small business inventory dataset for "${businessName || "Business"}":
Inventory Items: ${JSON.stringify(items.map((i: any) => ({
        sku: i.sku,
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        reorderPoint: i.reorderPoint,
        idealStock: i.idealStock,
        unitCost: i.unitCost,
        retailPrice: i.retailPrice,
        leadTimeDays: i.leadTimeDays,
        supplier: i.supplier
      })))}

Recent Stock Activity Logs: ${JSON.stringify(logs ? logs.slice(0, 8) : [])}

Provide an executive inventory brief, identify risk areas, calculate restock recommendations with suggested quantities and estimated cost, and assign an overall Inventory Health Score (0-100).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert small business inventory and supply chain advisor. Produce concise, clear, actionable advice.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: {
                type: Type.STRING,
                description: "Concise summary of current inventory status and critical actions needed."
              },
              urgentActionRequired: {
                type: Type.BOOLEAN,
                description: "True if any item is critically low or out of stock."
              },
              healthScore: {
                type: Type.INTEGER,
                description: "Overall health score from 0 to 100."
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sku: { type: Type.STRING },
                    itemName: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    suggestedReorderQty: { type: Type.INTEGER },
                    estimatedCost: { type: Type.NUMBER },
                    priority: { type: Type.STRING, description: "CRITICAL, MEDIUM, or LOW" }
                  },
                  required: ["sku", "itemName", "reason", "suggestedReorderQty", "estimatedCost", "priority"]
                }
              },
              inventoryHealthObservations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["executiveSummary", "urgentActionRequired", "healthScore", "recommendations", "inventoryHealthObservations"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response text from Gemini API");
      }

      const parsedJson = JSON.parse(responseText);
      return res.json(parsedJson);

    } catch (err: any) {
      console.error("Error generating inventory insights:", err);
      return res.status(500).json({
        error: "Failed to generate AI insights",
        details: err?.message || String(err)
      });
    }
  });

  // Vite middleware for development vs Production static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
