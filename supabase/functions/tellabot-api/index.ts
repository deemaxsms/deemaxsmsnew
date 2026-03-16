// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cmd, ...params } = await req.json()
    
    // Tell-A-Bot API configuration
    const API_BASE_URL = 'https://www.tellabot.com/sims/api_command.php'
    const API_KEY = 'zV17cs7yofh6GXW9g6Ec9hC9cQwqhjZX'
    const USERNAME = 'weszn'
    
    console.log('Tell-A-Bot API Request:', { cmd, params })
    
    // Build query parameters - use correct parameter names
    const queryParams = new URLSearchParams({
      cmd,
      user: USERNAME,  // Tell-A-Bot uses 'user' not 'username'
      api_key: API_KEY,
      ...Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      )
    })
    
    console.log('Query params:', queryParams.toString())
    
    // Make request to Tell-A-Bot API
    const response = await fetch(`${API_BASE_URL}?${queryParams}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Tell-A-Bot API returned ${response.status}: ${response.statusText}`)
    }
    
    const responseText = await response.text()
    console.log('Tell-A-Bot API Response:', responseText)
    
    // Try to parse as JSON, fallback to text response
    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      // If not JSON, wrap in standard response format
      data = {
        status: 'ok',
        message: responseText
      }
    }
    
    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('Tell-A-Bot API Error:', error)
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: error.message || 'Internal server error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})