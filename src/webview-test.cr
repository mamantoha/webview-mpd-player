require "base64"
require "webview"
require "crystal_mpd"

# JS method to update song info from backend
def update_song_js(wv : Webview::Webview, title : String)
  escaped = title.gsub("\\", "\\\\").gsub("'", "\\'")
  wv.eval("window.musicPlayer.updateSong('#{escaped}')")
  wv.title = title
end

webview = Webview.window(
  400,
  680,
  Webview::SizeHints::FIXED,
  "MPD Controller",
  "file://#{__DIR__}/index.html",
  true
)

Thread.new do
  mpd = MPD::Client.new(with_callbacks: true)

  mpd.on_callback do |event, value|
    puts "#{event}: #{value}"

    case event
    when .elapsed?
      if status = mpd.status
        elapsed = value.to_f
        total = status["duration"].to_f
        webview.eval("window.musicPlayer.updateProgressBar(#{elapsed}, #{total})")
      end
    when .song?
      if song = mpd.currentsong
        title = "#{song["Artist"]} - #{song["Title"]}"
        update_song_js(webview, title)
      end
    when .state?
      case value
      when "play"
        webview.eval("window.musicPlayer.updatePlayButton('play')")
      when "pause"
        webview.eval("window.musicPlayer.updatePlayButton('pause')")
      end
    when .random?
      webview.eval("window.musicPlayer.updateRandomButton('#{value}')")
    when .repeat?
      webview.eval("window.musicPlayer.updateRepeatButton('#{value}')")
    when .single?
      webview.eval("window.musicPlayer.updateSingleButton('#{value}')")
    end
  end

  loop { sleep 0.1 }
end

mpd_client = MPD::Client.new

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
    JSON.parse({"artist" => song["Artist"],"title" => song["Title"]}.to_json)
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

if song = mpd_client.currentsong
  title = "#{song["Artist"]} - #{song["Title"]}"
  webview.title = title
end

webview.run
webview.destroy
