import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'JPB SRL Financial Manager' });
  });

  // AI Financial Diagnosis
  app.post('/api/gemini/analyze-financials', async (req, res) => {
    try {
      const { projectData, overallMetrics } = req.body;
      const ai = getAiClient();

      const prompt = `Actúa como Director Financiero y Auditor Senior en Construcción e Ingeniería Civil para "JPB SRL".
Analiza los siguientes datos financieros y presupuestarios de las obras en curso:

DATOS GLOBALES:
${JSON.stringify(overallMetrics, null, 2)}

DETALLE DE OBRAS Y APLICACIÓN DE FONDOS:
${JSON.stringify(projectData, null, 2)}

Por favor genera un diagnóstico ejecutivo en formato JSON con la siguiente estructura exacta:
{
  "resumenEjecutivo": "string (resumen conciso de 2-3 oraciones sobre el estado financiero general de JPB SRL)",
  "saludFinancieraGlobal": "Optima" | "Atencion" | "Critica",
  "scoreSalud": number (0-100),
  "alertasCriticas": [
    {
      "obraId": "string o 'GLOBAL'",
      "obraNombre": "string",
      "tipo": "DesvioPresupuestario" | "Liquidez" | "RiesgoInflacion" | "AvanceFisicoVsFinanciero",
      "nivel": "ALTO" | "MEDIO" | "BAJO",
      "descripcion": "string detallada",
      "impactoEstimado": "string con monto estimado",
      "accionRecomendada": "string concreto"
    }
  ],
  "estrategiaAplicacionFondos": [
    {
      "prioridad": number,
      "concepto": "string",
      "justificacion": "string",
      "montoSugerido": "string"
    }
  ],
  "oportunidadesAhorro": [
    "string"
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      res.json({ success: true, analysis: JSON.parse(responseText) });
    } catch (error: any) {
      console.error('Error analyzing financials:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Error al procesar análisis con Gemini',
      });
    }
  });

  // AI Fund Allocation Optimizer
  app.post('/api/gemini/optimize-allocation', async (req, res) => {
    try {
      const { availableFunds, pendingApplications, activeProjects } = req.body;
      const ai = getAiClient();

      const prompt = `Como Responsable de Tesorería y Control de Gestión de la constructora JPB SRL, debes sugerir la distribución óptima de fondos disponibles.
FONDOS DISPONIBLES EN BANCOS/CAJA: $${availableFunds}

SOLICITUDES DE APLICACIÓN DE FONDOS Y FACTURAS PENDIENTES:
${JSON.stringify(pendingApplications, null, 2)}

ESTADO DE LAS OBRAS:
${JSON.stringify(activeProjects, null, 2)}

Determina cuáles pagos y aplicaciones de fondos realizar de forma prioritaria para no frenar la ruta crítica de las obras, evitar multas/intereses y optimizar descuentos por pronto pago.

Responde estrictamente en formato JSON con la estructura:
{
  "totalDisponible": number,
  "totalAsignado": number,
  "remanente": number,
  "criterioAplicado": "string explicando la lógica de asignación financiera",
  "distribucion": [
    {
      "solicitudId": "string",
      "obraNombre": "string",
      "beneficiario": "string",
      "rubro": "string",
      "montoSolicitado": number,
      "montoAsignado": number,
      "estado": "APROBADO_TOTAL" | "APROBADO_PARCIAL" | "POSTERGADO",
      "prioridad": "ALTA" | "MEDIA" | "BAJA",
      "motivo": "string justificativo"
    }
  ],
  "consejosTesoreria": [
    "string"
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      res.json({ success: true, plan: JSON.parse(responseText) });
    } catch (error: any) {
      console.error('Error optimizing allocation:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Error al optimizar fondos con Gemini',
      });
    }
  });

  // AI Smart Document / Ticket / Expense Extraction
  app.post('/api/gemini/parse-expense', async (req, res) => {
    try {
      const { textContent, base64Image, mimeType } = req.body;
      const ai = getAiClient();

      const parts: any[] = [];
      if (base64Image && mimeType) {
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Image,
          },
        });
      }

      parts.push({
        text: `Eres un asistente contable para la constructora JPB SRL. Analiza el siguiente comprobante/ticket/factura de obra y clasifícalo en los rubros de construcción correspondientes:
Texto o descripción adicional: "${textContent || ''}"

Los rubros estándar son:
- "Movimiento de Suelos y Cimientos"
- "Estructura de Hormigón Armado"
- "Albañilería y Mampostería"
- "Instalaciones Sanitarias y Gas"
- "Instalaciones Eléctricas y Especiales"
- "Terminaciones y Revestimientos"
- "Carpinterías y Vidrios"
- "Subcontratos Especializados"
- "Mano de Obra Directa (Jornales)"
- "Maquinarias, Equipos y Fletes"
- "Gastos Generales y Seguros"

Devuelve un JSON exacto:
{
  "proveedor": "string",
  "cuit": "string o N/A",
  "tipoComprobante": "Factura A" | "Factura B" | "Recibo" | "Remito" | "Ticket" | "Certificado",
  "numeroComprobante": "string",
  "fecha": "YYYY-MM-DD",
  "montoTotal": number,
  "moneda": "ARS" | "USD",
  "rubroSugerido": "string (uno de la lista)",
  "detalleItems": [
    {
      "descripcion": "string",
      "cantidad": number,
      "precioUnitario": number,
      "subtotal": number
    }
  ],
  "observacionesAuditoria": "string"
}`
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      res.json({ success: true, expense: JSON.parse(responseText) });
    } catch (error: any) {
      console.error('Error parsing expense:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Error al procesar comprobante',
      });
    }
  });

  // AI Financial Advisor Chat
  app.post('/api/gemini/advisor', async (req, res) => {
    try {
      const { messages, context } = req.body;
      const ai = getAiClient();

      const systemInstruction = `Eres "JPB Copilot Financiero", el asesor de inteligencia artificial de la empresa constructora JPB SRL.
Tu función es brindar asesoramiento técnico, presupuestario y de flujo de fondos para directores de obra, jefes de compras, gerentes financieros y socios de la constructora.

Contexto actual de la empresa y obras de JPB SRL:
${JSON.stringify(context, null, 2)}

Directrices:
- Responde siempre con precisión técnica de la industria de la construcción (rendimientos, acopios, certificados de obra, curvas S, fondo de reparo, redeterminación de precios por CAC o inflación, control de desvíos en rubros).
- Sé profesional, claro, directo y enfocado en maximizar la rentabilidad y liquidez de las obras.
- Puedes utilizar formato Markdown legible con negritas, listas y tablas si es necesario.`;

      const contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: contents,
        config: {
          systemInstruction,
        },
      });

      res.json({ success: true, reply: response.text || 'Sin respuesta generada.' });
    } catch (error: any) {
      console.error('Error in advisor:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Error en el asistente JPB Copilot',
      });
    }
  });

  // Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JPB SRL Server running on port ${PORT}`);
  });
}

startServer();
