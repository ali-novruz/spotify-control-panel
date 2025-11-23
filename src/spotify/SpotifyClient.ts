import axios, { AxiosInstance } from 'axios';
import * as vscode from 'vscode';
import { SpotifyAuth } from './SpotifyAuth';
import { SpotifyPlaybackState, CurrentTrackInfo } from './types';

/**
 * Spotify Web API client for controlling playback
 */
export class SpotifyClient {
  private static readonly API_BASE_URL = 'https://api.spotify.com/v1';
  private axiosInstance: AxiosInstance;

  constructor(private auth: SpotifyAuth) {
    this.axiosInstance = axios.create({
      baseURL: SpotifyClient.API_BASE_URL,
    });

    // Add request interceptor to inject access token
    this.axiosInstance.interceptors.request.use(async (config) => {
      const token = await this.auth.getValidAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Get the current playback state
   */
  async getCurrentPlayback(): Promise<SpotifyPlaybackState | null> {
    try {
      const response = await this.axiosInstance.get<SpotifyPlaybackState>('/me/player');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 204) {
        // No active device
        return null;
      }
      throw this.handleError(error);
    }
  }

  /**
   * Get current track information in a simplified format
   */
  async getCurrentTrack(): Promise<CurrentTrackInfo | null> {
    const playback = await this.getCurrentPlayback();
    if (!playback || !playback.item) {
      return null;
    }

    const track = playback.item;
    return {
      trackName: track.name,
      artistName: track.artists.map((a) => a.name).join(', '),
      albumName: track.album.name,
      albumArt: track.album.images[0]?.url || '',
      isPlaying: playback.is_playing,
      progressMs: playback.progress_ms,
      durationMs: track.duration_ms,
      shuffleState: playback.shuffle_state,
      repeatState: playback.repeat_state,
    };
  }

  /**
   * Play or resume playback
   */
  async play(deviceId?: string): Promise<void> {
    try {
      const params = deviceId ? { device_id: deviceId } : {};
      await this.axiosInstance.put('/me/player/play', {}, { params });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Pause playback
   */
  async pause(deviceId?: string): Promise<void> {
    try {
      const params = deviceId ? { device_id: deviceId } : {};
      await this.axiosInstance.put('/me/player/pause', {}, { params });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Toggle play/pause
   */
  async togglePlayPause(): Promise<void> {
    const playback = await this.getCurrentPlayback();
    if (!playback) {
      throw new Error('No active device found. Please start Spotify on a device.');
    }

    if (playback.is_playing) {
      await this.pause();
    } else {
      await this.play();
    }
  }

  /**
   * Skip to next track
   */
  async nextTrack(deviceId?: string): Promise<void> {
    try {
      const params = deviceId ? { device_id: deviceId } : {};
      await this.axiosInstance.post('/me/player/next', {}, { params });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Skip to previous track
   */
  async previousTrack(deviceId?: string): Promise<void> {
    try {
      const params = deviceId ? { device_id: deviceId } : {};
      await this.axiosInstance.post('/me/player/previous', {}, { params });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Seek to position in current track
   */
  async seek(positionMs: number, deviceId?: string): Promise<void> {
    try {
      const params: any = { position_ms: positionMs };
      if (deviceId) {
        params.device_id = deviceId;
      }
      await this.axiosInstance.put('/me/player/seek', {}, { params });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Seek forward by a number of seconds
   */
  async seekForward(seconds: number = 10): Promise<void> {
    const playback = await this.getCurrentPlayback();
    if (!playback) {
      throw new Error('No active playback');
    }

    const newPosition = Math.min(
      playback.progress_ms + seconds * 1000,
      playback.item?.duration_ms || 0
    );
    await this.seek(newPosition);
  }

  /**
   * Seek backward by a number of seconds
   */
  async seekBackward(seconds: number = 10): Promise<void> {
    const playback = await this.getCurrentPlayback();
    if (!playback) {
      throw new Error('No active playback');
    }

    const newPosition = Math.max(playback.progress_ms - seconds * 1000, 0);
    await this.seek(newPosition);
  }

  /**
   * Toggle shuffle on/off
   */
  async toggleShuffle(): Promise<void> {
    const playback = await this.getCurrentPlayback();
    if (!playback) {
      throw new Error('No active device found');
    }

    try {
      await this.axiosInstance.put('/me/player/shuffle', {}, {
        params: { state: !playback.shuffle_state },
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Toggle repeat mode (off -> context -> track -> off)
   */
  async toggleRepeat(): Promise<void> {
    const playback = await this.getCurrentPlayback();
    if (!playback) {
      throw new Error('No active device found');
    }

    const nextState =
      playback.repeat_state === 'off'
        ? 'context'
        : playback.repeat_state === 'context'
        ? 'track'
        : 'off';

    try {
      await this.axiosInstance.put('/me/player/repeat', {}, {
        params: { state: nextState },
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Set volume (0-100)
   */
  async setVolume(volumePercent: number, deviceId?: string): Promise<void> {
    try {
      const params: any = { volume_percent: Math.max(0, Math.min(100, volumePercent)) };
      if (deviceId) {
        params.device_id = deviceId;
      }
      await this.axiosInstance.put('/me/player/volume', {}, { params });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get available devices
   */
  async getDevices(): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('/me/player/devices');
      return response.data.devices || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors and provide user-friendly messages
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return new Error('Authentication failed. Please login again.');
      } else if (error.response?.status === 403) {
        return new Error('Access forbidden. Make sure you have Spotify Premium.');
      } else if (error.response?.status === 404) {
        return new Error('No active device found. Please start Spotify on a device.');
      } else if (error.response?.status === 429) {
        return new Error('Rate limited. Please wait a moment and try again.');
      } else if (error.response?.data?.error?.message) {
        return new Error(error.response.data.error.message);
      }
    }

    return error instanceof Error ? error : new Error('An unknown error occurred');
  }
}

