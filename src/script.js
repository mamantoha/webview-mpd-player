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
    const song = await window['mpdCallback.current_song']();
    document.getElementById("current-song").innerText = song;
  }

  async updatePlayButton() {
    const state = await window['mpdCallback.get_playback_state']();
    const button = document.getElementById("play-button");
    button.innerText = state === "play" ? "⏸️" : "▶️";
  }

  async updateProgress() {
    const position = await window['mpdCallback.get_current_position']();
    this.updateProgressBar(position);
  }

  updateProgressBar(progress) {
    const progressBar = document.getElementById("progress-bar");
    const currentTime = document.getElementById("current-time");
    const totalTime = document.getElementById("total-time");

    const [elapsed, total] = progress.split('/').map(Number);
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
    const response = await window['mpdCallback.toggle_playback']();
    console.log("Playback toggled:", response);
    await this.updatePlayButton();
    await this.updateSong();
  }

  async next() {
    await window['mpdCallback.next_song']();
    await this.updateSong();
  }

  async prev() {
    await window['mpdCallback.prev_song']();
    await this.updateSong();
  }

  async seek(position) {
    await window['mpdCallback.set_song_position'](position);
  }
}

// Initialize the client when the page loads
window.onload = function() {
  window.musicPlayer = new MusicPlayer();
};
