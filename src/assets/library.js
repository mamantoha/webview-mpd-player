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
    header.innerHTML = `
      <div class="tree-header-content">
        <span class="tree-toggle">▶</span>
        <span>${artist.name}</span>
      </div>
      <button class="add-to-playlist" title="Add all songs to playlist" data-urls='${JSON.stringify(this.getArtistUrls(artist))}'>
        <i class="fas fa-plus"></i>
      </button>
    `;

    const content = document.createElement('div');
    content.className = 'tree-content';

    artist.albums.forEach(album => {
      const albumItem = this.createAlbumItem(album, artist.name);
      content.appendChild(albumItem);
    });

    item.appendChild(header);
    item.appendChild(content);

    return item;
  }

  createAlbumItem(album, artistName) {
    const item = document.createElement('li');
    item.className = 'tree-item';

    const header = document.createElement('div');
    header.className = 'tree-header';
    header.innerHTML = `
      <div class="tree-header-content">
        <span class="tree-toggle">▶</span>
        <span>${album.name} (${album.year})</span>
      </div>
      <button class="add-to-playlist" title="Add album to playlist" data-urls='${JSON.stringify(this.getAlbumUrls(album))}'>
        <i class="fas fa-plus"></i>
      </button>
    `;

    const content = document.createElement('div');
    content.className = 'tree-content';

    album.songs.forEach(song => {
      const songItem = this.createSongItem(song);
      content.appendChild(songItem);
    });

    item.appendChild(header);
    item.appendChild(content);

    return item;
  }

  createSongItem(song) {
    const item = document.createElement('div');
    item.className = 'song-item';
    item.innerHTML = `
      <div class="song-item-content">
        <span>${song.title}</span>
        <span style="color: #b3b3b3">${this.formatDuration(song.duration)}</span>
      </div>
      <button class="add-to-playlist" title="Add song to playlist" data-urls='${JSON.stringify([song.url])}'>
        <i class="fas fa-plus"></i>
      </button>
    `;

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
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const urls = JSON.parse(button.dataset.urls);
        console.log('Adding songs to playlist:', urls);
        window['mpdClient.add_to_playlist'](urls);
      });
    });
  }

  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// Export the Library class
window.Library = Library;
