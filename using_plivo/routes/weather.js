import express from 'express';
import { getWeather, getWeatherForecast } from '../tools/weather/getWeather.js';

const router = express.Router();

// Route to get current weather for a city
router.get('/current/:city', async (req, res) => {
    try {
        const { city } = req.params;
        
        if (!city) {
            return res.status(400).json({
                success: false,
                error: 'City parameter is required'
            });
        }

        const weatherData = await getWeather(city);
        
        if (!weatherData.success) {
            return res.status(404).json(weatherData);
        }

        res.json(weatherData);
    } catch (error) {
        console.error('Error in weather route:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while fetching weather data'
        });
    }
});

// Route to get weather forecast for a city
router.get('/forecast/:city', async (req, res) => {
    try {
        const { city } = req.params;
        const { days = 5 } = req.query;
        
        if (!city) {
            return res.status(400).json({
                success: false,
                error: 'City parameter is required'
            });
        }

        const forecastData = await getWeatherForecast(city, parseInt(days));
        
        if (!forecastData.success) {
            return res.status(404).json(forecastData);
        }

        res.json(forecastData);
    } catch (error) {
        console.error('Error in weather forecast route:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while fetching weather forecast'
        });
    }
});

// Route to get weather information (current + forecast)
router.get('/info/:city', async (req, res) => {
    try {
        const { city } = req.params;
        const { days = 5 } = req.query;
        
        if (!city) {
            return res.status(400).json({
                success: false,
                error: 'City parameter is required'
            });
        }

        // Get both current weather and forecast
        const [currentWeather, forecast] = await Promise.all([
            getWeather(city),
            getWeatherForecast(city, parseInt(days))
        ]);

        if (!currentWeather.success) {
            return res.status(404).json(currentWeather);
        }

        res.json({
            success: true,
            current: currentWeather,
            forecast: forecast.success ? forecast : null
        });
    } catch (error) {
        console.error('Error in weather info route:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while fetching weather information'
        });
    }
});

export default router; 