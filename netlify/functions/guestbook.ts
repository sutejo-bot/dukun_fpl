let guestbookEntries: any[] = [];

export const handler = async (event: any) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');

      // Check if it is a like action
      if (body.action === 'like' || event.path.endsWith('/like')) {
        const id = body.id;
        const entry = guestbookEntries.find(e => e.id === id);
        if (entry) {
          entry.likes = (entry.likes || 0) + 1;
          return { statusCode: 200, headers, body: JSON.stringify({ success: true, likes: entry.likes, entries: guestbookEntries }) };
        }
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Entry not found' }) };
      }

      // New entry
      const cleanName = typeof body.name === 'string' ? body.name.trim().slice(0, 60) : '';
      const cleanMsg = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : '';
      const cleanType = ['cacian', 'makian', 'nasehat'].includes(body.type) ? body.type : 'cacian';

      if (!cleanName || !cleanMsg) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Nama dan pesan wajib diisi' }) };
      }

      const newEntry = {
        id: `gb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        type: cleanType,
        message: cleanMsg,
        timestamp: new Date().toISOString(),
        likes: 0
      };

      guestbookEntries = [newEntry, ...guestbookEntries].slice(0, 150);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, entry: newEntry, entries: guestbookEntries }) };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Gagal memproses data' }) };
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ entries: guestbookEntries })
  };
};
