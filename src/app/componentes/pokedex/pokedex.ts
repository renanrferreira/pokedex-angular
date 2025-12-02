import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Pokemon } from '../../services/pokedex.models'; 

type StatKeys = 'hp' | 'atk' | 'def' | 'spAtk' | 'spDef' | 'speed';

@Component({
  selector: 'app-pokedex', 
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pokedex.html',
  styleUrls: ['./pokedex.css']
})

export class PokedexComponent implements OnInit {

  @ViewChild('pokemonList') pokemonListRef!: ElementRef;

  private http = inject(HttpClient);
  private apiUrl = 'https://pokeapi.co/api/v2/pokemon?limit=1025'; 
  
  private scrollInterval: any = null;
  private scrollSpeed: number = 30;
  private scrollAcceleration: number = 1.09;
  private currentSpeed: number = 20;
  private longAudio?: HTMLAudioElement;
  private isPlaying: boolean = false;

  public pokemons = signal<Pokemon[]>([]);
  public searchTerm = signal<string>('');
  public loading = signal<boolean>(true);
  public isClosed = signal<boolean>(true);

  public filteredPokemons = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const list = this.pokemons();
    if (!term) return list;
    return list.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.id.toString().includes(term)
    );
  });

  statKeys: StatKeys[] = ['hp', 'atk', 'def', 'spAtk', 'spDef', 'speed'];

  fetchPokemons() {
    this.http.get<any>(this.apiUrl).subscribe({
      next: (response) => {
        const formattedList = response.results.map((pokemon: any, index: number) => {
          const id = index + 1;
          return {
            name: pokemon.name,
            url: pokemon.url,
            id: id,
            image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
            isFlipped: false,
            isLoadingDetails: false
          };
        });
        this.pokemons.set(formattedList);
        this.loading.set(false);
      },
      error: (err) => console.error(err)
    });
  }

  updateSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  formatId(id: number): string {
    return id.toString().padStart(3, '0');
  }

  toggleCard(pokemon: Pokemon) {
    this.playSound('pokemon-exclamation.mp3');
    this.pokemons.update(currentList => 
      currentList.map(p => {
        if (p.id === pokemon.id) {
          const newFlippedState = !p.isFlipped;
          if (newFlippedState && !p.details && !p.isLoadingDetails) {
             this.fetchDetails(p.id, p.url);
             return { ...p, isFlipped: newFlippedState, isLoadingDetails: true };
          }
          return { ...p, isFlipped: newFlippedState };
        }
        return p;
      })
    );
  }

  fetchDetails(id: number, url: string) {
     this.http.get<any>(url).subscribe({
       next: (details) => {
         setTimeout(() => {
            this.pokemons.update(list => list.map(p => {
               if (p.id === id) {
                 return {
                   ...p,
                   isLoadingDetails: false,
                   details: {
                     hp: details.stats[0].base_stat,
                     atk: details.stats[1].base_stat,
                     def: details.stats[2].base_stat,
                     spAtk: details.stats[3].base_stat,
                     spDef: details.stats[4].base_stat,
                     speed: details.stats[5].base_stat,
                     types: details.types.map((t: any) => t.type.name),
                     height: details.height,
                     weight: details.weight,
                     abilities: details.abilities.map((a: any) => a.ability.name),
                     baseExperience: details.base_experience
                   }
                 };
               }
               return p;
            }));
          }, 500);
        },
        error: () => {
           this.pokemons.update(list => list.map(p => 
              p.id === id ? { ...p, isLoadingDetails: false } : p
           ));
        }
     });
  }

  getStat(pokemon: Pokemon, stat: StatKeys): number {
    if (!pokemon.details) return 0;
    const value = pokemon.details[stat];
    return typeof value === 'number' ? value : 0;
  }

  trackById(index: number, pokemon: Pokemon): number {
    return pokemon.id;
  }

  ngOnInit() {
    setTimeout(() => this.fetchPokemons(), 1000);
  }

  private playSound(soundFile: string): void {
    const audio = new Audio(`sounds/${soundFile}`);
    audio.volume = 0.5;
    audio.currentTime = 0;
    audio.play().catch(err => console.error('Erro ao tocar som:', err));
  }

  introPoke(): void {
  if (!this.longAudio) {
    this.longAudio = new Audio('sounds/pokemon-abertura.mp3');
    this.longAudio.volume = 0.5;
  }

  if (this.isPlaying) {
    this.longAudio.pause();
    this.longAudio.currentTime = 0;
    this.isPlaying = false;

  } else {
    this.longAudio.currentTime = 0;
    this.longAudio.play().catch(err => console.error('Erro ao tocar áudio:', err));
    this.isPlaying = true;
    this.longAudio.onended = () => {
      this.isPlaying = false;
      this.longAudio!.currentTime = 0;
    };
    }
  }

  scrollToFirst(): void {
    this.playSound('pokemon-exclamation.mp3');
    const firstCard = document.querySelector('.pokemon-card[data-first="true"]') as HTMLElement;
    if (firstCard) {
      firstCard.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start', 
        inline: 'nearest' 
      });
    } else if (this.pokemonListRef) {
      this.pokemonListRef.nativeElement.scrollTop = 0;
    }
  }

  scrollToLast(): void {
    this.playSound('pokemon-exclamation.mp3');
    const lastCard = document.querySelector('.pokemon-card[data-last="true"]') as HTMLElement;
    if (lastCard) {
      lastCard.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end', 
        inline: 'nearest' 
      });
    } else if (this.pokemonListRef) {
      const element = this.pokemonListRef.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
  
  startScrollUp(): void {
    this.playSound('pokemon-exclamation.mp3');
    this.currentSpeed = this.scrollSpeed;
    this.scrollInterval = setInterval(() => {
      if (this.pokemonListRef) {
        this.pokemonListRef.nativeElement.scrollTop -= this.currentSpeed;
        this.currentSpeed = Math.min(this.currentSpeed * this.scrollAcceleration, 100);
      }
    }, 30);
  }

  startScrollDown(): void {
    this.playSound('pokemon-exclamation.mp3');
    this.currentSpeed = this.scrollSpeed;
    this.scrollInterval = setInterval(() => {
      if (this.pokemonListRef) {
        this.pokemonListRef.nativeElement.scrollTop += this.currentSpeed;
        this.currentSpeed = Math.min(this.currentSpeed * this.scrollAcceleration, 100);
      }
    }, 30);
  }

  stopScroll(): void {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
      this.currentSpeed = this.scrollSpeed;
    }
  }

  togglePokedex(): void {
    this.playSound('pokemon-button.mp3');
    this.isClosed.update(state => !state);
  }
}