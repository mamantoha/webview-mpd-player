<p align="left">
  <img src="https://github.com/mamantoha/webview-mpd-player/raw/refs/heads/main/src/assets/icon.png" alt="webview-mpd-player" height="150px">
</p>


A lightweight MPD (Music Player Daemon) client built with Crystal and Webview. Features a web-based interface for controlling MPD playback, managing playlists, and displaying album artwork. Includes a music library browser with artist/album organization.

This application serves as a demonstration of building real-time applications using Crystal and Webview. It showcases how to create responsive desktop applications that can handle live updates and user interactions while maintaining a lightweight footprint. The integration with MPD provides a practical example of managing real-time events, state synchronization, and UI updates in a Crystal-based desktop application.

## Name Origin

The name "Garnetune" is a playful combination of "Garnet" and "tune". [Garnet](https://en.wikipedia.org/wiki/Garnet) is a type of crystal, which references the [Crystal](https://crystal-lang.org/) programming language used to build this application. Combined with "tune" for its music-playing capabilities, the name reflects both the technical foundation and musical purpose of the application.


## Development Notes

The user interface for the player was developed with assistance from ChatGPT and Cursor AI Code Editor.

## Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:mamantoha/webview-mpd-player.git
   cd webview-mpd-player
   ```

2. Install dependencies:
   - Crystal (>= 1.15.0)
   - MPD (Music Player Daemon)
   - pkg-config
   - WebKit2GTK development files

3. Build the application:
   ```bash
   shards install
   shards build
   ./bin/garnetune
   ```

## Screenshots

![Player](src/assets/screenshots/player.png)
![Playlist](src/assets/screenshots/playlist.png)
![Library](src/assets/screenshots/library.png)

## Contributing

1. Fork it (<https://github.com/mamantoha/webview-mpd-player/fork>)
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

## Contributors

- [Anton Maminov](https://github.com/mamantoha) - creator and maintainer
