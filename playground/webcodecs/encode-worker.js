let encoder;
function reset() {
  encoder = null;
}

self.onmessage = async (event) => {
  if (event.data.command === "configure") {
    const {
      command,
      codec,
      width,
      height,
      framerate,
      bitrate,
      bitrateMode,
      scalabilityMode,
      latencyMode,
      avcFormat,
    } = event.data;
    encoder = new VideoEncoder({
      output: (chunk, metadata) => {
        const currentTime = performance.now();
        self.postMessage({ chunk, currentTime });
      },
      error: (e) => console.error(e),
    });
    const config = {
      codec,
      width,
      height,
      framerate,
      bitrate,
      bitrateMode,
      latencyMode,
    };

    // Add H264 specific configuration
    if (codec.startsWith("avc1")) {
      config.avc = { format: avcFormat };
    }

    const validScalabilityModes = ["L1T1", "L1T2"];
    if (validScalabilityModes.includes(scalabilityMode)) {
      config.scalabilityMode = scalabilityMode;
    }
    console.log("Configuring encoder with:", config);

    encoder.configure(config);
  } else if (event.data.command === "encode") {
    const { command, frame } = event.data;
    const currentTime = performance.now();
    encoder.encode(frame);
    self.postMessage({
      encodeTime: currentTime,
      frameTimestamp: frame.timestamp,
    });
    frame.close();
  } else if (event.data.command === "flush") {
    await encoder.flush();
    self.postMessage({ result: "finish" });
    reset();
  }
};
