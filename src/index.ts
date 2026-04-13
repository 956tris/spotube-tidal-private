import AudioSourceEndpoint from './segments/audio_source'
import type { IPlugin } from "@spotube-app/plugin"

export class TidalFastProxy implements IPlugin {
  audioSource: AudioSourceEndpoint;

  constructor (){    
    this.audioSource = new AudioSourceEndpoint()
  }
}
