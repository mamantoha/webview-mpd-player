require "webview"
require "crystal_mpd"

# JS method to update song info from backend
def update_song_js(wv : Webview::Webview, title : String)
  escaped = title.gsub("\\", "\\\\").gsub("'", "\\'")
  wv.eval("window.mpdClient.updateSong('#{escaped}')")
  wv.title = title
end

webview = Webview.window(
  640,
  480,
  Webview::SizeHints::NONE,
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
        webview.eval("window.mpdClient.updateProgressBar('#{elapsed}/#{total}')")
      end
    when .song?
      if song = mpd.currentsong
        title = "#{song["Artist"]} - #{song["Title"]}"
        update_song_js(webview, title)
      end
    when .state?
      case value
      when "play"
        webview.eval("window.mpdClient.updatePlayButton('play')")
      when "pause"
        webview.eval("window.mpdClient.updatePlayButton('pause')")
      end
    end
  end

  loop { sleep 0.1 }
end

client = MPD::Client.new

webview.bind("mpdCallback.toggle_playback", Webview::JSProc.new { |a|
  puts "toggle_playback called with arguments: #{a}"

  client.pause

  resp = ""

  client.status.try do |status|
    resp = status["state"] == "play" ? "play" : "pause"
  end

  JSON::Any.new(resp)
})

webview.bind("mpdCallback.next_song", Webview::JSProc.new { |a|
  client.next
  JSON::Any.new("OK")
})

webview.bind("mpdCallback.prev_song", Webview::JSProc.new { |a|
  client.previous
  JSON::Any.new("OK")
})

webview.bind("mpdCallback.current_song", Webview::JSProc.new { |a|
  if song = client.currentsong
    title = "#{song["Artist"]} - #{song["Title"]}"
    JSON::Any.new(title)
  else
    JSON::Any.new("")
  end
})

webview.bind("mpdCallback.get_playback_state", Webview::JSProc.new { |a|
  resp = ""

  client.status.try do |status|
    resp = status["state"] == "play" ? "play" : "pause"
  end

  JSON::Any.new(resp)
})

webview.bind("mpdCallback.get_current_position", Webview::JSProc.new { |a|
  if status = client.status
    if status["state"] == "stop"
      elapsed = total = 0.0
    else
      elapsed = status["elapsed"].to_f
      total = status["duration"].to_f
    end

    JSON::Any.new("#{elapsed}/#{total}")
  else
    JSON::Any.new("0/0")
  end
})

webview.bind("mpdCallback.set_song_position", Webview::JSProc.new { |a|
  # a is Array(JSON::Any)
  # from 0 to 1
  relative = a.first.as_f

  if current_song = client.currentsong
    total = current_song["Time"].to_i
    time = (total * relative).to_i
    client.seekcur(time)
  end

  JSON::Any.new("OK")
})

if song = client.currentsong
  title = "#{song["Artist"]} - #{song["Title"]}"
  webview.title = title
end

webview.run
webview.destroy
