require "webview"
require "crystal_mpd"

# JS method to update song info from backend
def update_song_js(wv : Webview::Webview, title : String)
  escaped = title.gsub("\\", "\\\\").gsub("'", "\\'")
  wv.eval("updateSong('#{escaped}')")
end

webview = Webview.window(640, 480, Webview::SizeHints::NONE, "MPD Controller", "file://#{__DIR__}/index.html")

Thread.new do
  mpd = MPD::Client.new(with_callbacks: true)

  mpd.on_callback do |event, value|
    puts "#{event}: #{value}"

    case event
    when .song?
      if song = mpd.currentsong
        title = "#{song["Artist"]} - #{song["Title"]}"
        update_song_js(webview, title)
      end
    end
  end

  loop { sleep 0.1 }
end

client = MPD::Client.new

webview.bind("toggle_playback", Webview::JSProc.new { |a|
  puts "toggle_playback called with arguments: #{a}"

  client.pause

  JSON::Any.new("play")
})

webview.bind("next_song", Webview::JSProc.new { |a|
  client.next
  JSON::Any.new("OK")
})

webview.bind("prev_song", Webview::JSProc.new { |a|
  client.previous
  JSON::Any.new("OK")
})

webview.bind("current_song", Webview::JSProc.new { |a|
  if song = client.currentsong
    title = "#{song["Artist"]} - #{song["Title"]}"
    JSON::Any.new(title)
  else
    JSON::Any.new("")
  end
})

webview.run
webview.destroy
