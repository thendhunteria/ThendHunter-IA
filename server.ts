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
    title: 'E-commerce Transfronterizo LatAm-USA (Dropshipping de Nicho)',
    description: 'Comercio digital conectando artesanías y productos orgánicos de Latinoamérica hacia consumidores en EE.UU.',
    cost: '$180,000 - $350,000 MXN',
    roi: '4 a 6 meses',
    potentialScore: 96,
    category: 'Tecnología',
    type: 'Digital',
    scope: 'Mundial',
    margin: '65%',
    risk: 'Medio',
    suppliers: 'Productores directos Oaxaca/Jalisco, Shopify, DHL Express, Stripe',
    googleSearches: '+420% en búsquedas de productos artesanales en EE.UU.',
    tiktokGrowth: '+650% en hashtags de #LatinBusiness',
    competition: 'Media en marcas premium',
    realTimeAlert: '🌎 Tendencia Global: Demanda disparada 310% en mercado hispano de EE.UU. e Italia.'
  },
  {
    id: '2',
    title: 'Agencias de Micro-Automatización con IA para Pymes Locales',
    description: 'Implementación de agentes de WhatsApp y flujos de trabajo con IA desde casa para negocios de tu colonia.',
    cost: '$4,000 - $12,000 MXN',
    roi: '15 a 30 días',
    potentialScore: 94,
    category: 'Tecnología',
    type: 'Digital',
    scope: 'Local',
    margin: '85%',
    risk: 'Bajo',
    suppliers: 'OpenAI, Make.com, ManyChat, WhatsApp Cloud API',
    googleSearches: '+380% en automatización de ventas locales',
    tiktokGrowth: '+520% en tutoriales de #IAparaNegocios',
    competition: 'Baja en ciudades secundarias',
    realTimeAlert: '⚡ Alta viabilidad: Mínimo capital inicial y retorno garantizado en el primer cliente.'
  },
  {
    id: '3',
    title: 'Cadena de Dark Kitchens de Comida Saludable Híbrida',
    description: 'Cocinas industriales estratégicas enfocadas en planes de alimentación corporativa y keto para delivery nacional.',
    cost: '$150,000 - $280,000 MXN',
    roi: '6 a 10 meses',
    potentialScore: 90,
    category: 'Alimentos',
    type: 'Híbrido',
    scope: 'Nacional',
    margin: '45%',
    risk: 'Medio-Alto',
    suppliers: 'Distribuidoras de alimentos grado industrial, Rappi/UberEats Fleet',
    googleSearches: '+210% en meal prep por suscripción',
    tiktokGrowth: '+390% en recetas saludables y fitness',
    competition: 'Media en metrópolis',
    realTimeAlert: '🇲🇽 Tendencia Nacional: Alta demanda en parques industriales y zonas financieras.'
  },
  {
    id: '4',
    title: 'Agencia de Marketing de Influencers de Nicho (UGC local)',
    description: 'Gestión de creadores de contenido locales para restaurantes, clínicas y boutiques sin necesidad de oficina.',
    cost: '$3,500 - $8,000 MXN',
    roi: '1 mes',
    potentialScore: 89,
    category: 'Servicios',
    type: 'Digital',
    scope: 'América',
    margin: '80%',
    risk: 'Bajo',
    suppliers: 'CapCut, Canva Pro, CapCut, Redes Sociales',
    googleSearches: '+290% en contenido UGC para marcas',
    tiktokGrowth: '+480% en creadores de nicho',
    competition: 'Baja en ciudades pequeñas',
    realTimeAlert: '📣 Crecimiento acelerado: Marcas prefieren micro-influencers locales por alto engagement.'
  },
  {
    id: '5',
    title: 'Red de Estaciones de Recarga Solar y Vending Eco',
    description: 'Instalación de tótems de carga para smartphones y vending de bebidas frías sostenibles en plazas y campus.',
    cost: '$200,000 - $450,000 MXN',
    roi: '8 a 12 meses',
    potentialScore: 88,
    category: 'Retail',
    type: 'Local',
    scope: 'Mundial',
    margin: '55%',
    risk: 'Medio',
    suppliers: 'Importadoras de paneles solares, Vending Solutions MX',
    googleSearches: '+190% en soluciones sostenibles urbanas',
    tiktokGrowth: '+310% en tecnología verde',
    competition: 'Muy baja',
    realTimeAlert: '🌱 Tendencia Internacional: Crecimiento exponencial impulsado por iniciativas ESG corporativas.'
  },
  {
    id: '6',
    title: 'Servicio de Sanitización y Detailing Ecológico Móvil',
    description: 'Lavado y detallado de autos a domicilio con productos sin agua y maquinaria de vapor portátil.',
    cost: '$6,000 - $15,000 MXN',
    roi: '1 a 2 meses',
    potentialScore: 91,
    category: 'Servicios',
    type: 'Local',
    scope: 'Local',
    margin: '70%',
    risk: 'Bajo',
    suppliers: 'Biodegradables MX, Maquinaria de vapor portátil',
    googleSearches: '+240% en car wash a domicilio ecológico',
    tiktokGrowth: '+410% en videos de detallado automotriz',
    competition: 'Baja en zonas residenciales',
    realTimeAlert: '🚗 Negocio de rápida adopción: Inversión ligera con clientes recurrentes quincenales.'
  }
];

app.get('/api/trends', async (req, res) => {
  try {
    const city = req.query.city as string;

    if (!ai || !city) {
      return res.json(mockTrends);
    }

    const prompt = `Actúa como un consultor de negocios internacional experto para la ciudad de "${city}". 
Genera 10 ideas de negocios altamente rentables e innovadoras para ${city}.
REQUISITO CLAVE:
1. Las ideas DEBEN alternar de forma estricta entre Alta Inversión (Capital alto $100k-$400k MXN) y Baja Inversión (Micro capital $3k-$15k MXN viables).
2. Deben cubrir diferentes alcances geográficos: Local, Nacional, América, y Mundial.

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
    "scope": "Local | Nacional | América | Mundial",
    "margin": "XX%",
    "risk": "Bajo | Medio | Alto",
    "suppliers": "Principales proveedores sugeridos",
    "googleSearches": "Métrica de búsquedas Google",
    "tiktokGrowth": "Métrica de crecimiento en TikTok",
    "competition": "Nivel de competencia en la zona",
    "realTimeAlert": "Alerta estratégica de tendencia con alcance geográfico"
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
