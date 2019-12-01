// this file is used to run ffmpeg_asm.js!
// however, it is included in the HTML as "processInWebWorker" method instead of linking as a separate javascript file!

importScripts('/libs/ffmpeg-core.js');
let FFmpegCore = Module;
// This automatically imports a global 'Module' variable

// Module getter/setter part
// let Module = null;
let setModule = m => {
    Module = m;
};
let getModule = () => Module;

// Transcore and transcore util functions
let str2ptr = (s) => {
    const Module = getModule();
    const ptr = Module._malloc((s.length + 1) * Uint8Array.BYTES_PER_ELEMENT);
    for (let i = 0; i < s.length; i++) {
        Module.setValue(ptr + i, s.charCodeAt(i), 'i8');
    }
    Module.setValue(ptr + s.length, 0, 'i8');
    return ptr;
};
let strList2ptr = (strList) => {
    const Module = getModule();
    const listPtr = Module._malloc(strList.length * Uint32Array.BYTES_PER_ELEMENT);

    strList.forEach((s, idx) => {
        const strPtr = str2ptr(s);
        Module.setValue(listPtr + (4 * idx), strPtr, 'i32');
    });

    return listPtr;
};
let getFFmpeg = () => {
    const Module = getModule();
    return Module.cwrap('ffmpeg', 'number', ['number', 'number']);
};
let defaultArgs = [
    './ffmpeg',       // args[0] is always binary path
    '-nostdin',       // Disable interaction mode
    // '-loglevel',
    // 'quiet',
]

let transcode = (file) => {
    const Module = getModule();
    const data = new Uint8Array(file.data); // Should be an Uint8Array
    const iPath = `file.${file.name.split('.').pop()}`;
    const oPath = `file.mp4`;
    const ffmpeg = getFFmpeg();
    const args = [...defaultArgs, ...` -i ${iPath} -c copy ${oPath}`.trim().split(' ')];
    Module.FS.writeFile(iPath, data);
    ffmpeg(args.length, strList2ptr(args));
    return Uint8Array.from(Module.FS.readFile(oPath));
};

// Load FFmpegCore
let load = new Promise((resolve, reject) => {
    FFmpegCore()
        .then((Module) => {
            setModule(Module);
            resolve();
        });
});
var now = Date.now;

function print(text) {
    postMessage({
        'type': 'stdout',
        'data': text
    });
}

onmessage = function (event) {

    var message = event.data;

    if (message.type === "command") {

        postMessage({
            'type': 'stdout',
            'data': 'Starting to transcode ' + message.file.name
        });

        var time = now();

        const result = transcode(message.file);

        var totalTime = now() - time;
        postMessage({
            'type': 'stdout',
            'data': 'Finished processing (took ' + totalTime + 'ms)'
        });


        let resultData = {
            'type': 'done',
            'data': result.buffer,
            'time': totalTime
        };
        postMessage(resultData, [resultData['data']]);
    }
};

// Load FFMpegCore library
load.then(() => {
    postMessage({
        'type': 'ready'
    });
});
