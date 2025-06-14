import { useState, useEffect } from 'react';
import { FiSun, FiCloud, FiCloudRain, FiWind } from 'react-icons/fi';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '6d78abf04fc64193a0651217252405';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

const CITIES = [
  { name: 'Mumbai', emoji: '🇮🇳' },
  { name: 'New York', emoji: '🗽' },
  { name: 'London', emoji: '🇬🇧' },
  { name: 'Los Angeles', emoji: '🌴' },
  { name: 'Sydney', emoji: '🦘' }
];

export default function GlobalWeather() {
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  useEffect(() => {
    const fetchWeather = async (city) => {
      // Add delay between requests to respect rate limits
      const timeSinceLastFetch = Date.now() - lastFetchTime;
      if (timeSinceLastFetch < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastFetch));
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${city.name}`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setLastFetchTime(Date.now());

        if (data.error) {
          throw new Error(data.error.message || 'API Error');
        }

        return data;
      } catch (err) {
        if (err.name === 'AbortError') {
          console.error(`Request timeout for ${city.name}`);
          throw new Error('Request timed out. Please try again.');
        }
        console.error(`Failed to fetch weather for ${city.name}:`, err);
        throw err;
      }
    };

    const fetchAllWeather = async () => {
      // Check if we have valid cached data
      const cached = localStorage.getItem('weatherData');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setWeatherData(data);
          setLoading(false);
          setError(null);
          return;
        }
      }

      try {
        // Fetch weather data sequentially with delays to avoid rate limiting
        const weatherMap = {};
        for (const city of CITIES) {
          try {
            const result = await fetchWeather(city);
            weatherMap[city.name] = result;
          } catch (err) {
            console.error(`Skipping ${city.name} due to error:`, err);
            // Continue with other cities even if one fails
            continue;
          }
        }
        
        // Cache the successful response
        localStorage.setItem('weatherData', JSON.stringify({
          data: weatherMap,
          timestamp: Date.now()
        }));
        
        setWeatherData(weatherMap);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch weather data:', err);
        setError('Unable to fetch weather data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllWeather();

    // Rotate through cities every 5 seconds
    const interval = setInterval(() => {
      setActiveIndex(current => (current + 1) % CITIES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [lastFetchTime]);

  const getWeatherIcon = (condition = {}) => {
    const text = condition.text?.toLowerCase() || '';
    if (text.includes('sun') || text.includes('clear')) return <FiSun className="weather-icon sun" />;
    if (text.includes('rain')) return <FiCloudRain className="weather-icon rain" />;
    if (text.includes('wind')) return <FiWind className="weather-icon wind" />;
    return <FiCloud className="weather-icon" />;
  };

  if (loading && Object.keys(weatherData).length === 0) {
    return (
      <div className="global-weather-container">
        <div className="loading-pulse">Loading global weather... ⚡️</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="global-weather-container">
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  const currentCity = CITIES[activeIndex];
  const currentWeather = weatherData[currentCity.name];

  if (!currentWeather?.current) {
    return (
      <div className="global-weather-container">
        <div className="loading-pulse">Weather data unavailable for {currentCity.name} 😢</div>
      </div>
    );
  }

  return (
    <div className="global-weather-container">
      <div className="weather-card">
        <div className="city-name">
          <span className="city-emoji">{currentCity.emoji}</span>
          {currentWeather.location.name}, {currentWeather.location.country}
        </div>
        <div className="weather-info">
          {getWeatherIcon(currentWeather.current.condition)}
          <span className="temperature">
            {currentWeather.current.temp_c}°C
          </span>
          <span className="description">
            {currentWeather.current.condition.text}
          </span>
        </div>
      </div>

      <div className="weather-dots">
        {CITIES.map((city, index) => (
          <button
            key={city.name}
            className={`weather-dot ${index === activeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Show ${city.name} weather`}
          />
        ))}
      </div>
    </div>
  );
} 