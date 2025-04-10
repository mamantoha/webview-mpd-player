class MusicPlayer {
  constructor() {
    this.initialize();
    this.setupPlaylistHandlers();
    this.updatePlaylist(); // Initialize playlist with mock data
  }

  async initialize() {
    await this.updateSong();
    await this.updateStateButtons()
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

  async updateStateButtons() {
    const status = await window['mpdClient.status']();
    this.updateRandomButton(status.random);
    this.updateRepeatButton(status.repeat);
    this.updateSingleButton(status.single);
  }

  async updatePlayButton() {
    const state = await window['mpdClient.get_playback_state']();
    const button = document.getElementById("play-button");
    const icon = button.querySelector('i');
    icon.className = state === "play" ? "fas fa-pause" : "fas fa-play";
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

  updateRandomButton(state) {
    const button = document.getElementById("random-button");
    button.classList.toggle("active", state === "1");
  }

  updateRepeatButton(state) {
    const button = document.getElementById("repeat-button");
    button.classList.toggle("active", state === "1");
  }

  updateSingleButton(state) {
    const button = document.getElementById("single-button");
    button.classList.toggle("active", state === "1");
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

  async toggleRandom() {
    await window['mpdClient.toggle_mode']('random');
  }

  async toggleRepeat() {
    await window['mpdClient.toggle_mode']('repeat');
  }

  async toggleSingle() {
    await window['mpdClient.toggle_mode']('single');
  }

  async getPlaylist() {
    console.log("Getting playlist");
    const songs = await window['mpdClient.playlist']();

    return songs;
  }

  async updatePlaylist() {
    const playlistContent = document.querySelector('.playlist-content');
    const playlist = await this.getPlaylist();

    // Clear existing content
    playlistContent.innerHTML = '';

    // Add playlist items
    playlist.forEach(song => {
      const item = document.createElement('div');
      item.className = `playlist-item ${song.active ? 'active' : ''}`;
      item.innerHTML = `
        <span class="song-title">${song.title}</span>
        <span class="song-artist">${song.artist}</span>
      `;
      playlistContent.appendChild(item);
    });
  }

  setupPlaylistHandlers() {
    const playlistButton = document.getElementById('playlist-button');
    const closePlaylistButton = document.getElementById('close-playlist');
    const playlistOverlay = document.getElementById('playlist-overlay');

    playlistButton.addEventListener('click', () => {
      playlistOverlay.classList.add('visible');
    });

    closePlaylistButton.addEventListener('click', () => {
      playlistOverlay.classList.remove('visible');
    });
  }
}

// Initialize the client when the page loads
window.onload = function() {
  window.musicPlayer = new MusicPlayer();
};
