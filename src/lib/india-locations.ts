import indiaStatesCities from "@/data/india-states-cities.json";

export type StateCities = {
  state: string;
  cities: string[];
};

export const INDIA_STATES_CITIES = indiaStatesCities as StateCities[];

export const INDIA_STATES = INDIA_STATES_CITIES.map((entry) => entry.state);

const citiesByState = new Map(
  INDIA_STATES_CITIES.map((entry) => [entry.state, entry.cities] as const),
);

export function citiesForState(state: string): string[] {
  return citiesByState.get(state) ?? [];
}

export function isValidState(state: string): boolean {
  return citiesByState.has(state);
}

export function isValidCityForState(state: string, city: string): boolean {
  return citiesForState(state).includes(city);
}
