import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const PORT = 3000;
const app = express();
app.use(express.json());

let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    console.log('Gemini API initialized successfully for TrendHunter.');
  } catch (err) {
    console.error('Error initializing Gemini:', err);
  }
}

const mockTrends = [
  {
    id: '1',
    title: 'Agencias de Automatización con IA',
    description: 'Implementar flujos de trabajo con IA (como chatbots y automatización de correos) para negocios locales.',
    cost: '$10,000 - $25,000 MXN',
    roi: '1 a 2 meses',
    potentialScore: 94,
    category: 'Tecnología',
    type: 'Digital',
    margin: '75%',
    risk: 'Bajo',
    suppliers: 'OpenAI, Make.com, Zapier, Anthropic',
    googleSearches: '+310% en el último trimestre',
    tiktokGrowth: '+480% en videos de #IAparaNegocios',
    competition: 'Baja en ciudades medianas',
    realTimeAlert: '⚡ Esta tendencia subió 220% en búsquedas locales y EE.UU. En México llegará a su pico máximo en 2 meses.'
  },
  {
    id: '2',
    title: 'Dark Kitchens Especializadas (Vegano/Keto)',
    description: 'Cocinas ocultas enfocadas en nichos dietéticos con alta demanda en apps de delivery.',
    cost: '$50,000 - $120,000 MXN',
    roi: '5 a 8 meses',
    potentialScore: 88,
    category: 'Alimentos',
    type: 'Híbrido',
    margin: '40%',
    risk: 'Medio',
    suppliers: 'Proveedores locales orgánicos, Rappi/UberEats Partners',
    googleSearches: '+180% en búsquedas de comida saludable a domicilio',
    tiktokGrowth: '+250% en tendencias de recetas Keto/Vegan',
    competition: 'Media en zonas metropolitanas',
    realTimeAlert: '🔥 Alta demanda de entregas nocturnas en zonas corporativas.'
  },
  {
    id: '3',
    title: 'Vending Machines Saludables',
    description: 'Máquinas expendedoras con snacks orgánicos, sin gluten y saludables en oficinas y gimnasios.',
    cost: '$40,000 - $90,000 MXN',
    roi: '6 a 10 meses',
    potentialScore: 82,
    category: 'Retail',
    type: 'Local',
    margin: '50%',
    risk: 'Bajo',
    suppliers: 'Importadoras de Vending MX, Distribuidoras de Snacks Fitness',
    googleSearches: '+140% en interés de instalaciones corporativas',
    tiktokGrowth: '+190% en contenido de hábitos saludables',
    competition: 'Baja en gimnasios y universidades privadas',
    realTimeAlert: '📈 Crecimiento del 180% en contrataciones por empresas con políticas de bienestar.'
  },
  {
    id: '4',
    title: 'Micro-servicios de Limpieza Ecológica',
    description: 'Servicio de limpieza de oficinas y hogares utilizando únicamente productos biodegradables y ecológicos.',
    cost: '$8,000 - $18,000 MXN',
    roi: '1 a 3 meses',
    potentialScore: 89,
    category: 'Servicios',
    type: 'Local',
    margin: '65%',
    risk: 'Bajo',
    suppliers: 'Distribuidoras de químicos biodegradables certificados',
    googleSearches: '+210% en servicios ecológicos para oficinas',
    tiktokGrowth: '+320% en ASMR de limpieza sustentable',
    competition: 'Muy baja con diferenciador ecológico',
    realTimeAlert: '🌱 Tendencia impulsada por certificación ESG en pequeñas y medianas empresas.'
  }
];

app.get('/api/trends', async (req, res) => {
  try {
    const city = req.query.city as string;

    if (!ai || !city) {
      return res.json(mockTrends);
    }

    const prompt = `Actúa como un consultor de negocios experto para la ciudad de "${city}". 
Genera 10 ideas de negocios altamente rentables, innovadoras y específicas para las necesidades de ${city}. 
Devuelve ÚNICAMENTE un array de objetos JSON válido, sin formato markdown adicional, con esta estructura exacta para cada idea:
[
  {
    "id": "1",
    "title": "Título corto y atractivo",
    "description": "Descripción de 2 líneas.",
    "cost": "$XX,XXX MXN",
    "roi": "X a Y meses",
    "potentialScore": número entre 75 y 98,
    "category": "Tecnología | Alimentos | Retail | Servicios",
    "type": "Local | Digital | Híbrido",
    "margin": "XX%",
    "risk": "Bajo | Medio | Alto",
    "suppliers": "Principales proveedores sugeridos",
    "googleSearches": "Métrica de búsquedas Google",
    "tiktokGrowth": "Métrica de crecimiento en TikTok",
    "competition": "Nivel de competencia en la zona",
    "realTimeAlert": "Alerta estratégica de tendencia con porcentaje de crecimiento"
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "[]";
    const trends = JSON.parse(text);
    res.json(trends);
  } catch (error: any) {
    console.error('Error generating trends:', error);
    res.json(mockTrends);
  }
});

app.post('/api/generate-plan', async (req, res) => {
  try {
    const { trendTitle, city } = req.body;
        
    if (!ai) {
      return res.json({
        plan: `### Plan de Ejecución para ${trendTitle} en ${city || 'tu ciudad'}\n\n1. **Investigación:** Analiza la competencia local en ${city || 'la zona'}.\n2. **Presupuesto:** Asegura el capital inicial estimado.\n3. **Lanzamiento:** Crea una campaña de marketing local enfocada en tu nicho.\n\n*(Nota: Configura GEMINI_API_KEY en los secretos para generar un plan detallado con Inteligencia Artificial).*`
      });
    }

    const prompt = `Actúa como un consultor de negocios experto. El usuario de nuestra app "TrendHunter AI" quiere iniciar el siguiente negocio/tendencia: "${trendTitle}". La ciudad objetivo es: "${city || 'una ciudad general'}".\nPor favor, proporciona:\n1. Un breve análisis (2-3 líneas) del potencial de este negocio en esa ciudad (o en general si no hay ciudad específica).\n2. Un plan paso a paso muy accionable (3 a 4 pasos claros) para ejecutarlo y conseguir los primeros clientes.\nUsa un formato directo en Markdown, usando ## y ### para títulos, y viñetas o listas numeradas. Sé inspirador y pragmático.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({ plan: response.text });
  } catch (error: any) {
    console.error('Error generating plan:', error);
    res.status(500).json({ error: 'Error al generar el plan de ejecución.' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!ai) {
      return res.json({
        reply: `*(Nota: Configura GEMINI_API_KEY en los secretos para usar el Asistente IA).*`
      });
    }

    const systemInstruction = `Eres el asistente virtual experto de TrendHunter AI. Tu objetivo es ayudar a emprendedores a resolver dudas, hacer proyecciones financieras básicas y descubrir nuevos modelos de negocio (descubrimiento dinámico). Responde de manera concisa, inspiradora y práctica. Usa formato Markdown.`;

    let fullPrompt = `Historial de la conversación:\n`;
    if (history && history.length > 0) {
        history.forEach((msg: any) => {
            fullPrompt += `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}\n`;
        });
    }
    fullPrompt += `\nUsuario: ${message}\nAsistente:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: fullPrompt,
      config: {
          systemInstruction: systemInstruction
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Error al procesar el mensaje.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TrendHunter Server running on http://localhost:${PORT}`);
  });
}
startServer();
