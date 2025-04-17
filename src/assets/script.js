// Setup UI handlers
function setupPlaylistHandlers() {
  const playlistButton = document.getElementById("playlist-button");
  const backButton = document.querySelector(".playlist-overlay .back-button");
  const clearPlaylistButton = document.getElementById("clear-playlist");
  const playlistOverlay = document.querySelector(".playlist-overlay");

  playlistButton.textContent = "📋";
  backButton.textContent = "←";
  clearPlaylistButton.textContent = "🗑️";

  playlistButton.addEventListener("click", () => {
    playlistOverlay.classList.add("visible");

    const activeItem = document.querySelector('.playlist-item.active');
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  backButton.addEventListener("click", () => {
    playlistOverlay.classList.remove("visible");
  });

  clearPlaylistButton.addEventListener("click", async () => {
    await window["mpdClient.clear"]();
  });
}

function setupLibraryHandlers() {
  const libraryButton = document.getElementById("library-button");
  const backButton = document.querySelector(".library-overlay .back-button");
  const libraryOverlay = document.querySelector(".library-overlay");

  libraryButton.textContent = "📚";
  backButton.textContent = "←";

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
