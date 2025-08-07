import dotenv from 'dotenv';
import { getWeather, getWeatherForecast } from './tools/weather/getWeather.js';

dotenv.config();

async function testWeatherTools() {
    console.log('Testing Weather Tools...\n');
    
    // Test current weather
    console.log('1. Testing current weather for London:');
    try {
        const currentWeather = await getWeather('London');
        console.log('Result:', currentWeather);
    } catch (error) {
        console.error('Error testing current weather:', error);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test weather forecast
    console.log('2. Testing weather forecast for New York:');
    try {
        const forecast = await getWeatherForecast('New York', 3);
        console.log('Result:', forecast);
    } catch (error) {
        console.error('Error testing weather forecast:', error);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test with invalid city
    console.log('3. Testing with invalid city:');
    try {
        const invalidWeather = await getWeather('InvalidCityName123');
        console.log('Result:', invalidWeather);
    } catch (error) {
        console.error('Error testing invalid city:', error);
    }
}

// Run the test
testWeatherTools().catch(console.error); 