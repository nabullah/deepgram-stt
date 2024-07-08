import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { createClient } from '@deepgram/sdk';

@Injectable({
  providedIn: 'root',
})
export class DeepgramService {
  private captionsSubject = new BehaviorSubject<string>('');
  captions$ = this.captionsSubject.asObservable();
  private microphone!: MediaRecorder | undefined;
  private socket: any;
  private isStreamingActive = false;

  async getMicrophone() {
    const userMedia = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    return new MediaRecorder(userMedia);
  }

  async openMicrophone(microphone: MediaRecorder | undefined, socket: any) {
    microphone!.start(500);

    microphone!.onstart = () => {
      console.log('client: microphone opened');
      document.body.classList.add('recording');
    };

    microphone!.onstop = () => {
      console.log('client: microphone closed');
      document.body.classList.remove('recording');
    };

    microphone!.ondataavailable = (e: BlobEvent) => {
      const data = e.data;
      console.log('client: sent data to websocket');
      socket.send(data);
    };
  }

  async closeMicrophone() {
    if (this.microphone) {
      this.microphone.stop();
      this.microphone = undefined;
      if (this.socket) {
        // Send the CloseStream message to close the WebSocket connection
        this.socket.send(JSON.stringify({ type: 'CloseStream' }));
        console.log('client: microphone and socket closed');
      }
    }
  }

  async initializeDeepgram() {
    if (this.isStreamingActive) {
      await this.closeMicrophone();
      return;
    }

    this.microphone = await this.getMicrophone();
    this.isStreamingActive = true;

    const _deepgram = createClient('your deepgram key');

    this.socket = _deepgram.listen.live({ model: 'nova-2', smart_format: true });
    this.socket.on('open', async () => {
      console.log('client: connected to websocket');

      this.socket.on('Results', (data: any) => {
        const transcript = data.channel.alternatives[0].transcript;
        if (transcript !== '') {
          this.captionsSubject.next(transcript);
        }
      });

      this.socket.on('error', (e: any) => console.error(e));
      this.socket.on('warning', (e: any) => console.warn(e));
      this.socket.on('Metadata', (e: any) => console.log(e));
      this.socket.on('close', (e: any) => {
        console.log('client: socket closed', e);
        this.socket = undefined;
        this.isStreamingActive = false;
      });

      await this.openMicrophone(this.microphone, this.socket);
    });
  }

  async toggleMicrophone() {
    if (this.isStreamingActive) {
      await this.closeMicrophone();
    } else {
      await this.initializeDeepgram();
    }
  }
}
