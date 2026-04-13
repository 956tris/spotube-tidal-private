import type {
  IAudioSourceEndpoint,
  SpotubeAudioSourceContainerPreset,
  SpotubeAudioSourceMatchObject,
  SpotubeAudioSourceStreamObject,
  SpotubeTrackObject,
} from "@spotube-app/plugin";

const TIDAL_PROXIES = [
  "https://hfapi.dyamuh.dev",
  "https://hfapi.aluratech.org",
  "https://api.studentsneed.help",
  "https://hifi-one.spotisaver.net",
  "https://hifi-two.spotisaver.net",
  "https://singapore-1.monochrome.tf",
  "https://hifi.geeked.wtf",
  "https://wolf.qqdl.site",
  "https://maus.qqdl.site",
  "https://vogel.qqdl.site",
  "https://katze.qqdl.site",
  "https://hund.qqdl.site",
];

export default class AudioSourceEndpoint implements IAudioSourceEndpoint {
  private lastFastestProxy: string | null = null;

  private async proxyFetch(path: string) {
    const proxies = this.lastFastestProxy
      ? [this.lastFastestProxy, ...TIDAL_PROXIES.filter(p => p !== this.lastFastestProxy)]
      : TIDAL_PROXIES;

    for (const baseUrl of proxies) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const response = await fetch(`${baseUrl}${path}`, {
          signal: controller.signal,
          headers: { "Accept": "application/json" },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          this.lastFastestProxy = baseUrl;
          return data;
        }
      } catch (e) {
        continue;
      }
    }
    throw new Error("Tidal fetch failed");
  }

  supportedPresets(): SpotubeAudioSourceContainerPreset[] {
    return ["m4a", "flac", "mp3"];
  }

  async matches(track: SpotubeTrackObject): Promise<SpotubeAudioSourceMatchObject[]> {
    const query = track.isrc || `${track.name} ${track.artists?.[0]?.name}`;
    const data = await this.proxyFetch(`/v1/search/tracks?query=${encodeURIComponent(query)}&limit=1`);

    if (!data || !data.items || data.items.length === 0) return [];

    const item = data.items[0];
    return [{
      id: item.id.toString(),
      title: item.title,
      duration: item.duration,
      author: item.artist?.name || item.artists?.[0]?.name,
    }];
  }

  async streams(matched: SpotubeAudioSourceMatchObject): Promise<SpotubeAudioSourceStreamObject[]> {
    const data = await this.proxyFetch(`/v1/tracks/${matched.id}/playbackinfo?playbackMode=STREAM&assetPresentation=FULL`);

    let url = data.url;
    if (data.manifest) {
      try {
        const decoded = JSON.parse(atob(data.manifest));
        url = decoded.urls?.[0];
      } catch {}
    }

    if (!url) throw new Error("No stream URL");

    return [{
      url,
      container: data.manifestMimeType?.includes("flac") ? "flac" : "m4a",
      quality: data.audioQuality === "HI_RES" ? "high" : "medium",
    }];
  }
}
