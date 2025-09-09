import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-articles-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './articles-list.component.html',
  styleUrl: './articles-list.component.scss'
})
export class ArticlesListComponent {}

