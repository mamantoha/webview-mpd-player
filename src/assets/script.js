class MusicPlayer {
  constructor() {
    this.initialize();
  }

  async initialize() {
    await this.updateSong();
    await this.updatePlayButton();
    await this.updateProgress();
  }

  async updateSong() {
    const song = await window['mpdClient.current_song']();
    document.getElementById("current-song").innerText = song.title;
    document.getElementById("artist-name").innerText = song.artist;

    // Fetch and set album art
    const albumArt = await window['mpdClient.album_art']();
    if (albumArt) {
      document.getElementById("album-cover").src = albumArt;
    } else {
      document.getElementById("album-cover").src = "assets/default-album.png";
    }
  }

  async updatePlayButton() {
    const state = await window['mpdClient.get_playback_state']();
    const button = document.getElementById("play-button");
    button.innerText = state === "play" ? "⏸️" : "▶️";
  }

  async updateProgress() {
    const [elapsed, total] = await window['mpdClient.get_current_position']();
    this.updateProgressBar(elapsed, total);
  }

  updateProgressBar(elapsed, total) {
    const progressBar = document.getElementById("progress-bar");
    const currentTime = document.getElementById("current-time");
    const totalTime = document.getElementById("total-time");

    const progressPercent = (elapsed / total) * 100;

    progressBar.value = progressPercent;
    currentTime.textContent = this.formatTime(elapsed);
    totalTime.textContent = this.formatTime(total);
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  async toggle() {
    const response = await window['mpdClient.toggle_playback']();
    console.log("Playback toggled:", response);
    await this.updatePlayButton();
    await this.updateSong();
  }

  async next() {
    await window['mpdClient.next_song']();
    await this.updateSong();
  }

  async prev() {
    await window['mpdClient.prev_song']();
    await this.updateSong();
  }

  async seek(position) {
    await window['mpdClient.set_song_position'](position);
  }
}

// Initialize the client when the page loads
window.onload = function() {
  window.musicPlayer = new MusicPlayer();
};
