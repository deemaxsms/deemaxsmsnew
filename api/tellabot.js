export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Get credentials from Environment Variables (Secure)
    const TELLABOT_USER = process.env.VITE_TELLABOT_USER || 'wesz';
    const TELLABOT_API_KEY = process.env.VITE_TELL_A_BOT_API_KEY || 'zV17cs7yofh6GXW9g6Ec9hC9cQwqhjZX';

    // 2. Get data from either Body (POST) or Query (GET)
    const data_source = req.method === 'POST' ? req.body : req.query;
    const { cmd, ...params } = data_source;

    if (!cmd) {
      return res.status(400).json({ error: 'Missing cmd parameter' });
    }

    // 3. Build the TellaBot URL
    const queryParams = new URLSearchParams({
      cmd,
      user: TELLABOT_USER,
      api_key: TELLABOT_API_KEY,
      ...params
    });

    const fullUrl = `https://www.tellabot.com/sims/api_command.php?${queryParams.toString()}`;

    // 4. Make the request
    const apiResponse = await fetch(fullUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const responseText = await apiResponse.text();
    
    // 5. Try to parse as JSON, otherwise return text
    try {
      const jsonData = JSON.parse(responseText);
      res.status(200).json(jsonData);
    } catch {
      res.status(200).json({ success: true, data: responseText });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}