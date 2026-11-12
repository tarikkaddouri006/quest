# QUEST · scripts/serve.rb
# Local development server. Uses the Ruby that ships with macOS: nothing to install.
#
#   ruby scripts/serve.rb            → http://localhost:8766
#   ruby scripts/serve.rb 9000       → another port
#   HOST=0.0.0.0 ruby scripts/serve.rb   → also reachable from a phone on the same Wi-Fi
#
# Differences from a plain static server:
#   · never caches, so a reload always shows your latest edit
#   · serves films with byte ranges, so video scrubbing works in Safari
#   · copes with the em dash in the project folder's name
Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8
require 'webrick'
require 'socket'

# The folder path comes back tagged with the shell's locale (often US-ASCII), which breaks on the em dash.
ROOT = File.expand_path('..', __dir__).dup.force_encoding(Encoding::UTF_8)
PORT = (ARGV[0] || ENV['PORT'] || 8766).to_i
HOST = ENV['HOST'] || '127.0.0.1'

MIME = WEBrick::HTTPUtils::DefaultMimeTypes.merge(
  'html' => 'text/html; charset=utf-8',
  'js'   => 'text/javascript; charset=utf-8',
  'css'  => 'text/css; charset=utf-8',
  'json' => 'application/json; charset=utf-8',
  'md'   => 'text/markdown; charset=utf-8',
  'svg'  => 'image/svg+xml',
  'otf'  => 'font/otf',
  'mp4'  => 'video/mp4',
  'jpg'  => 'image/jpeg'
)

begin
  server = WEBrick::HTTPServer.new(
    BindAddress: HOST,
    Port: PORT,
    DocumentRoot: ROOT,
    MimeTypes: MIME,
    DirectoryIndex: ['index.html'],
    AccessLog: [],
    Logger: WEBrick::Log.new($stderr, WEBrick::Log::WARN),
    RequestCallback: proc { |req, res|
      res['Cache-Control'] = 'no-store'
      # never serve hidden files or folders (.git, .claude, .DS_Store…), even when shared on Wi-Fi
      raise WEBrick::HTTPStatus::NotFound if req.path.split('/').any? { |seg| seg.start_with?('.') }
    }
  )
rescue Errno::EADDRINUSE
  warn "Port #{PORT} is already in use. Something may already be serving QUEST at http://localhost:#{PORT}"
  warn "Stop it, or pick another port:  ruby scripts/serve.rb #{PORT + 1}"
  exit 1
end

trap('INT')  { server.shutdown }
trap('TERM') { server.shutdown }

puts "QUEST is running at http://localhost:#{PORT}"
if HOST == '0.0.0.0'
  lan = Socket.ip_address_list.find { |a| a.ipv4_private? }
  puts "On your phone (same Wi-Fi):  http://#{lan.ip_address}:#{PORT}" if lan
end
puts 'Edit any file and reload the page. Ctrl+C stops the server.'
$stdout.flush
server.start
