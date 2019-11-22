// this file is used to run ffmpeg_asm.js!
// however, it is included in the HTML as "processInWebWorker" method instead of linking as a separate javascript file!

const FFMpegCore = importScripts('/libs/ffmpeg-core.js');

// Module getter/setter par
let Module = null;
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
let transcode = (inputPath, outputExt, options = '') => {
    const Module = getModule();
    const data = new Uint8Array(fs.readFileSync(inputPath));
    const iPath = `file.${inputPath.split('.').pop()}`;
    const oPath = `file.${outputExt}`;
    const ffmpeg = getFFmpeg();
    const args = [...defaultArgs, ...`${options} -i ${iPath} -c copy ${oPath}`.trim().split(' ')];
    Module.FS.writeFile(iPath, data);
    ffmpeg(args.length, strList2ptr(args));
    return Buffer.from(Module.FS.readFile(oPath));
};


let load = new Promise((resolve, reject) => {
    FFmpegCore()
        .then((Module) => {
            setModule(Module);
            resolve();
        });
})


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

        var Module = {
            print: print,
            printErr: print,
            files: message.files || [],
            arguments: message.arguments || [],
            // TOTAL_MEMORY: message.TOTAL_MEMORY || false
            // Can play around with this option - must be a power of 2
            TOTAL_MEMORY: 8 * 1024 * 1024 * 1024
        };

        postMessage({
            'type': 'start',
            'data': Module.arguments.join(" ")
        });

        postMessage({
            'type': 'stdout',
            'data': 'Received command: ' +
                Module.arguments.join(" ") +
                ((Module.TOTAL_MEMORY) ? ".  Processing with " + Module.TOTAL_MEMORY + " bits." : "")
        });

        var time = now();
        var result = ffmpeg_run(Module);

        var totalTime = now() - time;
        postMessage({
            'type': 'stdout',
            'data': 'Finished processing (took ' + totalTime + 'ms)'
        });

        postMessage({
            'type': 'done',
            'data': result,
            'time': totalTime
        });
    }
};

postMessage({
    'type': 'ready'
});
