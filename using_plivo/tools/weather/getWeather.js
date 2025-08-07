import dotenv from 'dotenv';

dotenv.config();

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

export const getWeather = async (city) => {
    try {
        if (!OPENWEATHER_API_KEY) {
            throw new Error('OpenWeather API key not found in environment variables');
        }

        // First, get coordinates for the city
        const geocodingUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OPENWEATHER_API_KEY}`;
        
        const geocodingResponse = await fetch(geocodingUrl);
        const geocodingData = await geocodingResponse.json();

        if (!geocodingData || geocodingData.length === 0) {
            return {
                success: false,
                error: `City "${city}" not found. Please check the spelling and try again.`
            };
        }

        const { lat, lon, name, country } = geocodingData[0];

        // Get current weather data
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        if (weatherResponse.status !== 200) {
            throw new Error(`Weather API error: ${weatherData.message}`);
        }

        // Format the weather information
        const weather = {
            city: name,
            country: country,
            temperature: Math.round(weatherData.main.temp),
            feels_like: Math.round(weatherData.main.feels_like),
            humidity: weatherData.main.humidity,
            description: weatherData.weather[0].description,
            wind_speed: Math.round(weatherData.wind.speed * 3.6), // Convert m/s to km/h
            pressure: weatherData.main.pressure,
            visibility: weatherData.visibility ? Math.round(weatherData.visibility / 1000) : null, // Convert to km
            sunrise: new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            }),
            sunset: new Date(weatherData.sys.sunset * 1000).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            })
        };

        // Create a natural language response
        const response = `Current weather in ${weather.city}, ${weather.country}:
• Temperature: ${weather.temperature}°C (feels like ${weather.feels_like}°C)
• Conditions: ${weather.description}
• Humidity: ${weather.humidity}%
• Wind Speed: ${weather.wind_speed} km/h
• Pressure: ${weather.pressure} hPa${weather.visibility ? `\n• Visibility: ${weather.visibility} km` : ''}
• Sunrise: ${weather.sunrise}
• Sunset: ${weather.sunset}`;

        return {
            success: true,
            weather: weather,
            response: response
        };

    } catch (error) {
        console.error('Error fetching weather data:', error);
        return {
            success: false,
            error: `Failed to get weather information: ${error.message}`
        };
    }
};

export const getWeatherForecast = async (city, days = 5) => {
    try {
        if (!OPENWEATHER_API_KEY) {
            throw new Error('OpenWeather API key not found in environment variables');
        }

        // First, get coordinates for the city
        const geocodingUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OPENWEATHER_API_KEY}`;
        
        const geocodingResponse = await fetch(geocodingUrl);
        const geocodingData = await geocodingResponse.json();

        if (!geocodingData || geocodingData.length === 0) {
            return {
                success: false,
                error: `City "${city}" not found. Please check the spelling and try again.`
            };
        }

        const { lat, lon, name, country } = geocodingData[0];

        // Get weather forecast data
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();

        if (forecastResponse.status !== 200) {
            throw new Error(`Weather API error: ${forecastData.message}`);
        }

        // Process forecast data to get daily forecasts
        const dailyForecasts = [];
        const processedDates = new Set();

        forecastData.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateString = date.toDateString();
            
            if (!processedDates.has(dateString) && dailyForecasts.length < days) {
                processedDates.add(dateString);
                
                dailyForecasts.push({
                    date: date.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                    }),
                    temperature: Math.round(item.main.temp),
                    feels_like: Math.round(item.main.feels_like),
                    humidity: item.main.humidity,
                    description: item.weather[0].description,
                    wind_speed: Math.round(item.wind.speed * 3.6)
                });
            }
        });

        // Create a natural language response
        let response = `Weather forecast for ${name}, ${country}:\n\n`;
        
        dailyForecasts.forEach(forecast => {
            response += `${forecast.date}:
• Temperature: ${forecast.temperature}°C (feels like ${forecast.feels_like}°C)
• Conditions: ${forecast.description}
• Humidity: ${forecast.humidity}%
• Wind Speed: ${forecast.wind_speed} km/h\n\n`;
        });

        return {
            success: true,
            forecasts: dailyForecasts,
            response: response.trim()
        };

    } catch (error) {
        console.error('Error fetching weather forecast:', error);
        return {
            success: false,
            error: `Failed to get weather forecast: ${error.message}`
        };
    }
}; 