# Weather Tool for OpenAI Assistant

This weather tool allows your OpenAI assistant to provide current weather information and forecasts for any city worldwide.

## Setup

### 1. Get OpenWeather API Key
1. Go to [OpenWeather API](https://openweathermap.org/api)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to your `.env` file:

```env
OPENWEATHER_API_KEY=your_api_key_here
```

### 2. Files Created
- `tools/weather/getWeather.js` - Weather tool functions
- `routes/weather.js` - Weather API routes
- Updated `routes/openai-twilio-express.js` - Added weather tools to OpenAI assistant

## Features

### Current Weather
- Temperature (current and feels like)
- Weather conditions (sunny, cloudy, etc.)
- Humidity percentage
- Wind speed (km/h)
- Pressure (hPa)
- Visibility (km)
- Sunrise and sunset times

### Weather Forecast
- 1-5 day forecasts
- Daily temperature and conditions
- Humidity and wind information

## API Endpoints

### Current Weather
```
GET /tools/weather/current/{city}
```
Example: `/tools/weather/current/London`

### Weather Forecast
```
GET /tools/weather/forecast/{city}?days=5
```
Example: `/tools/weather/forecast/New%20York?days=3`

### Complete Weather Info
```
GET /tools/weather/info/{city}?days=5
```
Returns both current weather and forecast

## OpenAI Assistant Integration

The weather tools are now available to your OpenAI assistant:

### Available Tools
1. **get_current_weather** - Get current weather for a city
2. **get_weather_forecast** - Get weather forecast for a city

### Example Usage
The assistant can now:
- "What's the weather like in London?"
- "Get me a 3-day forecast for New York"
- "How's the weather in Mumbai today?"

## Testing

Run the test file to verify everything works:

```bash
node test-weather.js
```

## Error Handling

The tool handles various error scenarios:
- Invalid city names
- Network issues
- API key problems
- Missing environment variables

## Response Format

### Success Response
```json
{
  "success": true,
  "weather": {
    "city": "London",
    "country": "GB",
    "temperature": 15,
    "feels_like": 12,
    "humidity": 75,
    "description": "light rain",
    "wind_speed": 12,
    "pressure": 1012,
    "visibility": 10,
    "sunrise": "07:30 AM",
    "sunset": "04:30 PM"
  },
  "response": "Current weather in London, GB:\n• Temperature: 15°C (feels like 12°C)\n• Conditions: light rain\n• Humidity: 75%\n• Wind Speed: 12 km/h\n• Pressure: 1012 hPa\n• Visibility: 10 km\n• Sunrise: 07:30 AM\n• Sunset: 04:30 PM"
}
```

### Error Response
```json
{
  "success": false,
  "error": "City \"InvalidCity\" not found. Please check the spelling and try again."
}
```

## Notes

- Temperature is in Celsius
- Wind speed is converted to km/h
- Visibility is in kilometers
- Times are in 12-hour format
- The tool supports cities worldwide
- Free OpenWeather API has rate limits (1000 calls/day) 