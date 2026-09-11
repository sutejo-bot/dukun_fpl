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
    })).sort((a, b) => b.points - a.points).slice(0, 25);

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Anda adalah "Si Mbah", dukun sakti ahli Fantasy Premier League (FPL). Berdasarkan penerawangan ghaib Anda yang bersumber dari kanal berita bola Liga Inggris, bocoran bandar bola (odds), dan data statistik internal FPL.\nBerikut 25 pemain performa terbaik saat ini:\n${JSON.stringify(topPlayers)}\nBerikan panduan FPL pekan ini bergaya dukun sakti dengan bahasa Indonesia santai, kocak, ringkas, padat, dan cepat tanpa bertele-tele. Sapa dengan "Cucu" atau "Ngger".\n1. 3 Rekomendasi Kapten (alasan tajam 1 kalimat, kombinasikan analisis bandar/odds).\n2. 2 Rekomendasi Transfer In (beli) & 2 Transfer Out (jual) (alasan tajam 1 kalimat).\n3. Wejangan taktis singkat 1-2 kalimat (bisikan dari berita liga inggris).\nFormat HANYA JSON persis berikut tanpa markdown:\n{\n  "captainPicks": [{"name": "Nama", "reasoning": "Alasan singkat..."}],\n  "transfersIn": [{"name": "Nama", "reasoning": "Alasan singkat..."}],\n  "transfersOut": [{"name": "Nama", "reasoning": "Alasan singkat..."}],\n  "oddsInsights": "Wejangan taktis..."\n}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6,
        thinkingConfig: { thinkingBudget: 0 },
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
