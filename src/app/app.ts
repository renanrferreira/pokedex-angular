import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokedexComponent } from './componentes/pokedex/pokedex';

@Component({
  selector: 'app-root',
  imports: [CommonModule, PokedexComponent],
  
  styleUrl: './app.css',
  template: `<app-pokedex></app-pokedex>`,
})

export class AppComponent {
  title = 'pokedex';
}
