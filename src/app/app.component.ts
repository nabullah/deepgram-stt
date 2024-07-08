import { Component } from '@angular/core';
import { createClient } from '@deepgram/sdk';
import { DeepgramService } from './deepgram.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  captions = '';

  constructor(private deepgramService: DeepgramService) {}

  ngOnInit(): void {
    this.deepgramService.captions$.subscribe((caption) => {
      this.captions += caption;
    });
  }

  async toggleMicrophone() {
    // Initialize Deepgram and handle microphone toggle
    await this.deepgramService.toggleMicrophone();
  }
}
