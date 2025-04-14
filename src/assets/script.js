class MusicPlayer {
  constructor() {
    this.isDragging = false;
    this.initialize();
    this.setupPlaylistHandlers();
    this.setupLibraryHandlers();
    this.updatePlaylist();
  }

  async initialize() {
    await this.updateSong();
    await this.updateStateButtons();
    await this.updatePlayButton();
    await this.updateProgress();
  }

  async updateSong() {
    const song = await window["mpdClient.current_song"]();
    document.getElementById("current-song").innerText = song.title;
    document.getElementById("artist-name").innerText = song.artist;

    // Fetch and set album art
    const albumArt = await window["mpdClient.album_art"]();
    if (albumArt) {
      document.getElementById("album-cover").src = albumArt;
    } else {
      document.getElementById("album-cover").src = "assets/default-album.png";
    }
  }

  async updateStateButtons() {
    const status = await window["mpdClient.status"]();
    this.updateRandomButton(status.random);
    this.updateRepeatButton(status.repeat);
    this.updateSingleButton(status.single);
  }

  async updatePlayButton() {
    const state = await window["mpdClient.get_playback_state"]();
    const button = document.getElementById("play-button");
    const icon = button.querySelector("i");
    icon.className = state === "play" ? "fas fa-pause" : "fas fa-play";
  }

  async updateProgress() {
    const [elapsed, total] = await window["mpdClient.get_current_position"]();
    this.updateProgressBar(elapsed, total);
  }

  updateProgressBar(elapsed, total) {
    if (this.isDragging) return; // Don't update while user is dragging

    const progressBar = document.getElementById("progress-bar");
    const currentTime = document.getElementById("current-time");
    const totalTime = document.getElementById("total-time");

    const progressPercent = (elapsed / total) * 100;

    progressBar.value = progressPercent;
    currentTime.textContent = this.formatTime(elapsed);
    totalTime.textContent = this.formatTime(total);
  }

  handleProgressInput(position) {
    // This runs while the user is dragging
    this.isDragging = true;

    const currentTime = document.getElementById("current-time");
    const totalTime = document.getElementById("total-time");
    const total = parseFloat(totalTime.textContent.split(':').reduce((acc, time) => (60 * acc) + +time));

    // Update the time display while dragging
    const newTime = total * position;
    currentTime.textContent = this.formatTime(newTime);
  }

  async handleProgressChange(position) {
    // This runs when the user releases the slider
    await window['mpdClient.set_song_position'](position);

    // Add a small delay before allowing updates again
    setTimeout(() => {
      this.isDragging = false;
    }, 100);
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
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  async toggle() {
    const response = await window["mpdClient.toggle_playback"]();
    console.log("Playback toggled:", response);
    await this.updatePlayButton();
  }

  async next() {
    await window["mpdClient.next_song"]();
  }

  async prev() {
    await window["mpdClient.prev_song"]();
  }

  async seek(position) {
    await window['mpdClient.set_song_position'](position);
  }

  async toggleRandom() {
    await window["mpdClient.toggle_mode"]("random");
  }

  async toggleRepeat() {
    await window["mpdClient.toggle_mode"]("repeat");
  }

  async toggleSingle() {
    await window["mpdClient.toggle_mode"]("single");
  }

  async getPlaylist() {
    console.log("Getting playlist");
    const songs = await window["mpdClient.playlist"]();

    return songs;
  }

  updateSongInPlaylist(position) {
    const item = document.querySelector(
      `.playlist-item[data-pos="${position}"]`
    );

    if (item) {
      item.scrollIntoView({ behavior: "smooth", block: "center" });

      document.querySelectorAll(".playlist-item").forEach((item) => {
        item.classList.remove("active");
      });

      item.classList.add("active");
    }
  }

  async updatePlaylist() {
    const playlistContent = document.querySelector(".playlist-content");
    const playlist = await this.getPlaylist();

    // Clear existing content
    playlistContent.innerHTML = "";

    // Add playlist items
    playlist.forEach((song, index) => {
      const item = document.createElement("div");
      item.className = `playlist-item ${song.active ? "active" : ""}`;
      item.setAttribute("data-pos", index);
      item.innerHTML = `
        <span class="song-title">${song.title}</span>
        <span class="song-artist">${song.artist}</span>
        <span class="song-time">${this.formatTime(song.time)}</span>
      `;

      // Add click handler to play the song
      item.addEventListener("click", async () => {
        await window["mpdClient.play"](index);
      });

      playlistContent.appendChild(item);
    });

    // Find and update active song after playlist is populated
    const activeSong = playlist.find((song) => song.active);
    if (activeSong) {
      const activeIndex = playlist.indexOf(activeSong);
      this.updateSongInPlaylist(activeIndex);
    }
  }

  setupPlaylistHandlers() {
    const playlistButton = document.getElementById("playlist-button");
    const closePlaylistButton = document.getElementById("close-playlist");
    const playlistOverlay = document.getElementById("playlist-overlay");

    playlistButton.addEventListener("click", () => {
      playlistOverlay.classList.add("visible");
    });

    closePlaylistButton.addEventListener("click", () => {
      playlistOverlay.classList.remove("visible");
    });
  }

  setupLibraryHandlers() {
    const libraryButton = document.getElementById("library-button");
    const backButton = document.querySelector(".library-overlay .back-button");
    const libraryOverlay = document.querySelector(".library-overlay");

    libraryButton.addEventListener("click", () => {
      libraryOverlay.classList.add("visible");
    });

    backButton.addEventListener("click", () => {
      libraryOverlay.classList.remove("visible");
    });
  }
}

// Initialize the client when the page loads
window.onload = function () {
  window.musicPlayer = new MusicPlayer();
  window.library = new window.Library();
};
