export const handler = async (event, context) => {
  try {
    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: { 'User-Agent': 'FPL-Optimizer/1.0' }
    });
    const data = await response.json();
    
    const fullClubNames = {
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

    const venueMap = {
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

    const teamsMap = {};
    const teamsFullNameMap = {};
    data.teams.forEach((t) => { 
      teamsMap[t.id] = t.short_name;
      const fullName = fullClubNames[t.name] || fullClubNames[t.short_name] || t.name;
      teamsFullNameMap[t.id] = fullName;
    });
    
    const posMap = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
    
    const players = data.elements.map((p) => ({
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
    })).sort((a, b) => b.points - a.points);

    const fixResponse = await fetch('https://fantasy.premierleague.com/api/fixtures/?future=1', {
      headers: { 'User-Agent': 'FPL-Optimizer/1.0' }
    });
    const fixturesData = await fixResponse.json();

    function getMbahPrediction(fixtureId, homeTeam, awayTeam, homeDiff, awayDiff) {
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

    function formatWita(dateStr) {
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

    const upcomingFixtures = fixturesData.slice(0, 10).map((f) => {
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
        date: formatWita(f.kickoff_time),
        predictedScore: score,
        predictionComment: comment
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ players, fixtures: upcomingFixtures })
    };
  } catch (error) {
    console.error("FPL API Error:", error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Gagal mengambil data FPL' })
    };
  }
};
