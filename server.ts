import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const VISITOR_FILE = path.join(process.cwd(), 'visitor-count.json');
const GUESTBOOK_FILE = path.join(process.cwd(), 'guestbook.json');

function getVisitorCount(): number {
  try {
    if (fs.existsSync(VISITOR_FILE)) {
      const data = JSON.parse(fs.readFileSync(VISITOR_FILE, 'utf-8'));
      if (typeof data.count === 'number') return data.count;
    }
  } catch (e) {
    console.error('Gagal membaca hitungan pengunjung:', e);
  }
  return 0;
}

function incrementVisitorCount(): number {
  try {
    const current = getVisitorCount();
    const next = current + 1;
    fs.writeFileSync(VISITOR_FILE, JSON.stringify({ count: next, lastVisited: new Date().toISOString() }, null, 2));
    return next;
  } catch (e) {
    console.error('Gagal menyimpan hitungan pengunjung:', e);
    return 0;
  }
}

function getGuestbookEntries(): any[] {
  try {
    if (fs.existsSync(GUESTBOOK_FILE)) {
      const data = JSON.parse(fs.readFileSync(GUESTBOOK_FILE, 'utf-8'));
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error('Gagal membaca buku pasien:', e);
  }
  return [];
}

function saveGuestbookEntries(entries: any[]): boolean {
  try {
    fs.writeFileSync(GUESTBOOK_FILE, JSON.stringify(entries, null, 2));
    return true;
  } catch (e) {
    console.error('Gagal menyimpan buku pasien:', e);
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Visitor Counter Endpoint
  app.get('/api/visit', (req, res) => {
    const count = getVisitorCount();
    res.json({ count });
  });

  app.post('/api/visit', (req, res) => {
    const count = incrementVisitorCount();
    res.json({ count });
  });

  // Guestbook (Buku Pasien) Endpoints
  app.get('/api/guestbook', (req, res) => {
    const entries = getGuestbookEntries();
    res.json({ entries });
  });

  app.post('/api/guestbook', (req, res) => {
    try {
      const { name, type, message } = req.body;
      const cleanName = typeof name === 'string' ? name.trim().slice(0, 60) : '';
      const cleanMsg = typeof message === 'string' ? message.trim().slice(0, 500) : '';
      const cleanType = ['cacian', 'makian', 'nasehat'].includes(type) ? type : 'cacian';

      if (!cleanName || !cleanMsg) {
        return res.status(400).json({ error: 'Nama dan isi curahan hati/nasehat wajib diisi.' });
      }

      const entries = getGuestbookEntries();
      const newEntry = {
        id: `gb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        type: cleanType,
        message: cleanMsg,
        timestamp: new Date().toISOString(),
        likes: 0
      };

      const updated = [newEntry, ...entries].slice(0, 150);
      saveGuestbookEntries(updated);
      res.json({ success: true, entry: newEntry, entries: updated });
    } catch (e) {
      console.error('Gagal menambah pasien:', e);
      res.status(500).json({ error: 'Terjadi kesalahan sistem' });
    }
  });

  app.post('/api/guestbook/like', (req, res) => {
    try {
      const { id } = req.body;
      const entries = getGuestbookEntries();
      const entry = entries.find((e: any) => e.id === id);
      if (entry) {
        entry.likes = (entry.likes || 0) + 1;
        saveGuestbookEntries(entries);
        return res.json({ success: true, likes: entry.likes, entries });
      }
      res.status(404).json({ error: 'Catatan pasien tidak ditemukan' });
    } catch (e) {
      res.status(500).json({ error: 'Gagal merespon catatan' });
    }
  });

  // Fetch real data from official FPL API
  app.get('/api/fpl-data', async (req, res) => {
    try {
      const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
        headers: { 'User-Agent': 'FPL-Optimizer/1.0' }
      });
      const data = await response.json();
      
      const fullClubNames: Record<string, string> = {
        'ARS': 'Arsenal',
        'AVL': 'Aston Villa',
        'BOU': 'Bournemouth',
        'BRE': 'Brentford',
        'BHA': 'Brighton & Hove Albion',
        'CHE': 'Chelsea',
        'COV': 'Coventry City',
        'CRY': 'Crystal Palace',
        'EVE': 'Everton',
        'FUL': 'Fulham',
        'HUL': 'Hull City',
        'IPS': 'Ipswich Town',
        'LEE': 'Leeds United',
        'LEI': 'Leicester City',
        'LIV': 'Liverpool',
        'LUT': 'Luton Town',
        'MCI': 'Manchester City',
        'MUN': 'Manchester United',
        'NEW': 'Newcastle United',
        'NFO': 'Nottingham Forest',
        'SOU': 'Southampton',
        'TOT': 'Tottenham Hotspur',
        'SUN': 'Sunderland',
        'WHU': 'West Ham United',
        'WOL': 'Wolverhampton Wanderers',
        'Arsenal': 'Arsenal',
        'Aston Villa': 'Aston Villa',
        'Bournemouth': 'Bournemouth',
        'Brentford': 'Brentford',
        'Brighton': 'Brighton & Hove Albion',
        'Chelsea': 'Chelsea',
        'Coventry City': 'Coventry City',
        'Crystal Palace': 'Crystal Palace',
        'Everton': 'Everton',
        'Fulham': 'Fulham',
        'Hull City': 'Hull City',
        'Ipswich Town': 'Ipswich Town',
        'Leeds': 'Leeds United',
        'Liverpool': 'Liverpool',
        'Man City': 'Manchester City',
        'Man Utd': 'Manchester United',
        'Newcastle': 'Newcastle United',
        "Nott'm Forest": 'Nottingham Forest',
        'Southampton': 'Southampton',
        'Spurs': 'Tottenham Hotspur',
        'Sunderland': 'Sunderland',
        'Leicester': 'Leicester City',
        'Wolves': 'Wolverhampton Wanderers',
        'West Ham': 'West Ham United',
      };

      const venueMap: Record<string, string> = {
        'Arsenal': 'Emirates Stadium, London',
        'Aston Villa': 'Villa Park, Birmingham',
        'Bournemouth': 'Vitality Stadium, Bournemouth',
        'Brentford': 'Gtech Community Stadium, London',
        'Brighton & Hove Albion': 'Amex Stadium, Falmer',
        'Brighton': 'Amex Stadium, Falmer',
        'Chelsea': 'Stamford Bridge, London',
        'Coventry City': 'Coventry Building Society Arena, Coventry',
        'Crystal Palace': 'Selhurst Park, London',
        'Everton': 'Goodison Park, Liverpool',
        'Fulham': 'Craven Cottage, London',
        'Hull City': 'MKM Stadium, Hull',
        'Ipswich Town': 'Portman Road, Ipswich',
        'Leeds United': 'Elland Road, Leeds',
        'Leeds': 'Elland Road, Leeds',
        'Leicester City': 'King Power Stadium, Leicester',
        'Liverpool': 'Anfield, Liverpool',
        'Luton Town': 'Kenilworth Road, Luton',
        'Manchester City': 'Etihad Stadium, Manchester',
        'Man City': 'Etihad Stadium, Manchester',
        'Manchester United': 'Old Trafford, Manchester',
        'Man Utd': 'Old Trafford, Manchester',
        'Newcastle United': 'St. James\' Park, Newcastle',
        'Newcastle': 'St. James\' Park, Newcastle',
        'Nottingham Forest': 'The City Ground, Nottingham',
        "Nott'm Forest": 'The City Ground, Nottingham',
        'Southampton': 'St. Mary\'s Stadium, Southampton',
        'Tottenham Hotspur': 'Tottenham Hotspur Stadium, London',
        'Spurs': 'Tottenham Hotspur Stadium, London',
        'Sunderland': 'Stadium of Light, Sunderland',
        'West Ham United': 'London Stadium, London',
        'West Ham': 'London Stadium, London',
        'Wolverhampton Wanderers': 'Molineux Stadium, Wolverhampton',
        'Wolves': 'Molineux Stadium, Wolverhampton'
      };

      const teamsMap: Record<number, string> = {};
      const teamsFullNameMap: Record<number, string> = {};
      data.teams.forEach((t: any) => { 
        teamsMap[t.id] = t.short_name;
        const fullName = fullClubNames[t.name] || fullClubNames[t.short_name] || t.name;
        teamsFullNameMap[t.id] = fullName;
      });
      
      const posMap: Record<number, string> = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
      
      const players = data.elements.map((p: any) => ({
        id: p.id,
        name: p.web_name,
        team: teamsFullNameMap[p.team] || teamsMap[p.team],
        position: posMap[p.element_type],
        price: p.now_cost / 10,
        form: parseFloat(p.form) || 0,
        points: p.total_points,
        xG: parseFloat(p.expected_goals || 0),
        xA: parseFloat(p.expected_assists || 0),
        ictIndex: parseFloat(p.ict_index || 0),
        selectedByPercent: p.selected_by_percent,
        status: p.status,
        news: p.news || '',
        chanceOfPlaying: p.chance_of_playing_next_round ?? p.chance_of_playing_this_round,
        isInjured: p.status !== 'a' || Boolean(p.news && p.news.trim().length > 0)
      })).sort((a: any, b: any) => b.points - a.points);

      const fixResponse = await fetch('https://fantasy.premierleague.com/api/fixtures/?future=1', {
        headers: { 'User-Agent': 'FPL-Optimizer/1.0' }
      });
      const fixturesData = await fixResponse.json();

      function getMbahPrediction(fixtureId: number, homeTeam: string, awayTeam: string, homeDiff: number, awayDiff: number) {
        const seed = (fixtureId * 9301 + 49297) % 233280;
        const rand = seed / 233280;
        const diffAdvantage = awayDiff - homeDiff;

        let score = '1 - 1';
        let comment = '';

        if (diffAdvantage >= 2) {
          const scores = ['2 - 0', '3 - 0', '3 - 1', '2 - 1'];
          score = scores[Math.floor(rand * scores.length)];
          const comments = [
            `Aura mistis ${homeTeam} sedang membara! Si Mbah ramalkan serangan mereka tak terbendung tim tamu.`,
            `Asap kemenyan condong kuat ke ${homeTeam}. ${awayTeam} bakal terkurung rapat di lini belakang.`,
            `Si Mbah cium bau pesta gol dari ${homeTeam}. Pertahanan lawan rawan goyah sejak menit awal.`
          ];
          comment = comments[Math.floor((rand * 7) % comments.length)];
        } else if (diffAdvantage === 1) {
          const scores = ['2 - 1', '1 - 0', '2 - 0', '1 - 1'];
          score = scores[Math.floor(rand * scores.length)];
          const comments = [
            `Dukungan suporter memberi dorongan magis. ${homeTeam} berpeluang besar mengamankan tiga poin.`,
            `Pertarungan alot, tapi garis cakra kemenangan berpihak tipis kepada ${homeTeam}.`,
            `${awayTeam} bakal gigih melawan, namun Si Mbah terawang momen krusial milik ${homeTeam}.`
          ];
          comment = comments[Math.floor((rand * 7) % comments.length)];
        } else if (diffAdvantage === 0) {
          const scores = ['1 - 1', '2 - 2', '2 - 1', '1 - 2'];
          score = scores[Math.floor(rand * scores.length)];
          const comments = [
            `Khodam kedua kubu sama kuat! Si Mbah ramalkan jual beli serangan dan berpotensi besar berbagi angka.`,
            `Duel taktik seimbang dan sengit di lini tengah, kemungkinan besar berakhir tanpa selisih gol besar.`,
            `Waspada drama pelanggaran dan gol kejutan menit akhir di laga panas ini.`
          ];
          comment = comments[Math.floor((rand * 7) % comments.length)];
        } else if (diffAdvantage === -1) {
          const scores = ['1 - 2', '0 - 1', '1 - 1', '0 - 2'];
          score = scores[Math.floor(rand * scores.length)];
          const comments = [
            `Angin rezeki berhembus ke kubu ${awayTeam}. Serangan balik kilat bakal mengejutkan tuan rumah.`,
            `Si Mbah mencium gelagat ${awayTeam} bermain lebih taktis dan berpeluang mencuri poin penuh.`,
            `${homeTeam} bernafsu menyerang tapi pertahanan mereka rawan dieksploitasi oleh ${awayTeam}.`
          ];
          comment = comments[Math.floor((rand * 7) % comments.length)];
        } else {
          const scores = ['0 - 2', '1 - 3', '0 - 3', '1 - 2'];
          score = scores[Math.floor(rand * scores.length)];
          const comments = [
            `Kekuatan armada ${awayTeam} terlalu dominan. ${homeTeam} butuh keajaiban ekstra untuk bertahan.`,
            `Si Mbah melihat bola mengalir deras ke gawang tuan rumah. Kemenangan meyakinkan untuk ${awayTeam}!`,
            `Bintang kejayaan menaungi tim tamu. Taktik cerdik ${awayTeam} bakal membungkam seisi stadion.`
          ];
          comment = comments[Math.floor((rand * 7) % comments.length)];
        }

        return { score, comment };
      }

      function formatWita(dateStr: string) {
        try {
          const d = new Date(dateStr);
          const formatted = new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Makassar',
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).format(d);
          return formatted.replace('.', ':') + ' WITA';
        } catch (e) {
          return dateStr;
        }
      }

      const upcomingFixtures = fixturesData.slice(0, 10).map((f: any) => {
        const homeName = teamsFullNameMap[f.team_h] || teamsMap[f.team_h] || `Team ${f.team_h}`;
        const awayName = teamsFullNameMap[f.team_a] || teamsMap[f.team_a] || `Team ${f.team_a}`;
        const venue = venueMap[homeName] || `${homeName} Stadium`;
        const { score, comment } = getMbahPrediction(f.id, homeName, awayName, f.team_h_difficulty || 3, f.team_a_difficulty || 3);

        return {
          id: f.id,
          homeTeam: homeName,
          awayTeam: awayName,
          venue: venue,
          difficulty: f.team_h_difficulty,
          kickoffTime: f.kickoff_time,
          date: f.kickoff_time || formatWita(f.kickoff_time),
          predictedScore: score,
          predictionComment: comment
        };
      });

      res.json({ players, fixtures: upcomingFixtures });
    } catch (error) {
      console.error("FPL API Error:", error);
      res.status(500).json({ error: 'Gagal mengambil data FPL' });
    }
  });

  app.get('/api/fpl-news', async (req, res) => {
    try {
      const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
        headers: { 'User-Agent': 'FPL-Optimizer/1.0' }
      });
      const data = await response.json();
      const teamsMap: Record<number, string> = {};
      data.teams.forEach((t: any) => { teamsMap[t.id] = t.name; });

      // Temukan pemain-pemain kunci yang sedang cedera / tumbang
      const injuredElements = data.elements
        .filter((p: any) => p.status !== 'a' && p.news && p.news.trim().length > 0)
        .sort((a: any, b: any) => b.total_points - a.total_points);

      const topInjured = injuredElements.slice(0, 4);
      const injuredNames = topInjured.map((p: any) => p.web_name).join(', ') || 'William Saliba, Jurriën Timber';
      const injuryDetails = topInjured.map((p: any) => `${p.web_name} (${p.news})`).join('; ') || 'Saliba (Back injury), Timber (Groin injury)';

      // Pemain dengan form tertinggi
      const topFormElements = [...data.elements]
        .sort((a: any, b: any) => parseFloat(b.form) - parseFloat(a.form))
        .slice(0, 3);
      const starPlayer = topFormElements[0]?.web_name || 'Mohamed Salah';
      const starTeam = teamsMap[topFormElements[0]?.team] || 'Liverpool';

      // Pemain paling banyak dibeli pekan ini
      const mostTransferredIn = [...data.elements]
        .sort((a: any, b: any) => (b.transfers_in_event || 0) - (a.transfers_in_event || 0))
        .slice(0, 3);
      const transferHype = mostTransferredIn[0]?.web_name || 'Cole Palmer';

      const now = new Date();
      const formatTimeAgo = (minutesAgo: number) => {
        if (minutesAgo < 10) return 'Baru saja';
        if (minutesAgo < 60) return `${minutesAgo} menit lalu`;
        const hours = Math.floor(minutesAgo / 60);
        return `${hours} jam lalu`;
      };

      const liveNews = [
        {
          id: `news-live-injury-${now.getTime()}`,
          title: `Laporan Darurat Medis FPL: ${injuredNames} Berstatus TUMBANG`,
          source: 'Premier League Official Injury Table & BBC Sport',
          sourceType: 'injury',
          category: 'Medis & Cedera',
          timeAgo: formatTimeAgo(8),
          officialSummary: `Catatan resmi liga mengonfirmasi status cedera sejumlah bintang: ${injuryDetails}. Manajer FPL diimbau memeriksa kesiapan bangku cadangan.`,
          mbahCommentary: `Innalillahi, dupa Si Mbah mendadak padam saat menerawang urat betis ${injuredNames}! Khodam mereka sedang lemas di ruang pijat. Jangan keras kepala menaruh mereka di starter pekan ini sebelum Si Mbah tiupkan mantra pemulihan, atau kamu bakal panen nol poin!`,
          fplImpact: {
            affectedPlayers: topInjured.map((p: any) => p.web_name),
            action: 'Lepas / Jual',
            advice: 'Ganti segera ke pemain bugar dengan menit bermain terjamin demi menghindari poin kosong.'
          }
        },
        {
          id: `news-live-star-${now.getTime()}`,
          title: `Ledakan Performa & Tuah Magis ${starPlayer} Bersama ${starTeam}`,
          source: 'Opta Analyst & Sky Sports',
          sourceType: 'official',
          category: 'Analisis Resmi',
          timeAgo: formatTimeAgo(24),
          officialSummary: `${starPlayer} mencatatkan lonjakan form tertinggi dan ancaman gol (xG/xA) paling konsisten dalam 4 pekan terakhir di Premier League.`,
          mbahCommentary: `Aura emas memancar dari ubun-ubun ${starPlayer}! Cakra keberuntungannya sedang meluap-luap laksana lahar kawah Merapi. Si Mbah wejangkan: siapa pun yang belum mengunci dia di tim, segera sediakan sesajen transfer sebelum harganya meroket tajam!`,
          fplImpact: {
            affectedPlayers: [starPlayer],
            action: 'Wajib Kapten',
            advice: 'Poros utama poin dan kandidat kapten terkuat untuk menggandakan poin pekan ini.'
          }
        },
        {
          id: `news-live-transfer-${now.getTime()}`,
          title: `Manuver Panas Bursa Transfer FPL: Perburuan Masif ${transferHype}`,
          source: 'Fabrizio Romano (Here We Go) & FPL Transfers Live',
          sourceType: 'transfer',
          category: 'Gosip Transfer Panas',
          timeAgo: formatTimeAgo(45),
          officialSummary: `Puluhan ribu manajer FPL berbondong-bondong merekrut ${transferHype} menjelang penutupan batas waktu (deadline) akibat jadwal pertandingan yang sangat menguntungkan.`,
          mbahCommentary: `Gong gaib bursa transfer berdentang kencang! Nama ${transferHype} tertulis di daun lontar kuno Si Mbah sebagai magnet poin. Tapi awas Cu, pastikan brankas anggaranmu cukup dan jangan korbankan pemain bugar lainnya secara gegabah!`,
          fplImpact: {
            affectedPlayers: [transferHype],
            action: 'Beli Segera',
            advice: 'Tren pembelian sangat tinggi. Segera rekrut sebelum harganya naik malam ini.'
          }
        },
        {
          id: `news-live-tactic-${now.getTime()}`,
          title: 'Strategi Ruang Ganti & Bahaya Rotasi Menit Bermain Big Six',
          source: 'The Athletic & Guardian Football',
          sourceType: 'dressing_room',
          category: 'Kamar Ganti',
          timeAgo: formatTimeAgo(110),
          officialSummary: 'Manajer klub-klub papan atas mulai menerapkan rotasi pemain kunci demi menjaga kebugaran di tengah padatnya jadwal liga domestik dan kompetisi kontinental.',
          mbahCommentary: 'Hawa dingin taktik rotasi berhembus kencang! Pelatih-pelatih berkepala plontos dan ahli taktik gemar mengocok susunan pemain seperti dadu koprok. Wajib hukumnya menaruh pemain cadangan pertama (Bench 1) yang pasti starter!',
          fplImpact: {
            affectedPlayers: ['Phil Foden', 'Gabriel Martinelli', 'Darwin Núñez'],
            action: 'Waspada / Pantau',
            advice: 'Pastikan urutan bangku cadangan (bench) terisi pemain aktif yang rutin bermain minimal 60 menit.'
          }
        },
        {
          id: `news-live-defense-${now.getTime()}`,
          title: 'Jimat Nirbobol: Tembok Pertahanan Kuda Hitam Curi Perhatian',
          source: 'PremierLeague.com Match Centre',
          sourceType: 'official',
          category: 'Analisis Resmi',
          timeAgo: formatTimeAgo(180),
          officialSummary: 'Klub kuda hitam seperti Nottingham Forest dan Aston Villa mencatatkan angka Expected Goals Conceded (xGC) terendah di kandang musim ini.',
          mbahCommentary: 'Gawang mereka dipagari rajah tolak bala yang sangat sakti! Penyerang lawan dibuat linglung di depan kotak penalti. Beli bek atau kiper mereka yang berharga murah meriah (£4.5m) untuk menghemat biaya.',
          fplImpact: {
            affectedPlayers: ['Ola Aina', 'Matz Sels', 'Ezri Konsa'],
            action: 'Beli Segera',
            advice: 'Aset pertahanan bernilai tinggi (value picks) dengan potensi clean sheet dan bonus poin konsisten.'
          }
        },
        {
          id: `news-live-haaland-${now.getTime()}`,
          title: 'Terawangan Haaland & Mesin Gol Manchester City Jelang Laga Krusial',
          source: 'Manchester Evening News & Sky Sports',
          sourceType: 'injury',
          category: 'Medis & Kebugaran',
          timeAgo: formatTimeAgo(240),
          officialSummary: 'Pep Guardiola memberikan kepastian kondisi fisik Erling Haaland pasca latihan pemulihan, mengonfirmasi sang striker siap memimpin lini gedor The Citizens.',
          mbahCommentary: 'Mbah sudah terawang cakra sang Cyborg Norwegia! Nafsu makannya akan gol sedang membara. Jangan sekali-kali melepas ban kapten darinya jika tidak ingin dikutuk poin minus!',
          fplImpact: {
            affectedPlayers: ['Erling Haaland', 'Kevin De Bruyne'],
            action: 'Wajib Kapten',
            advice: 'Kunci ban kapten pada Haaland tanpa ragu-ragu.'
          }
        }
      ];

      res.json({ news: liveNews, updatedAt: new Date().toISOString() });
    } catch (error) {
      console.error("FPL News Error:", error);
      res.status(500).json({ error: 'Gagal mengambil berita FPL terbaru' });
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
      })).sort((a: any, b: any) => b.points - a.points).slice(0, 25);

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Anda adalah "Si Mbah", dukun sakti ahli Fantasy Premier League (FPL). Berdasarkan penerawangan ghaib Anda yang bersumber dari kanal berita bola Liga Inggris, bocoran bandar bola (odds), dan data statistik internal FPL.
Berikut 25 pemain performa terbaik saat ini:
${JSON.stringify(topPlayers)}

Berikan panduan FPL pekan ini bergaya dukun sakti dengan bahasa Indonesia santai, kocak, ringkas, padat, dan cepat tanpa bertele-tele. Sapa dengan "Cucu" atau "Ngger".
1. 3 Rekomendasi Kapten (alasan tajam 1 kalimat, kombinasikan analisis bandar/odds).
2. 2 Rekomendasi Transfer In (beli) & 2 Transfer Out (jual) (alasan tajam 1 kalimat).
3. Wejangan taktis singkat 1-2 kalimat (bisikan dari berita liga inggris).

Format HANYA JSON persis berikut tanpa markdown:
{
  "captainPicks": [{"name": "Nama", "reasoning": "Alasan singkat..."}],
  "transfersIn": [{"name": "Nama", "reasoning": "Alasan singkat..."}],
  "transfersOut": [{"name": "Nama", "reasoning": "Alasan singkat..."}],
  "oddsInsights": "Wejangan taktis..."
}`,
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
