let encoder;
let encodeTimes = [];
let outputTimes = [];
let firstEncodeTime = null;
let lastOutputTime = null;

function reset() {
  encoder = null;
  encodeTimes.length = 0;
  outputTimes.length = 0;
  firstEncodeTime = null;
  lastOutputTime = null;
}

self.onmessage = async (event) => {
  if (event.data.command === "configure") {
    const { command, codec, width, height, latencyMode, avcFormat } = event.data;
    encoder = new VideoEncoder({
      output: (chunk, metadata) => {
        const endTime = performance.now();
        outputTimes.push({ timestamp: chunk.timestamp, time: endTime });
        lastOutputTime = endTime;
      },
      error: (e) => console.error(e),
    });
    const config = {
      codec: codec,
      width: width,
      height: height,
      bitrate: 1000000, // 1 Mbps
      framerate: 30,
      latencyMode: latencyMode,
    };

    // Add H264 specific configuration
    if (codec.startsWith("avc1")) {
      config.avc = { format: avcFormat };
    }

    console.log(config);

    encoder.configure(config);
  } else if (event.data.command === "encode") {
    const { command, frame } = event.data;
    const encodeTime = performance.now();
    encoder.encode(frame);
    encodeTimes.push({ timestamp: frame.timestamp, time: encodeTime });
    frame.close();
    if (firstEncodeTime === null) {
      firstEncodeTime = encodeTime;
    }
  } else if (event.data.command === "flush") {
    await encoder.flush();
    const timeDiff = lastOutputTime - firstEncodeTime;
    self.postMessage({ command: "result", timeDiff, encodeTimes, outputTimes });
    reset();
  }
};
