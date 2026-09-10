import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Fetch real data from official FPL API
  app.get('/api/fpl-data', async (req, res) => {
    try {
      const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
        headers: { 'User-Agent': 'FPL-Optimizer/1.0' }
      });
      const data = await response.json();
      
      const teamsMap: Record<number, string> = {};
      data.teams.forEach((t: any) => { teamsMap[t.id] = t.short_name; });
      
      const posMap: Record<number, string> = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
      
      const players = data.elements.map((p: any) => ({
        id: p.id,
        name: p.web_name,
        team: teamsMap[p.team],
        position: posMap[p.element_type],
        price: p.now_cost / 10,
        form: parseFloat(p.form),
        points: p.total_points,
        xG: parseFloat(p.expected_goals || 0),
        xA: parseFloat(p.expected_assists || 0),
        ictIndex: parseFloat(p.ict_index || 0),
        selectedByPercent: p.selected_by_percent
      })).sort((a: any, b: any) => b.points - a.points);

      const fixResponse = await fetch('https://fantasy.premierleague.com/api/fixtures/?future=1', {
        headers: { 'User-Agent': 'FPL-Optimizer/1.0' }
      });
      const fixturesData = await fixResponse.json();
      const upcomingFixtures = fixturesData.slice(0, 10).map((f: any) => ({
        id: f.id,
        homeTeam: teamsMap[f.team_h],
        awayTeam: teamsMap[f.team_a],
        difficulty: f.team_h_difficulty,
        date: new Date(f.kickoff_time).toLocaleString('id-ID', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
      }));

      res.json({ players, fixtures: upcomingFixtures });
    } catch (error) {
      console.error("FPL API Error:", error);
      res.status(500).json({ error: 'Gagal mengambil data FPL' });
    }
  });

  app.post('/api/fpl-advice', async (req, res) => {
    try {
      // Ambil data real untuk konteks AI
      const responseData = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
        headers: { 'User-Agent': 'FPL-Optimizer/1.0' }
      });
      const data = await responseData.json();
      const teamsMap: Record<number, string> = {};
      data.teams.forEach((t: any) => { teamsMap[t.id] = t.short_name; });
      const posMap: Record<number, string> = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
      
      const topPlayers = data.elements.map((p: any) => ({
        name: p.web_name,
        team: teamsMap[p.team],
        pos: posMap[p.element_type],
        price: p.now_cost / 10,
        points: p.total_points,
        form: p.form,
        xG: p.expected_goals,
        xA: p.expected_assists
      })).sort((a: any, b: any) => b.points - a.points).slice(0, 60);

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Anda adalah "Si Mbah", seorang dukun spiritual yang kebetulan ahli bermain Fantasy Premier League (FPL).
Berikut adalah data 60 pemain dengan poin tertinggi saat ini dari web resmi FPL:
${JSON.stringify(topPlayers)}

Tolong berikan panduan bermain FPL untuk pekan ini bergaya dukun sakti namun menggunakan bahasa Indonesia yang santai, kocak, dan mudah dimengerti. Panggil user dengan sebutan "Cucu" atau "Ngger".
1. Berikan 3 Rekomendasi Kapten (Pemain yang akan digandakan poinnya) dengan alasan sederhana berdasarkan data form dan poin.
2. Berikan 2 Rekomendasi pemain untuk dibeli (Transfer In) dan 2 pemain untuk dijual (Transfer Out).
3. Berikan tips singkat atau panduan strategi FPL untuk pekan ini.

Kembalikan HANYA format JSON berikut tanpa blok kode markdown:
{
  "captainPicks": [{"name": "Nama", "reasoning": "Alasan..."}],
  "transfersIn": [{"name": "Nama", "reasoning": "Alasan..."}],
  "transfersOut": [{"name": "Nama", "reasoning": "Alasan..."}],
  "oddsInsights": "Penjelasan taktis..."
}`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const jsonStr = response.text;
      if (jsonStr) {
        res.json(JSON.parse(jsonStr));
      } else {
        throw new Error("No response from AI");
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: 'Gagal mengambil saran FPL.' });
    }
  });

  // Vite middleware for development
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
    console.log("Server running on http://localhost:" + PORT);
  });
}

startServer();
