import { GoogleGenAI } from '@google/genai';

export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
       return { 
         statusCode: 500, 
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ error: 'GEMINI_API_KEY is not set in Netlify Environment Variables.' }) 
       };
    }

    const ai = new GoogleGenAI({ apiKey });

    // Ambil data real untuk konteks AI
    const responseData = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: { 'User-Agent': 'FPL-Optimizer/1.0' }
    });
    const data = await responseData.json();

    const teamsMap = {};
    data.teams.forEach((t) => { teamsMap[t.id] = t.short_name; });
    const posMap = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
    
    const topPlayers = data.elements.map((p) => ({
      name: p.web_name,
      team: teamsMap[p.team],
      pos: posMap[p.element_type],
      price: p.now_cost / 10,
      points: p.total_points,
      form: p.form,
      xG: p.expected_goals,
      xA: p.expected_assists
    })).sort((a, b) => b.points - a.points).slice(0, 60);

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Anda adalah "Si Mbah", seorang dukun spiritual yang kebetulan ahli bermain Fantasy Premier League (FPL).\nBerikut adalah data 60 pemain dengan poin tertinggi saat ini dari web resmi FPL:\n${JSON.stringify(topPlayers)}\nTolong berikan panduan bermain FPL untuk pekan ini bergaya dukun sakti namun menggunakan bahasa Indonesia yang santai, kocak, dan mudah dimengerti. Panggil user dengan sebutan "Cucu" atau "Ngger".\n1. Berikan 3 Rekomendasi Kapten (Pemain yang akan digandakan poinnya) dengan alasan sederhana berdasarkan data form dan poin.\n2. Berikan 2 Rekomendasi pemain untuk dibeli (Transfer In) dan 2 pemain untuk dijual (Transfer Out).\n3. Berikan tips singkat atau panduan strategi FPL untuk pekan ini.\nKembalikan HANYA format JSON berikut tanpa blok kode markdown:\n{\n  "captainPicks": [{"name": "Nama", "reasoning": "Alasan..."}],\n  "transfersIn": [{"name": "Nama", "reasoning": "Alasan..."}],\n  "transfersOut": [{"name": "Nama", "reasoning": "Alasan..."}],\n  "oddsInsights": "Penjelasan taktis..."\n}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: response.text || '{}'
    };
  } catch (error) {
    console.error("AI Generation Error:", error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Gagal mengambil saran FPL.' })
    };
  }
};
