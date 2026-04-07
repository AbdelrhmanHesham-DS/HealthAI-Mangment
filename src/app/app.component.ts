import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AiAssistantComponent } from './shared/components/ai-assistant/ai-assistant.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ReactiveFormsModule, AiAssistantComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {}
