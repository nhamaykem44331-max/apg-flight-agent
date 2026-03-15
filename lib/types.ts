export type TripType = 'oneway' | 'roundtrip';

export interface SearchPayload {
  from: string;
  to: string;
  date: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  cabin: 'economy' | 'premium' | 'business' | 'first';
  tripType: TripType;
}

export interface FlightResult {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  departure: {
    airport: string;
    airportName: string;
    city: string;
    time: string;
  };
  arrival: {
    airport: string;
    airportName: string;
    city: string;
    time: string;
  };
  duration: number;
  stops: number;
  price: {
    amount: number;
    currency: 'VND';
    source: string;
  };
  priceUSD: number;
  sources: string[];
}

export interface SearchResponse {
  searchId: string;
  results: FlightResult[];
  metadata: {
    totalResults: number;
    searchTime: number;
    cached?: boolean;
  };
}
