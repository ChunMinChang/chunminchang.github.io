let encoder;
function close() {
  if (encoder) {
    encoder.close();
  }
  encoder = null;
}

self.onmessage = async (event) => {
  if (event.data.command === "configure") {
    const {
      command,
      codec,
      width,
      height,
      displayWidth,
      displayHeight,
      framerate,
      bitrate,
      bitrateMode,
      scalabilityMode,
      latencyMode,
      hardwareAcceleration,
      avcFormat,
    } = event.data;
    encoder = new VideoEncoder({
      output: (chunk, metadata) => {
        const currentTime = performance.now();
        self.postMessage({ chunk, currentTime });
      },
      error: (e) => {
        console.error(e);
        self.postMessage({ error: e.message });
      },
    });
    const config = {
      codec,
      width,
      height,
      displayWidth,
      displayHeight,
      framerate,
      bitrate,
    };

    // Add H264 specific configuration
    if (codec.startsWith("avc1")) {
      config.avc = { format: avcFormat };
    }

    const validScalabilityModes = ["L1T1", "L1T2"];
    if (validScalabilityModes.includes(scalabilityMode)) {
      config.scalabilityMode = scalabilityMode;
    }

    const validBitrateModes = ["constant", "variable"];
    if (validBitrateModes.includes(bitrateMode)) {
      config.bitrateMode = bitrateMode;
    }

    const validLatencyModes = ["realtime", "quality"];
    if (validLatencyModes.includes(latencyMode)) {
      config.latencyMode = latencyMode;
    }

    const validHardwareAcceleration = [
      "no-preference",
      "prefer-hardware",
      "prefer-software",
    ];
    if (validHardwareAcceleration.includes(hardwareAcceleration)) {
      config.hardwareAcceleration = hardwareAcceleration;
    }

    console.log("Configuring encoder with:", config);

    const support = await VideoEncoder.isConfigSupported(config);
    console.log("supported? ", support.supported);
    console.log("returned config: ", support.config);
    if (!support.supported) {
      self.postMessage({ error: "Configuration not supported" });
      return;
    }

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
    self.postMessage({ result: "flushed" });
  } else if (event.data.command === "close") {
    close();
    self.postMessage({ result: "closed" });
  }
};
