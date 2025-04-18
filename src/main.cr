require "base64"
require "webview"
require "crystal_mpd"
require "json"
require "file_utils"

class Config
  class_getter config_dir : String = File.join(Path.home, ".config", "webview-mpd-player")
  class_getter config_file : String = File.join(config_dir, "config.json")
  class_getter default_config : JSON::Any = JSON.parse(%({
    "host": "localhost",
    "port": 6600
  }))

  def self.load
    ensure_config_dir
    if File.exists?(config_file)
      JSON.parse(File.read(config_file))
    else
      save_default_config
      default_config
    end
  end

  private def self.ensure_config_dir
    Dir.mkdir_p(config_dir) unless Dir.exists?(config_dir)
  end

  private def self.save_default_config
    File.write(config_file, default_config.to_pretty_json)
  end
end

webview = Webview.window(
  400,
  680,
  Webview::SizeHints::FIXED,
  "MPD Controller",
  "file://#{__DIR__}/index.html",
  true
)

# Load configuration
config = Config.load

Thread.new do
  mpd = MPD::Client.new(config["host"].as_s, config["port"].as_i, with_callbacks: true)
  mpd.callbacks_timeout = 100.milliseconds

  mpd.on_callback do |event, value|
    # puts "#{event}: #{value}"

    case event
    when .time?
      elapsed, total = value.split(':').map(&.to_f)
      webview.eval("window.musicPlayer.updateProgressBar(#{elapsed}, #{total})")
    when .song?
      if song = mpd.currentsong
        title = "#{song["Artist"]} - #{song["Title"]}"
        escaped = title.gsub("\\", "\\\\").gsub("'", "\\'")

        webview.eval("window.musicPlayer.updateSong()")
        webview.eval("window.musicPlayer.updateSongInPlaylist(#{song["Pos"]})")
      end
    when .playlist?
      webview.eval("window.musicPlayer.updatePlaylist()")
    when .state?
      case value
      when "play"
        webview.eval("window.musicPlayer.updatePlayButton('play')")
        webview.eval("document.getElementById('play-button').disabled = false")
        webview.eval("document.getElementById('next-button').disabled = false")
        webview.eval("document.getElementById('prev-button').disabled = false")
      when "pause"
        webview.eval("window.musicPlayer.updatePlayButton('pause')")
        webview.eval("document.getElementById('play-button').disabled = false")
        webview.eval("document.getElementById('next-button').disabled = false")
        webview.eval("document.getElementById('prev-button').disabled = false")
      when "stop"
        webview.eval("window.musicPlayer.updateSong()")
        webview.eval("document.getElementById('play-button').disabled = false")
        webview.eval("document.getElementById('next-button').disabled = true")
        webview.eval("document.getElementById('prev-button').disabled = true")
        webview.eval("window.musicPlayer.updateProgress()")
        webview.title = "MPD Controller"
      end
    when .random?
      webview.eval("window.musicPlayer.updateRandomButton('#{value}')")
    when .repeat?
      webview.eval("window.musicPlayer.updateRepeatButton('#{value}')")
    when .single?
      webview.eval("window.musicPlayer.updateSingleButton('#{value}')")
    end
  end

  loop { sleep 1.second }
end

mpd_client = MPD::Client.new(config["host"].as_s, config["port"].as_i)

webview.bind("webview.set_title", Webview::JSProc.new { |a|
  title = a.first.as_s

  webview.title = title

  JSON::Any.new(nil)
})

webview.bind("mpdClient.status", Webview::JSProc.new { |a|
  if status = mpd_client.status
    JSON.parse(status.to_json)
  else
    JSON::Any.new(nil)
  end
})

webview.bind("mpdClient.toggle_playback", Webview::JSProc.new { |a|
  puts "toggle_playback called with arguments: #{a}"

  mpd_client.pause

  resp = ""

  mpd_client.status.try do |status|
    resp = status["state"] == "play" ? "play" : "pause"
  end

  JSON::Any.new(resp)
})

webview.bind("mpdClient.next_song", Webview::JSProc.new { |a|
  mpd_client.next
  JSON::Any.new("OK")
})

webview.bind("mpdClient.prev_song", Webview::JSProc.new { |a|
  mpd_client.previous
  JSON::Any.new("OK")
})

webview.bind("mpdClient.album_art", Webview::JSProc.new { |a|
  if current_song = mpd_client.currentsong
    picture = mpd_client.readpicture(current_song["file"])

    unless picture
      begin
        picture = mpd_client.albumart(current_song["file"])
      rescue
        nil
      end
    end

    if picture
      data, binary = picture

      data_type = data["type"]? ? data["type"] : "image/png"

      # Encode to base64
      base64_string = Base64.strict_encode(binary)

      # Create a data URI suitable for HTML img src
      data_uri = "data:#{data_type};base64,#{base64_string}"

      JSON::Any.new(data_uri)
    else
      JSON::Any.new(nil)
    end
  else
    JSON::Any.new(nil)
  end
})

webview.bind("mpdClient.current_song", Webview::JSProc.new { |a|
  if song = mpd_client.currentsong
    JSON.parse({"artist" => song["Artist"], "title" => song["Title"]}.to_json)
  else
    JSON.parse({"artist" => "", "title" => ""}.to_json)
  end
})

webview.bind("mpdClient.get_playback_state", Webview::JSProc.new { |a|
  resp = ""

  mpd_client.status.try do |status|
    resp = status["state"] == "play" ? "play" : "pause"
  end

  JSON::Any.new(resp)
})

webview.bind("mpdClient.get_current_position", Webview::JSProc.new { |a|
  if status = mpd_client.status
    if status["state"] == "stop"
      elapsed = total = 0.0
    else
      elapsed = status["elapsed"].to_f
      total = status["duration"].to_f
    end

    JSON::Any.new([JSON::Any.new(elapsed), JSON::Any.new(total)])
  else
    JSON::Any.new([JSON::Any.new(0), JSON::Any.new(0)])
  end
})

webview.bind("mpdClient.playlist", Webview::JSProc.new { |a|
  songs = [] of Hash(String, String | Bool)

  current_song_id = mpd_client.currentsong.try { |song| song["Id"] } || nil

  if data = mpd_client.playlistinfo
    data.each do |song|
      # p! song
      songs << {
        "title"  => song["Title"],
        "artist" => song["Artist"],
        "time"   => song["Time"],
        "active" => song["Id"] == current_song_id,
        "id"     => song["Id"],
      }
    end
  end

  JSON.parse(songs.to_json)
})

webview.bind("mpdClient.clear", Webview::JSProc.new { |a|
  mpd_client.clear

  JSON::Any.new("OK")
})

webview.bind("mpdClient.play", Webview::JSProc.new { |a|
  songpos = a.first.as_i

  mpd_client.play(songpos)

  JSON::Any.new("OK")
})

webview.bind("mpdClient.delete", Webview::JSProc.new { |a|
  songpos = a.first.as_i

  mpd_client.delete(songpos)

  JSON::Any.new("OK")
})

webview.bind("mpdClient.move", Webview::JSProc.new { |a|
  from = a[0].as_i
  to = a[1].as_i

  mpd_client.move(from, to)

  JSON::Any.new("OK")
})

webview.bind("mpdClient.set_song_position", Webview::JSProc.new { |a|
  # a is Array(JSON::Any)
  # from 0 to 1
  relative = a.first.as_f

  if current_song = mpd_client.currentsong
    total = current_song["Time"].to_i
    time = (total * relative).to_i
    mpd_client.seekcur(time)
  end

  JSON::Any.new("OK")
})

webview.bind("mpdClient.toggle_mode", Webview::JSProc.new { |a|
  mode = a.first.as_s

  mpd_client.status.try do |status|
    state = status[mode] == "0"

    case mode
    when "random"
      mpd_client.random(state)
    when "repeat"
      mpd_client.repeat(state)
    when "single"
      mpd_client.single(state)
    end
  end
  JSON::Any.new("OK")
})

def get_config_dir
  config_dir = File.join(Path.home, ".config", "webview-mpd-player")
  Dir.mkdir_p(config_dir) unless Dir.exists?(config_dir)
  config_dir
end

def get_library_data_path
  File.join(get_config_dir, "library-data.json")
end

webview.bind("mpdClient.updateLibraryData", Webview::JSProc.new { |a|
  puts "updateLibraryData called with arguments: #{a}"
  # Get all songs from MPD
  if all_items = mpd_client.listallinfo
    songs = all_items.select { |item| item["file"]? }

    # First, group songs by artist and album
    grouped_songs = {} of String => Hash(String, Array(Hash(String, String | Int32)))

    songs.each do |song|
      next unless song["Artist"]? && song["Album"]? && song["Title"]?

      artist = song["Artist"]
      album = song["Album"]

      grouped_songs[artist] ||= {} of String => Array(Hash(String, String | Int32))
      grouped_songs[artist][album] ||= [] of Hash(String, String | Int32)

      grouped_songs[artist][album] << {
        "url"      => song["file"],
        "title"    => song["Title"],
        "duration" => (song["duration"]? || song["Time"]? || "0").to_f.to_i,
        "date"     => song["Date"],
      }
    end

    library_data = {
      "artists" => grouped_songs.keys.sort_by(&.downcase).map do |artist_name|
        albums = grouped_songs[artist_name]

        albums_data = albums.keys.sort_by(&.downcase).map do |album_name|
          songs = albums[album_name]
          {
            "name"  => album_name,
            "year"  => (songs.first["date"]? || "Unknown").to_s,
            "songs" => songs,
          }
        end

        {
          "name"   => artist_name,
          "albums" => albums_data,
        }
      end,
    }

    # Save to file
    File.write(get_library_data_path, library_data.to_pretty_json)
    JSON.parse(library_data.to_json)
  else
    JSON::Any.new(nil)
  end
})

webview.bind("mpdClient.loadLibraryData", Webview::JSProc.new { |a|
  if File.exists?(get_library_data_path)
    content = File.read(get_library_data_path)
    JSON.parse(content)
  else
    # If file doesn't exist, create it by fetching fresh data
    webview.eval("window['mpdClient.updateLibraryData']()")
    JSON::Any.new(nil)
  end
})

webview.bind("mpdClient.add_to_playlist", Webview::JSProc.new { |a|
  urls = a.first.as_a.map(&.to_s)

  mpd_client.with_command_list do
    urls.each do |url|
      mpd_client.add(url)
    end
  end

  JSON::Any.new(nil)
})

if song = mpd_client.currentsong
  title = "#{song["Artist"]} - #{song["Title"]}"
  webview.title = title
end

webview.run
webview.destroy
