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
    // Clear existing content
    libraryContent.innerHTML = '';

    const treeView = document.createElement('ul');
    treeView.className = 'tree-view';

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
        <span class="tree-toggle"><i class="fas fa-chevron-right"></i></span>
        <span>${artist.name}</span>
      </div>
      <button class="add-to-playlist" title="Add all songs to playlist">
        <i class="fas fa-plus"></i> Add All
      </button>
    `;

    const content = document.createElement('div');
    content.className = 'tree-content';

    artist.albums.forEach(album => {
      const albumItem = this.createAlbumItem(album);
      content.appendChild(albumItem);
    });

    item.appendChild(header);
    item.appendChild(content);

    return item;
  }

  createAlbumItem(album) {
    const item = document.createElement('li');
    item.className = 'tree-item';

    const header = document.createElement('div');
    header.className = 'tree-header';
    header.innerHTML = `
      <div class="tree-header-content">
        <span class="tree-toggle"><i class="fas fa-chevron-right"></i></span>
        <span>${album.name} (${album.year})</span>
      </div>
      <button class="add-to-playlist" title="Add album to playlist">
        <i class="fas fa-plus"></i> Add Album
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
      <button class="add-to-playlist" title="Add song to playlist">
        <i class="fas fa-plus"></i>
      </button>
    `;

    return item;
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
        const toggle = header.querySelector('.tree-toggle i');

        content.classList.toggle('expanded');
        toggle.classList.toggle('fa-chevron-right');
        toggle.classList.toggle('fa-chevron-down');
      });
    });

    // Add click handlers for add-to-playlist buttons
    document.querySelectorAll('.add-to-playlist').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();

        const item = e.target.closest('.tree-item, .song-item');

        if (item.classList.contains('song-item')) {
          // Find the song in the mock data
          const songTitle = item.querySelector('.song-item-content span').textContent;
          const songUrls = this.findSongUrls([songTitle]);
          console.log('Adding song to playlist:', songUrls);
        } else {
          // For artist or album
          const headerText = item.querySelector('.tree-header-content span:last-child').textContent;

          if (headerText.includes('(')) {
            // This is an album
            const albumName = headerText.split(' (')[0];
            const songUrls = this.findAlbumSongUrls(albumName);
            console.log('Adding album songs to playlist:', songUrls);
          } else {
            // This is an artist
            const artistName = headerText;
            const songUrls = this.findArtistSongUrls(artistName);
            console.log('Adding all artist songs to playlist:', songUrls);
          }
        }
      });
    });
  }

  findSongUrls(songTitles) {
    const urls = [];
    this.data.artists.forEach(artist => {
      artist.albums.forEach(album => {
        album.songs.forEach(song => {
          if (songTitles.includes(song.title)) {
            urls.push(song.url);
          }
        });
      });
    });
    return urls;
  }

  findAlbumSongUrls(albumName) {
    const urls = [];
    this.data.artists.forEach(artist => {
      artist.albums.forEach(album => {
        if (album.name === albumName) {
          album.songs.forEach(song => {
            urls.push(song.url);
          });
        }
      });
    });
    return urls;
  }

  findArtistSongUrls(artistName) {
    const urls = [];
    this.data.artists.forEach(artist => {
      if (artist.name === artistName) {
        artist.albums.forEach(album => {
          album.songs.forEach(song => {
            urls.push(song.url);
          });
        });
      }
    });
    return urls;
  }

  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// Initialize the library when the page loads
window.onload = function() {
  window.library = new Library();
};
