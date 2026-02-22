// A representative list of major global cities for the SecurePay AI Threat Map Simulator
export const GLOBAL_CITIES = [
    // North America
    { id: 'NYC', name: 'New York City', country: 'USA', lat: 40.7128, lng: -74.0060 },
    { id: 'SF', name: 'San Francisco', country: 'USA', lat: 37.7749, lng: -122.4194 },
    { id: 'CHI', name: 'Chicago', country: 'USA', lat: 41.8781, lng: -87.6298 },
    { id: 'TOR', name: 'Toronto', country: 'Canada', lat: 43.6510, lng: -79.3470 },
    { id: 'VAN', name: 'Vancouver', country: 'Canada', lat: 49.2827, lng: -123.1207 },
    { id: 'MEX', name: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332 },

    // South America
    { id: 'SP', name: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
    { id: 'RJ', name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lng: -43.1729 },
    { id: 'BA', name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816 },
    { id: 'BOG', name: 'Bogotá', country: 'Colombia', lat: 4.7110, lng: -74.0721 },

    // Europe
    { id: 'LDN', name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
    { id: 'PAR', name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
    { id: 'BER', name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
    { id: 'FRA', name: 'Frankfurt', country: 'Germany', lat: 50.1109, lng: 8.6821 },
    { id: 'MAD', name: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },
    { id: 'ROM', name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964 },
    { id: 'AMS', name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
    { id: 'ZUR', name: 'Zurich', country: 'Switzerland', lat: 47.3769, lng: 8.5417 },
    { id: 'BRU', name: 'Brussels', country: 'Belgium', lat: 50.8503, lng: 4.3517 },
    { id: 'STO', name: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686 },

    // Asia
    { id: 'TOK', name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
    { id: 'OSA', name: 'Osaka', country: 'Japan', lat: 34.6937, lng: 135.5023 },
    { id: 'BEI', name: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074 },
    { id: 'SHA', name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737 },
    { id: 'HKG', name: 'Hong Kong', country: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
    { id: 'SEO', name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.9780 },
    { id: 'SIN', name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
    { id: 'DEL', name: 'New Delhi', country: 'India', lat: 28.6139, lng: 77.2090 },
    { id: 'MUM', name: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777 },
    { id: 'BLR', name: 'Bangalore', country: 'India', lat: 12.9716, lng: 77.5946 },
    { id: 'DXB', name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
    { id: 'RYD', name: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753 },
    { id: 'TLV', name: 'Tel Aviv', country: 'Israel', lat: 32.0853, lng: 34.7818 },
    { id: 'BKK', name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018 },
    { id: 'JKT', name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456 },
    { id: 'KUL', name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lng: 101.6869 },

    // Africa
    { id: 'LOS', name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
    { id: 'CAI', name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
    { id: 'JNB', name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473 },
    { id: 'CPT', name: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241 },
    { id: 'NBO', name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
    { id: 'ACC', name: 'Accra', country: 'Ghana', lat: 5.6037, lng: -0.1870 },

    // Oceania
    { id: 'SYD', name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
    { id: 'MEL', name: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631 },
    { id: 'AKL', name: 'Auckland', country: 'New Zealand', lat: -36.8485, lng: 174.7633 }
].sort((a, b) => a.name.localeCompare(b.name));
