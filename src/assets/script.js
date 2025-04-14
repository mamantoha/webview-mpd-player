// Setup UI handlers
function setupPlaylistHandlers() {
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

function setupLibraryHandlers() {
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

// Initialize the client when the page loads
window.onload = function () {
  setupPlaylistHandlers();
  setupLibraryHandlers();
  window.musicPlayer = new MusicPlayer();
  window.library = new window.Library();
};
