class MPDClient {
  constructor() {
    this.initialize();
  }

  async initialize() {
    // Wait for the bound functions to be available
    await this.waitForFunctions();
    await this.updateSong();
    await this.updatePlayButton();
    await this.updateProgress();
  }

  async waitForFunctions() {
    const requiredFunctions = [
      'current_song',
      'get_playback_state',
      'get_current_position',
      'toggle_playback',
      'next_song',
      'prev_song',
      'set_song_position'
    ];

    return new Promise((resolve) => {
      const checkFunctions = () => {
        const allAvailable = requiredFunctions.every(func => typeof window[`mpdClient.${func}`] === 'function');
        if (allAvailable) {
          resolve();
        } else {
          setTimeout(checkFunctions, 100);
        }
      };
      checkFunctions();
    });
  }

  async updateSong() {
    const song = await window['mpdClient.current_song']();
    document.getElementById("current-song").innerText = song;
  }

  async updatePlayButton() {
    const state = await window['mpdClient.get_playback_state']();
    const button = document.getElementById("play-button");
    button.innerText = state === "play" ? "⏸️" : "▶️";
  }

  async updateProgress() {
    const position = await window['mpdClient.get_current_position']();
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
  window.mpdClient = new MPDClient();
};
