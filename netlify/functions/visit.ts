let visitCount = 0;

export const handler = async (event: any) => {
  if (event.httpMethod === 'POST') {
    visitCount += 1;
  }
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ count: visitCount })
  };
};
