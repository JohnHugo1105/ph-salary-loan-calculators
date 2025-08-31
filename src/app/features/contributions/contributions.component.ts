import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { computeContributions } from '../../shared/ph-calculators.util';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { ThousandsSeparatorDirective } from '../../shared/thousands-separator.directive';
import { trigger, transition, style, query, stagger, animate } from '@angular/animations';

@Component({
  selector: 'app-contributions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatCardModule, ThousandsSeparatorDirective],
  templateUrl: './contributions.component.html',
  styleUrl: './contributions.component.scss',
  animations: [
    trigger('cardsIn', [
      transition(':enter', [
        query('.card', [
          style({ opacity: 0, transform: 'translateY(6px)' }),
          stagger(60, animate('200ms ease-out', style({ opacity: 1, transform: 'none' })))
        ], { optional: true })
      ])
    ])
  ]
})
export class ContributionsComponent {
  form = this.fb.group({
    monthlySalary: [30000, [Validators.required, Validators.min(0)]],
    includeSSSEC: [true]
  });

  result = computeContributions(30000, { includeSSSEC: true });

  constructor(private fb: FormBuilder) {
    this.form.valueChanges.subscribe(v => {
      const salary = Number(v.monthlySalary) || 0;
      const includeEC = !!v.includeSSSEC;
      this.result = computeContributions(salary, { includeSSSEC: includeEC });
    });
  }
}
