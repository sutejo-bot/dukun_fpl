export const handler = async (event, context) => {
  try {
    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: { 'User-Agent': 'FPL-Optimizer/1.0' }
    });
    const data = await response.json();
    
    const teamsMap = {};
    data.teams.forEach((t) => { teamsMap[t.id] = t.short_name; });
    
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
    const upcomingFixtures = fixturesData.slice(0, 10).map((f) => ({
      id: f.id,
      homeTeam: teamsMap[f.team_h],
      awayTeam: teamsMap[f.team_a],
      difficulty: f.team_h_difficulty,
      date: new Date(f.kickoff_time).toLocaleString('id-ID', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    }));

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
