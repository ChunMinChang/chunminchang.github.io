/**
 * A simple AudioWorkletProcessor that detects silence.
 * It checks if the input buffer contains only zero values.
 * When the state (silent/not-silent) changes, it posts a message to the main thread.
 */
class SilenceDetector extends AudioWorkletProcessor {
  constructor() {
    super();
    // Assume silence until the first non-zero buffer is processed.
    this.isSilent = true;
  }

  process(inputs, outputs, parameters) {
    // Use the first input and first channel for detection.
    const input = inputs[0];
    if (!input || input.length === 0) {
      // No input, so we can't process. Keep processor alive.
      return true;
    }

    const channel = input[0];
    let isCurrentlySilent = true;
    for (let i = 0; i < channel.length; i++) {
      // If we find any non-zero sample, the buffer is not silent.
      if (channel[i] !== 0) {
        isCurrentlySilent = false;
        break;
      }
    }

    // If the silence state has changed, notify the main thread.
    if (this.isSilent !== isCurrentlySilent) {
      this.isSilent = isCurrentlySilent;
      this.port.postMessage({ isSilent: this.isSilent });
    }

    // Return true to keep the processor alive.
    return true;
  }
}

registerProcessor("silence-detector", SilenceDetector);