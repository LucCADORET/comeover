Update 05/05/2022: the website is now live again :)

# ComeOverClient

The Comeover Website, that you can access at https://luccadoret.github.io/comeover/home

This website allows you to shave a video file with other people, using webtorrent, and watch it live together, with a simple time sync. It also includes experimental functionalities like in-browser transcoding, subtitle files, and even live streaming (VERY experimental, and with delay).
For it to work well, I advise you to use a .mp4 h264 file, 1.8 GB max. Feel free to contribute, there are many bugs to fix.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `node patch.js` to pre-apply the patches to node (have a fake fs, enable crypto and stream). This is **mandatory** in order to build the website, since some libs are dependant for a build on `fs` (even though it's not used).

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

