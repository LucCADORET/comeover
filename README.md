# ComeOver Client

The Comeover Website, that you can access at https://luccadoret.github.io/comeover/home

This website allows you to shave a video file with other people, using webtorrent, and watch it live together, with a simple time sync. It also includes experimental functionalities like in-browser transcoding, subtitle files, and even live streaming (VERY experimental, and with delay).
For it to work well, I advise you to use a .mp4 h264 file, 1.8 GB max. Feel free to contribute, there are many bugs to fix.

## How it works

Comeover makes uses 3 key components:

- [`@ffmpeg/core`](https://github.com/ffmpegwasm/ffmpeg.wasm-core) to verify video format, extract subtitles, or transcode the video
- [WebTorrent](https://webtorrent.io/) that allows for sharing the video over WebRTC using a BitTorrent-like protocol
- [SignalHub](https://github.com/mafintosh/signalhub) to connect users together, allowing them to sync their video via WebRTC

The only centralized points are the SignalHub inital handshake, and the use of a tracker website to share the data related to the torrent. The rest is completely P2P. This could be further improved by allowing users to manually share their WebRTC data, eliminating the need for SignalHub.

## Run locally

- Make sure you use node **v16 at most** or use the legacy OpenSSL in newer versions
- `npm install`
- `node patch.js`  we need to manually patch the webpack build options
- `npx ng serve`

## TODO:

- Bump the versions of most packages (Angular, ng-bootstrap, WebTorrent)
- Add an option for manual WebRTC connection
- Add a realiable broadcasting option (signalhub is slow/unreliable by nature)
- Use https://github.com/ngosang/trackerslist for automatically setting the trackers list
- Better interface feedback on erros (server unavailable, no messages received, tracker wrong...)