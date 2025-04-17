class Library {
  constructor() {
    this.data = null;
    this.loadData();
  }

  async loadData() {
    try {
      this.data = await window['mpdClient.loadLibraryData']();
      if (!this.data) {
        // If loading failed or file doesn't exist, try updating the library
        this.data = await window['mpdClient.updateLibraryData']();
      }
      if (!this.data) {
        throw new Error('Failed to load library data');
      }
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
      }
      this.initialize();
    } catch (error) {
      console.error('Error loading library data:', error);
    }
  }

  async updateLibrary() {
    try {
      this.data = await window['mpdClient.updateLibraryData']();
      if (!this.data) {
        throw new Error('Failed to update library data');
      }
      this.initialize();
    } catch (error) {
      console.error('Error updating library data:', error);
    }
  }

  initialize() {
    if (!this.data) return;
    this.renderLibrary();
    this.setupEventListeners();
  }

  renderLibrary() {
    const libraryContent = document.getElementById('library-content');
    if (!libraryContent) {
      console.error('Library content element not found');
      return;
    }

    // Clear existing content
    libraryContent.innerHTML = '';

    const treeView = document.createElement('ul');
    treeView.className = 'tree-view';

    if (!this.data?.artists) {
      console.error('No library data available');
      return;
    }

    this.data.artists.forEach(artist => {
      const artistItem = this.createArtistItem(artist);
      treeView.appendChild(artistItem);
    });

    libraryContent.appendChild(treeView);
  }

  createArtistItem(artist) {
    const item = document.createElement('li');
    item.className = 'tree-item';

    const header = document.createElement('div');
    header.className = 'tree-header';

    // Create header content
    const headerContent = document.createElement('div');
    headerContent.className = 'tree-header-content';

    // Create toggle span
    const toggle = document.createElement('span');
    toggle.className = 'tree-toggle';
    toggle.textContent = '▶';
    headerContent.appendChild(toggle);

    // Create artist name span
    const artistName = document.createElement('span');
    artistName.textContent = artist.name;
    headerContent.appendChild(artistName);

    // Create add to playlist button
    const addButton = document.createElement('button');
    addButton.className = 'add-to-playlist';
    addButton.title = 'Add all songs to playlist';
    addButton.setAttribute('data-urls', JSON.stringify(this.getArtistUrls(artist)));

    const addIcon = document.createElement('i');
    addIcon.className = 'fas fa-plus';
    addButton.appendChild(addIcon);

    // Assemble header
    header.appendChild(headerContent);
    header.appendChild(addButton);

    // Create content container
    const content = document.createElement('div');
    content.className = 'tree-content';

    // Add albums
    artist.albums.forEach(album => {
      const albumItem = this.createAlbumItem(album, artist.name);
      content.appendChild(albumItem);
    });

    // Assemble item
    item.appendChild(header);
    item.appendChild(content);

    return item;
  }

  createAlbumItem(album, artistName) {
    const item = document.createElement('li');
    item.className = 'tree-item';

    const header = document.createElement('div');
    header.className = 'tree-header';

    // Create header content
    const headerContent = document.createElement('div');
    headerContent.className = 'tree-header-content';

    // Create toggle span
    const toggle = document.createElement('span');
    toggle.className = 'tree-toggle';
    toggle.textContent = '▶';
    headerContent.appendChild(toggle);

    // Create album name span
    const albumName = document.createElement('span');
    albumName.textContent = `${album.name} (${album.year})`;
    headerContent.appendChild(albumName);

    // Create add to playlist button
    const addButton = document.createElement('button');
    addButton.className = 'add-to-playlist';
    addButton.title = 'Add album to playlist';
    addButton.setAttribute('data-urls', JSON.stringify(this.getAlbumUrls(album)));

    const addIcon = document.createElement('i');
    addIcon.className = 'fas fa-plus';
    addButton.appendChild(addIcon);

    // Assemble header
    header.appendChild(headerContent);
    header.appendChild(addButton);

    // Create content container
    const content = document.createElement('div');
    content.className = 'tree-content';

    // Add songs
    album.songs.forEach(song => {
      const songItem = this.createSongItem(song);
      content.appendChild(songItem);
    });

    // Assemble item
    item.appendChild(header);
    item.appendChild(content);

    return item;
  }

  createSongItem(song) {
    const item = document.createElement("div");
    item.className = "song-item";
    item.setAttribute("data-uri", song.uri);

    const icon = document.createElement("span");
    icon.className = "song-icon";
    icon.textContent = "🎵";
    item.appendChild(icon);

    const songInfo = document.createElement("div");
    songInfo.className = "song-info";

    const title = document.createElement("span");
    title.className = "song-title";
    title.textContent = song.title;
    songInfo.appendChild(title);

    const time = document.createElement("span");
    time.className = "song-time";
    time.textContent = this.formatTime(song.duration);
    songInfo.appendChild(time);

    const addButton = document.createElement("button");
    addButton.className = "add-to-playlist";
    addButton.title = "Add to playlist";

    const addIcon = document.createElement("i");
    addIcon.className = "fas fa-plus";
    addButton.appendChild(addIcon);

    addButton.addEventListener("click", async (e) => {
      e.stopPropagation();
      addButton.classList.add("added");
      await window["mpdClient.add"](song.uri);
      setTimeout(() => addButton.classList.remove("added"), 500);
    });

    item.appendChild(songInfo);
    item.appendChild(addButton);
    return item;
  }

  getArtistUrls(artist) {
    const urls = [];
    for (const album of artist.albums) {
      for (const song of album.songs) {
        urls.push(song.url);
      }
    }
    return urls;
  }

  getAlbumUrls(album) {
    return album.songs.map(song => song.url);
  }

  setupEventListeners() {
    // Add refresh button event listener
    const refreshButton = document.getElementById('refresh-library');
    if (refreshButton) {
      refreshButton.addEventListener('click', async () => {
        refreshButton.classList.add('fa-spin');
        await this.updateLibrary();
        refreshButton.classList.remove('fa-spin');
      });
    }

    document.querySelectorAll('.tree-header').forEach(header => {
      header.addEventListener('click', (e) => {
        // Don't toggle if clicking the add-to-playlist button
        if (e.target.closest('.add-to-playlist')) {
          e.stopPropagation();
          return;
        }

        const content = header.nextElementSibling;
        const toggle = header.querySelector('.tree-toggle');

        content.classList.toggle('expanded');
        toggle.textContent = content.classList.contains('expanded') ? '▼' : '▶';
      });
    });

    // Add click handlers for add-to-playlist buttons
    document.querySelectorAll('.add-to-playlist').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const urls = JSON.parse(button.dataset.urls);
        console.log('Adding songs to playlist:', urls);

        // Add visual feedback
        button.classList.add('added');
        await window['mpdClient.add_to_playlist'](urls);

        // Remove the class after animation completes
        setTimeout(() => {
          button.classList.remove('added');
        }, 500);
      });
    });
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// Export the Library class
window.Library = Library;
