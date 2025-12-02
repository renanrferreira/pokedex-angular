export interface PokemonStats {
  hp: number;
  atk: number;
  def: number;
  spAtk: number;
  spDef: number;
  speed: number;
  types: string[];
  height: number;
  weight: number;
  abilities: string[];
  baseExperience: number;
}

export interface Pokemon {
  name: string;
  url: string;
  id: number;
  image: string;
  isFlipped: boolean;
  isLoadingDetails: boolean;
  details?: PokemonStats;
}