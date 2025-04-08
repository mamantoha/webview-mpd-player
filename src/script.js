// On page load, show current song and play state
window.onload = function () {
  current_song().then(function (song) {
    updateSong(song);
  });
  updatePlayButton();
  get_current_position().then(function (position) {
    updateProgressBar(position);
  });
};

function toggle() {
  toggle_playback().then(function (response) {
    console.log("Playback toggled:", response);
    updatePlayButton();
    current_song().then(function (song) {
      updateSong(song);
    });
  });
}

function next() {
  next_song().then(() => {
    current_song().then(function (song) {
      updateSong(song);
    });
  });
}

function prev() {
  prev_song().then(() => {
    current_song().then(function (song) {
      updateSong(song);
    });
  });
}

function updateSong(text) {
  document.getElementById("current-song").innerText = text;
}

function updatePlayButton() {
  get_playback_state().then(function (state) {
    const button = document.getElementById("play-button");
    button.innerText = state === "play" ? "⏸️" : "▶️";
  });
}

function updateProgressBar(progress) {
  const progressBar = document.getElementById("progress-bar");
  const currentTime = document.getElementById("current-time");
  const totalTime = document.getElementById("total-time");

  const [elapsed, total] = progress.split("/").map(Number);
  const progressPercent = (elapsed / total) * 100;

  progressBar.value = progressPercent;
  currentTime.textContent = formatTime(elapsed);
  totalTime.textContent = formatTime(total);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function handleSeek(event) {
  const progressBar = event.target;
  const position = progressBar.value / 100; // Convert to 0-1 range
  set_song_position(position).then(() => {
    // The progress will be updated by the backend's elapsed event
  });
}
