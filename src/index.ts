import AudioSourceEndpoint from './segments/audio_source.js'
import type { IPlugin } from "@spotube-app/plugin"

export default class TemplateMetadataProviderPlugin implements IPlugin {
  audioSource: AudioSourceEndpoint;

  constructor (){    
    this.audioSource = new AudioSourceEndpoint()
  }
}
