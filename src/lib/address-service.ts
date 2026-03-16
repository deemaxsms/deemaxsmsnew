// Address and Location Service for Gift Delivery System
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface Country {
  iso2: string;
  iso3: string;
  country: string;
  cities: string[];
}

export interface SavedAddress {
  id: string;
  userId: string;
  label: string; // "Mom's House", "Office", etc.
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  
  // Structured Address
  countryCode: string;
  countryName: string;
  state: string;
  city: string;
  streetName: string;
  houseNumber: string;
  apartment?: string;
  landmark?: string;
  postalCode?: string;
  
  // Precise Location
  latitude: number;
  longitude: number;
  mapPlaceId?: string;
  addressLine: string;
  
  // Metadata
  isDefault: boolean;
  isVerified: boolean;
  timesUsed: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
  placeId?: string;
}

export interface AddressValidationResult {
  isValid: boolean;
  coordinates?: GeocodeResult;
  suggestions?: string[];
  error?: string;
}

export interface ApiResponse<T> {
  error: boolean;
  msg: string;
  data: T;
}

class AddressService {
  private readonly COUNTRIES_API = 'https://countriesnow.space/api/v0.1/countries';
  private readonly NOMINATIM_API = 'https://nominatim.openstreetmap.org';
  
  // Cache for API responses
  private countriesCache: Country[] = [];
  private statesCache: Map<string, string[]> = new Map();
  private citiesCache: Map<string, string[]> = new Map();
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  
  // ===== COUNTRIES, STATES, CITIES =====
  
  /**
   * Fetch with timeout to fail fast and use fallbacks
   */
  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 5000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get all countries with ISO codes and cities
   */
  async getCountries(): Promise<Country[]> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.countriesCache.length > 0 && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      console.log(`✅ Using cached countries (${this.countriesCache.length} countries)`);
      return this.countriesCache;
    }

    try {
      console.log('🌍 Fetching countries from API...');
      
      // Use the correct endpoint from the API documentation with timeout
      const response = await this.fetchWithTimeout(`${this.COUNTRIES_API}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }, 3000); // 3 second timeout

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const apiResponse: ApiResponse<Country[]> = await response.json();
      
      if (apiResponse.error) {
        throw new Error(apiResponse.msg || 'API returned error');
      }

      if (apiResponse.data && Array.isArray(apiResponse.data)) {
        // Transform the data to match our interface
        this.countriesCache = apiResponse.data.map(country => ({
          iso2: country.iso2 || '',
          iso3: country.iso3 || '',
          country: country.country || '',
          cities: country.cities || []
        }));
        
        this.cacheTimestamp = now;
        console.log(`✅ Loaded ${this.countriesCache.length} countries from API`);
        return this.countriesCache;
      }
      
      throw new Error('Invalid API response format');
      
    } catch (error) {
      console.warn('🔄 API failed, using fallback countries:', error);
      
      // Comprehensive fallback data
      this.countriesCache = [
        { 
          iso2: 'NG', 
          iso3: 'NGA', 
          country: 'Nigeria', 
          cities: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Kaduna', 'Jos', 'Ilorin', 'Aba', 'Onitsha', 'Warri', 'Calabar', 'Uyo', 'Akure'] 
        },
        { 
          iso2: 'US', 
          iso3: 'USA', 
          country: 'United States', 
          cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte'] 
        },
        { 
          iso2: 'GB', 
          iso3: 'GBR', 
          country: 'United Kingdom', 
          cities: ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Cardiff', 'Leicester', 'Coventry', 'Bradford', 'Belfast', 'Nottingham'] 
        },
        { 
          iso2: 'CA', 
          iso3: 'CAN', 
          country: 'Canada', 
          cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa', 'Edmonton', 'Mississauga', 'Winnipeg', 'Quebec City', 'Hamilton', 'Brampton', 'Surrey', 'Laval', 'Halifax', 'London'] 
        },
        { 
          iso2: 'GH', 
          iso3: 'GHA', 
          country: 'Ghana', 
          cities: ['Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Sekondi-Takoradi', 'Sunyani', 'Koforidua', 'Ho', 'Tema', 'Wa', 'Bolgatanga', 'Techiman', 'Obuasi', 'Tarkwa', 'Nkawkaw'] 
        },
        { 
          iso2: 'DE', 
          iso3: 'DEU', 
          country: 'Germany', 
          cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden', 'Hanover', 'Nuremberg', 'Duisburg'] 
        },
        { 
          iso2: 'FR', 
          iso3: 'FRA', 
          country: 'France', 
          cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon'] 
        },
        { 
          iso2: 'AU', 
          iso3: 'AUS', 
          country: 'Australia', 
          cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong', 'Hobart', 'Geelong', 'Townsville', 'Cairns', 'Darwin'] 
        },
        { 
          iso2: 'IN', 
          iso3: 'IND', 
          country: 'India', 
          cities: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane'] 
        },
        { 
          iso2: 'CN', 
          iso3: 'CHN', 
          country: 'China', 
          cities: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Wuhan', 'Xi\'an', 'Suzhou', 'Zhengzhou', 'Nanjing', 'Tianjin', 'Shenyang', 'Harbin', 'Changchun'] 
        },
        { 
          iso2: 'ZA', 
          iso3: 'ZAF', 
          country: 'South Africa', 
          cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Pietermaritzburg', 'Benoni', 'Tembisa', 'Germiston', 'Soweto', 'Randburg', 'Centurion', 'Midrand'] 
        },
        { 
          iso2: 'KE', 
          iso3: 'KEN', 
          country: 'Kenya', 
          cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kehancha', 'Kitale', 'Malindi', 'Garissa', 'Kakamega', 'Thika', 'Lamu', 'Nyeri', 'Machakos', 'Meru'] 
        }
      ];
      
      this.cacheTimestamp = now;
      console.log(`✅ Using ${this.countriesCache.length} fallback countries`);
      return this.countriesCache;
    }
  }

  /**
   * Get states for a specific country
   */
  async getStates(countryName: string): Promise<string[]> {
    const cacheKey = countryName;
    
    // Check cache first
    if (this.statesCache.has(cacheKey)) {
      return this.statesCache.get(cacheKey)!;
    }

    try {
      console.log(`🏛️ Fetching states for ${countryName}...`);
      
      // Use the correct endpoint from API documentation with timeout
      const response = await this.fetchWithTimeout(`${this.COUNTRIES_API}/states`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country: countryName })
      }, 3000); // 3 second timeout

      if (response.ok) {
        const apiResponse: ApiResponse<{ states: { name: string }[] }> = await response.json();
        
        if (!apiResponse.error && apiResponse.data?.states) {
          const states = apiResponse.data.states.map(s => s.name);
          if (states.length > 0) {
            this.statesCache.set(cacheKey, states);
            console.log(`✅ Loaded ${states.length} states for ${countryName}`);
            return states;
          }
        }
      }
    } catch (error) {
      console.warn(`🔄 States API failed for ${countryName}, using fallback:`, error);
    }

    // Comprehensive fallback states
    const fallbackStates: { [key: string]: string[] } = {
      'Nigeria': [
        'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
        'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
        'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
        'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT'
      ],
      'United States': [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
        'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
        'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
        'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
        'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
      ],
      'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
      'Canada': [
        'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories',
        'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'
      ],
      'Ghana': [
        'Ashanti', 'Brong-Ahafo', 'Central', 'Eastern', 'Greater Accra', 'Northern', 'Upper East', 'Upper West', 'Volta', 'Western'
      ],
      'Germany': [
        'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse', 'Lower Saxony',
        'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'
      ],
      'France': [
        'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Brittany', 'Centre-Val de Loire', 'Corsica', 'Grand Est',
        'Hauts-de-France', 'Île-de-France', 'Normandy', 'Nouvelle-Aquitaine', 'Occitanie', 'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur'
      ],
      'Australia': [
        'Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia'
      ],
      'India': [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
        'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
        'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
      ],
      'China': [
        'Anhui', 'Beijing', 'Chongqing', 'Fujian', 'Gansu', 'Guangdong', 'Guangxi', 'Guizhou', 'Hainan', 'Hebei',
        'Heilongjiang', 'Henan', 'Hubei', 'Hunan', 'Inner Mongolia', 'Jiangsu', 'Jiangxi', 'Jilin', 'Liaoning', 'Ningxia',
        'Qinghai', 'Shaanxi', 'Shandong', 'Shanghai', 'Shanxi', 'Sichuan', 'Tianjin', 'Tibet', 'Xinjiang', 'Yunnan', 'Zhejiang'
      ],
      'South Africa': [
        'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
      ],
      'Kenya': [
        'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado',
        'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia',
        'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
        'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
        'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
      ]
    };

    const states = fallbackStates[countryName] || ['State/Province'];
    this.statesCache.set(cacheKey, states);
    console.log(`✅ Using ${states.length} fallback states for ${countryName}`);
    return states;
  }

  /**
   * Get cities for a specific country and state
   */
  async getCities(countryName: string, stateName?: string): Promise<string[]> {
    const cacheKey = stateName ? `${countryName}:${stateName}` : countryName;
    
    // Check cache first
    if (this.citiesCache.has(cacheKey)) {
      return this.citiesCache.get(cacheKey)!;
    }

    try {
      console.log(`🏙️ Fetching cities for ${countryName}${stateName ? ` - ${stateName}` : ''}...`);
      
      let response: Response;
      
      if (stateName) {
        // Get cities in a specific state using the correct endpoint with timeout
        response = await this.fetchWithTimeout(`${this.COUNTRIES_API}/state/cities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            country: countryName, 
            state: stateName 
          })
        }, 3000); // 3 second timeout
      } else {
        // Get all cities in country using the correct endpoint with timeout
        response = await this.fetchWithTimeout(`${this.COUNTRIES_API}/cities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ country: countryName })
        }, 3000); // 3 second timeout
      }

      if (response.ok) {
        const apiResponse: ApiResponse<string[]> = await response.json();
        
        if (!apiResponse.error && apiResponse.data && Array.isArray(apiResponse.data)) {
          const cities = apiResponse.data;
          if (cities.length > 0) {
            this.citiesCache.set(cacheKey, cities);
            console.log(`✅ Loaded ${cities.length} cities for ${cacheKey}`);
            return cities;
          }
        }
      }
    } catch (error) {
      console.warn(`🔄 Cities API failed for ${cacheKey}, using fallback:`, error);
    }

    // Comprehensive fallback cities
    const fallbackCities: { [key: string]: { [key: string]: string[] } } = {
      'Nigeria': {
        'Lagos': ['Lagos Island', 'Ikeja', 'Surulere', 'Yaba', 'Victoria Island', 'Ikoyi', 'Lekki', 'Ajah', 'Alimosho', 'Agege', 'Mushin', 'Oshodi', 'Isolo', 'Kosofe', 'Shomolu'],
        'Abuja': ['Garki', 'Wuse', 'Maitama', 'Asokoro', 'Gwarinpa', 'Kubwa', 'Nyanya', 'Karu', 'Lugbe', 'Jabi', 'Utako', 'Gudu', 'Lokogoma', 'Apo', 'Durumi'],
        'Kano': ['Kano Municipal', 'Fagge', 'Dala', 'Gwale', 'Tarauni', 'Nassarawa', 'Ungogo', 'Kumbotso', 'Warawa', 'Dawakin Tofa'],
        'Rivers': ['Port Harcourt', 'Obio-Akpor', 'Okrika', 'Eleme', 'Ikwerre', 'Oyigbo', 'Degema', 'Bonny', 'Opobo/Nkoro', 'Ahoada East'],
        'Oyo': ['Ibadan', 'Ogbomoso', 'Oyo', 'Iseyin', 'Saki', 'Shaki', 'Igboho', 'Eruwa', 'Igbo-Ora', 'Lalupon'],
        'Katsina': ['Katsina', 'Daura', 'Funtua', 'Malumfashi', 'Dutsin-Ma', 'Kankia', 'Jibia', 'Mashi', 'Kafur', 'Bindawa'],
        'Kaduna': ['Kaduna', 'Zaria', 'Kafanchan', 'Sabon Gari', 'Soba', 'Makarfi', 'Ikara', 'Kubau', 'Kudan', 'Giwa']
      },
      'United States': {
        'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Oakland', 'Fresno', 'Long Beach', 'Santa Ana', 'Anaheim', 'Bakersfield', 'Riverside', 'Stockton', 'Irvine', 'Fremont'],
        'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Lubbock', 'Laredo', 'Irving', 'Garland', 'Frisco', 'McKinney'],
        'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale', 'Tallahassee', 'St. Petersburg', 'Hialeah', 'Port St. Lucie', 'Cape Coral', 'Pembroke Pines', 'Hollywood', 'Gainesville', 'Miramar', 'Coral Springs'],
        'New York': ['New York City', 'Buffalo', 'Rochester', 'Syracuse', 'Albany', 'Yonkers', 'New Rochelle', 'Mount Vernon', 'Schenectady', 'Utica', 'White Plains', 'Troy', 'Niagara Falls', 'Binghamton', 'Freeport']
      },
      'United Kingdom': {
        'England': ['London', 'Birmingham', 'Manchester', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Leicester', 'Coventry', 'Bradford', 'Nottingham', 'Plymouth', 'Stoke-on-Trent', 'Wolverhampton', 'Derby'],
        'Scotland': ['Glasgow', 'Edinburgh', 'Aberdeen', 'Dundee', 'Stirling', 'Perth', 'Inverness', 'Paisley', 'East Kilbride', 'Livingston', 'Hamilton', 'Cumbernauld', 'Kirkcaldy', 'Dunfermline', 'Ayr'],
        'Wales': ['Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Barry', 'Rhondda', 'Caerphilly', 'Bridgend', 'Neath', 'Port Talbot', 'Cwmbran', 'Llanelli', 'Cardiff', 'Pontypridd', 'Flint'],
        'Northern Ireland': ['Belfast', 'Derry', 'Lisburn', 'Newtownabbey', 'Bangor', 'Craigavon', 'Castlereagh', 'Ballymena', 'Newtownards', 'Carrickfergus', 'Coleraine', 'Omagh', 'Larne', 'Strabane', 'Limavady']
      }
    };

    // Get cities for the specific state/country combination
    const countryData = fallbackCities[countryName];
    if (countryData && stateName && countryData[stateName]) {
      const cities = countryData[stateName];
      this.citiesCache.set(cacheKey, cities);
      console.log(`✅ Using ${cities.length} fallback cities for ${cacheKey}`);
      return cities;
    }

    // Fallback to general cities for the country
    const generalCities: { [key: string]: string[] } = {
      'Nigeria': ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Kaduna', 'Jos', 'Ilorin', 'Aba', 'Onitsha', 'Warri', 'Calabar', 'Uyo', 'Akure', 'Bauchi', 'Sokoto', 'Gombe', 'Minna', 'Yola'],
      'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington'],
      'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Cardiff', 'Leicester', 'Coventry', 'Bradford', 'Belfast', 'Nottingham', 'Plymouth', 'Stoke-on-Trent', 'Wolverhampton', 'Derby', 'Swansea'],
      'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa', 'Edmonton', 'Mississauga', 'Winnipeg', 'Quebec City', 'Hamilton', 'Brampton', 'Surrey', 'Laval', 'Halifax', 'London', 'Markham', 'Vaughan', 'Gatineau', 'Saskatoon', 'Longueuil'],
      'Ghana': ['Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Sekondi-Takoradi', 'Sunyani', 'Koforidua', 'Ho', 'Tema', 'Wa', 'Bolgatanga', 'Techiman', 'Obuasi', 'Tarkwa', 'Nkawkaw', 'Winneba', 'Dunkwa', 'Yendi', 'Salaga', 'Kintampo'],
      'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden', 'Hanover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster'],
      'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Villeurbanne'],
      'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong', 'Hobart', 'Geelong', 'Townsville', 'Cairns', 'Darwin', 'Toowoomba', 'Ballarat', 'Bendigo', 'Albury', 'Launceston'],
      'India': ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara'],
      'China': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Wuhan', 'Xi\'an', 'Suzhou', 'Zhengzhou', 'Nanjing', 'Tianjin', 'Shenyang', 'Harbin', 'Changchun', 'Dalian', 'Kunming', 'Taiyuan', 'Changsha', 'Ürümqi'],
      'South Africa': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Pietermaritzburg', 'Benoni', 'Tembisa', 'Germiston', 'Soweto', 'Randburg', 'Centurion', 'Midrand', 'Roodepoort', 'Boksburg', 'Welkom', 'Newcastle', 'Krugersdorp'],
      'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kehancha', 'Kitale', 'Malindi', 'Garissa', 'Kakamega', 'Thika', 'Lamu', 'Nyeri', 'Machakos', 'Meru', 'Kericho', 'Embu', 'Migori', 'Webuye', 'Karuri']
    };

    const cities = generalCities[countryName] || ['City'];
    this.citiesCache.set(cacheKey, cities);
    console.log(`✅ Using ${cities.length} fallback cities for ${countryName}`);
    return cities;
  }

  // ===== GEOCODING & ADDRESS VALIDATION =====

  /**
   * Convert address to coordinates using Nominatim
   */
  async geocodeAddress(addressData: {
    streetName: string;
    houseNumber: string;
    city: string;
    state: string;
    country: string;
    apartment?: string;
    postalCode?: string;
  }): Promise<GeocodeResult | null> {
    try {
      // Build search query
      const addressParts = [
        `${addressData.houseNumber} ${addressData.streetName}`,
        addressData.apartment,
        addressData.city,
        addressData.state,
        addressData.country,
        addressData.postalCode
      ].filter(Boolean);
      
      const searchQuery = addressParts.join(', ');
      
      const response = await fetch(
        `${this.NOMINATIM_API}/search?` + 
        new URLSearchParams({
          q: searchQuery,
          format: 'json',
          limit: '1',
          addressdetails: '1'
        })
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          displayName: result.display_name,
          placeId: result.place_id?.toString()
        };
      }
      
      // Fallback to city-level coordinates if exact address not found
      return this.getCityCoordinates(addressData.city, addressData.country);
    } catch (error) {
      console.error('Geocoding error:', error);
      // Fallback to city coordinates
      return this.getCityCoordinates(addressData.city, addressData.country);
    }
  }

  /**
   * Get approximate coordinates for major cities (fallback)
   */
  private getCityCoordinates(city: string, country: string): GeocodeResult | null {
    const cityCoordinates: { [key: string]: { [key: string]: { lat: number; lng: number } } } = {
      'Nigeria': {
        'Lagos': { lat: 6.5244, lng: 3.3792 },
        'Abuja': { lat: 9.0765, lng: 7.3986 },
        'Kano': { lat: 12.0022, lng: 8.5920 },
        'Ibadan': { lat: 7.3775, lng: 3.9470 },
        'Port Harcourt': { lat: 4.8156, lng: 7.0498 },
        'Benin City': { lat: 6.3350, lng: 5.6037 },
        'Kaduna': { lat: 10.5222, lng: 7.4383 }
      },
      'United States': {
        'New York': { lat: 40.7128, lng: -74.0060 },
        'Los Angeles': { lat: 34.0522, lng: -118.2437 },
        'Chicago': { lat: 41.8781, lng: -87.6298 },
        'Houston': { lat: 29.7604, lng: -95.3698 },
        'Phoenix': { lat: 33.4484, lng: -112.0740 }
      },
      'United Kingdom': {
        'London': { lat: 51.5074, lng: -0.1278 },
        'Birmingham': { lat: 52.4862, lng: -1.8904 },
        'Manchester': { lat: 53.4808, lng: -2.2426 },
        'Glasgow': { lat: 55.8642, lng: -4.2518 },
        'Liverpool': { lat: 53.4084, lng: -2.9916 }
      },
      'Canada': {
        'Toronto': { lat: 43.6532, lng: -79.3832 },
        'Montreal': { lat: 45.5017, lng: -73.5673 },
        'Vancouver': { lat: 49.2827, lng: -123.1207 },
        'Calgary': { lat: 51.0447, lng: -114.0719 },
        'Ottawa': { lat: 45.4215, lng: -75.6972 }
      },
      'Ghana': {
        'Accra': { lat: 5.6037, lng: -0.1870 },
        'Kumasi': { lat: 6.6885, lng: -1.6244 },
        'Tamale': { lat: 9.4034, lng: -0.8424 },
        'Cape Coast': { lat: 5.1053, lng: -1.2466 }
      }
    };

    const countryData = cityCoordinates[country];
    if (countryData && countryData[city]) {
      const coords = countryData[city];
      return {
        latitude: coords.lat,
        longitude: coords.lng,
        displayName: `${city}, ${country}`,
        placeId: `fallback_${city.toLowerCase().replace(/\s+/g, '_')}`
      };
    }

    // Ultimate fallback - return coordinates for country capital or major city
    const countryDefaults: { [key: string]: { lat: number; lng: number } } = {
      'Nigeria': { lat: 6.5244, lng: 3.3792 }, // Lagos
      'United States': { lat: 40.7128, lng: -74.0060 }, // New York
      'United Kingdom': { lat: 51.5074, lng: -0.1278 }, // London
      'Canada': { lat: 43.6532, lng: -79.3832 }, // Toronto
      'Ghana': { lat: 5.6037, lng: -0.1870 }, // Accra
      'Germany': { lat: 52.5200, lng: 13.4050 }, // Berlin
      'France': { lat: 48.8566, lng: 2.3522 }, // Paris
      'Australia': { lat: -33.8688, lng: 151.2093 }, // Sydney
      'India': { lat: 19.0760, lng: 72.8777 }, // Mumbai
      'China': { lat: 39.9042, lng: 116.4074 } // Beijing
    };

    const defaultCoords = countryDefaults[country];
    if (defaultCoords) {
      return {
        latitude: defaultCoords.lat,
        longitude: defaultCoords.lng,
        displayName: `${city}, ${country}`,
        placeId: `fallback_${country.toLowerCase().replace(/\s+/g, '_')}`
      };
    }

    return null;
  }

  /**
   * Convert coordinates back to address (reverse geocoding)
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<any> {
    try {
      const response = await fetch(
        `${this.NOMINATIM_API}/reverse?` +
        new URLSearchParams({
          lat: latitude.toString(),
          lon: longitude.toString(),
          format: 'json',
          addressdetails: '1'
        })
      );
      
      return await response.json();
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Validate and geocode an address
   */
  async validateAddress(addressData: {
    streetName: string;
    houseNumber: string;
    city: string;
    state: string;
    country: string;
    apartment?: string;
    postalCode?: string;
  }): Promise<AddressValidationResult> {
    try {
      const coordinates = await this.geocodeAddress(addressData);
      
      if (!coordinates) {
        return {
          isValid: false,
          error: 'Address could not be located. Please check the details and try again.'
        };
      }

      // For fallback coordinates, we still consider the address valid
      // since we have approximate location data
      return {
        isValid: true,
        coordinates,
        suggestions: [coordinates.displayName]
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Address validation failed. Please try again.'
      };
    }
  }

  // ===== SAVED ADDRESSES MANAGEMENT =====

  /**
   * Save a new address for a user
   */
  async saveAddress(userId: string, addressData: Omit<SavedAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'timesUsed' | 'lastUsedAt'>): Promise<string> {
    try {
      console.log(`📍 Saving address for user: ${userId}`, addressData);
      
      const docRef = await addDoc(collection(db, 'saved_addresses'), {
        ...addressData,
        userId,
        timesUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`✅ Address saved successfully with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving address:', error);
      throw error;
    }
  }

  /**
   * Get all saved addresses for a user
   */
  async getUserAddresses(userId: string): Promise<SavedAddress[]> {
    try {
      console.log(`📍 Fetching addresses for user: ${userId}`);
      
      // First try with lastUsedAt ordering
      let q = query(
        collection(db, 'saved_addresses'),
        where('userId', '==', userId),
        orderBy('lastUsedAt', 'desc')
      );
      
      let snapshot = await getDocs(q);
      
      // If no results, try without ordering (in case lastUsedAt is null/undefined)
      if (snapshot.empty) {
        console.log('📍 No addresses found with lastUsedAt ordering, trying without ordering...');
        q = query(
          collection(db, 'saved_addresses'),
          where('userId', '==', userId)
        );
        snapshot = await getDocs(q);
      }
      
      const addresses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastUsedAt: doc.data().lastUsedAt?.toDate()
      } as SavedAddress));
      
      // Sort manually to handle undefined lastUsedAt values
      addresses.sort((a, b) => {
        if (!a.lastUsedAt && !b.lastUsedAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (!a.lastUsedAt) return 1;
        if (!b.lastUsedAt) return -1;
        return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
      });
      
      console.log(`📍 Found ${addresses.length} addresses for user ${userId}`);
      return addresses;
    } catch (error) {
      console.error('❌ Error fetching addresses:', error);
      // Try a simple query without ordering as fallback
      try {
        console.log('🔄 Trying fallback query without ordering...');
        const q = query(
          collection(db, 'saved_addresses'),
          where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        const addresses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          lastUsedAt: doc.data().lastUsedAt?.toDate()
        } as SavedAddress));
        
        console.log(`📍 Fallback query found ${addresses.length} addresses`);
        return addresses;
      } catch (fallbackError) {
        console.error('❌ Fallback query also failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Update an existing address
   */
  async updateAddress(addressId: string, updates: Partial<SavedAddress>): Promise<void> {
    try {
      const docRef = doc(db, 'saved_addresses', addressId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
      
      console.log('✅ Address updated:', addressId);
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  }

  /**
   * Delete a saved address
   */
  async deleteAddress(addressId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'saved_addresses', addressId));
      console.log('✅ Address deleted:', addressId);
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  }

  /**
   * Mark address as used (increment usage counter)
   */
  async markAddressAsUsed(addressId: string): Promise<void> {
    try {
      const docRef = doc(db, 'saved_addresses', addressId);
      await updateDoc(docRef, {
        timesUsed: (await import('firebase/firestore')).increment(1),
        lastUsedAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error marking address as used:', error);
    }
  }

  /**
   * Set an address as default
   */
  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    try {
      // First, unset all other default addresses for this user
      const userAddresses = await this.getUserAddresses(userId);
      const updatePromises = userAddresses.map(addr => {
        if (addr.id !== addressId && addr.isDefault) {
          return this.updateAddress(addr.id, { isDefault: false });
        }
        return Promise.resolve();
      });
      
      await Promise.all(updatePromises);
      
      // Set the new default
      await this.updateAddress(addressId, { isDefault: true });
      
      console.log('✅ Default address set:', addressId);
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  }

  // ===== UTILITY FUNCTIONS =====

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format address for display
   */
  formatAddress(address: SavedAddress, includeRecipient = false): string {
    const parts = [];
    
    if (includeRecipient) {
      parts.push(address.recipientName);
    }
    
    parts.push(
      `${address.houseNumber} ${address.streetName}`,
      address.apartment,
      address.landmark,
      address.city,
      address.state,
      address.countryName,
      address.postalCode
    );
    
    return parts.filter(Boolean).join(', ');
  }
}

export const addressService = new AddressService();