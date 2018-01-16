// Reference: https://searchfox.org/mozilla-central/rev/f42618c99dcb522fb674221acfbc68c2d92e7936/dom/media/tests/mochitest/head.js#33
/**
 * This class provides helpers around analysing the audio content in a stream
 * using WebAudio AnalyserNodes.
 *
 * @constructor
 * @param {AudioContext} audioContext
 *        AudioContext in which to create the AnalyserNode.
 */
function AudioAnalyser(audioContext, audioStream) {
  this.context = audioContext;
  this.analyser = this.context.createAnalyser();
  // this.analyser.smoothingTimeConstant = 0.2;
  this.analyser.fftSize = 1024;
  this.fftData = new Uint8Array(this.analyser.frequencyBinCount);

  if (audioStream) {
    this.stream = audioStream;
    this.source = this.context.createMediaStreamSource(this.stream);
    this.source.connect(this.analyser);
  }
}

AudioAnalyser.prototype = {
  /**
   * Get the internal AnalyserNode for analysing the audio stream.
   */
  get node() {
    return this.analyser;
  },

  /**
   * Get an array of frequency domain data for our stream's audio track.
   *
   * @returns {array} A Uint8Array containing the frequency domain data.
   */
  getByteFrequencyData: function() {
    this.analyser.getByteFrequencyData(this.fftData);
    return this.fftData;
  },

  /**
   * Return the FFT bin index for a given frequency.
   *
   * @param {double} frequency
   *        The frequency for whicht to return the bin number.
   * @returns {integer} the index of the bin in the FFT array.
   */
  binIndexForFrequency: function(frequency) {
    return 1 + Math.round(frequency * this.analyser.fftSize / this.context.sampleRate);
  },

  /**
   * Reverse operation, get the frequency for a bin index.
   *
   * @param {integer} index an index in an FFT array
   * @returns {double} the frequency for this bin
   */
  frequencyForBinIndex: function(index) {
    return (index - 1) * this.context.sampleRate / this.analyser.fftSize;
  },

  /**
   * Stop drawing of and remove the canvas from the DOM.
   */
  removeCanvas: function(cvs) {
    if (!cvs || !cvs.parentElement) {
      return;
    }

    cvs.stopDrawing = true;
    cvs.parentElement.removeChild(cvs);
  },

  /**
   * Append a canvas to the DOM where the frequency data are drawn.
   */
  openSpectrum: function(content) {
    let cvs = this.fftCanvas = document.createElement("canvas");
    content.insertBefore(cvs, content.children[0]);

    // Easy: 1px per bin
    cvs.width = this.analyser.frequencyBinCount;
    cvs.height = 200;
    cvs.style.border = "1px solid red";

    let c = cvs.getContext('2d');
    c.fillStyle = 'black';

    let self = this;
    function render() {
      c.clearRect(0, 0, cvs.width, cvs.height);
      let array = self.getByteFrequencyData();
      for (let i = 0; i < array.length; ++i) {
        c.fillRect(i, (cvs.height - (array[i] / 2)), 1, cvs.height);
        // if (array[i]) {
        //   console.log(i + " (" + self.frequencyForBinIndex(i) + "hz): " + array[i]);
        // }
      }
      if (!cvs.stopDrawing) {
        requestAnimationFrame(render);
      }
    }
    requestAnimationFrame(render);
  },

  /**
   * Stop drawing frequency data.
   */
  closeSpectrum: function() {
    this.removeCanvas(this.fftCanvas);
  },

  /**
   * Append a canvas to the DOM where the variation of frequency data are drawn.
   */
  openVariation: function(content) {
    let cvs = this.variationCanvas = document.createElement("canvas");
    content.appendChild(cvs);

    // Easy: 1px per bin
    cvs.width = this.analyser.frequencyBinCount;
    cvs.height = 200;
    cvs.style.border = "1px solid red";

    let c = cvs.getContext('2d');
    c.fillStyle = 'black';

    let lastArray = [];
    let self = this;
    function render() {
      c.clearRect(0, 0, cvs.width, cvs.height);
      let array = self.getByteFrequencyData();
      if (lastArray.length) {
        for (let i = 0; i < array.length; ++i) {
          let diff = Math.abs(lastArray[i] - array[i]);
          c.fillRect(i, cvs.height - 40 * diff, 1, cvs.height);
          // if (diff) {
          //   console.log(i + " (" + self.frequencyForBinIndex(i) +
          //               "hz) - last: " + lastArray[i] +
          //               ", current: " + array[i]);
          // }
        }
      }
      if (!cvs.stopDrawing) {
        requestAnimationFrame(render);
      }
      lastArray = array.slice(0);
    }
    requestAnimationFrame(render);
  },

  /**
   * Stop drawing the variation of frequency data.
   */
  closeVariation: function() {
    this.removeCanvas(this.variationCanvas);
  },

  /**
   * Append a canvas to the DOM where the noise of frequency data are drawn.
   */
  openSuddenChange: function(content) {
    let cvs = this.noiseCanvas = document.createElement("canvas");
    content.appendChild(cvs);

    // Easy: 1px per bin
    cvs.width = this.analyser.frequencyBinCount;
    cvs.height = 200;
    cvs.style.border = "1px solid red";

    let c = cvs.getContext('2d');
    c.fillStyle = 'black';

    let lastArray = [];
    let self = this;
    function render() {
      c.clearRect(0, 0, cvs.width, cvs.height);
      let array = self.getByteFrequencyData();
      if (lastArray.length) {
        for (let i = 0; i < array.length; ++i) {
          let value = ((array[i] != 0) != (lastArray[i] != 0)) ? 1 : 0;
          c.fillRect(i, cvs.height - 100 * value, 1, cvs.height);
          // if (value) {
          //   console.log(i + " - last: " + lastArray[i] + ", current: " + array[i]);
          // }
        }
      }
      if (!cvs.stopDrawing) {
        requestAnimationFrame(render);
      }
      lastArray = array.slice(0);
    }
    requestAnimationFrame(render);
  },

  /**
   * Stop drawing the noise of frequency data.
   */
  closeSuddenChange: function() {
    this.removeCanvas(this.noiseCanvas);
  },
};

// Reference: https://searchfox.org/mozilla-central/rev/03877052c151a8f062eea177f684a2743cd7b1d5/dom/media/tests/mochitest/head.js#183
/**
 * This class provides utilities to operate an OscillatorNode.
 *
 * @constructor
 * @param {AudioContext} audioContext
 *        AudioContext in which to create the OscillatorNode.
 * @param {double} frequency
 *        The frequency of the Oscillator.
 */
function Oscillator(audioContext, frequency)
{
  this.context = audioContext;
  this.oscillator = this.context.createOscillator();
  this.oscillator.frequency.value = frequency;
  this.destination = this.context.createMediaStreamDestination();
  this.oscillator.connect(this.destination);
}

Oscillator.prototype = {
  /**
   * Get the internal OscillatorNode.
   */
  get node() {
    return this.oscillator;
  },
  /**
   * Get the audio stream of the internal OscillatorNode.
   */
  get stream() {
    return this.destination.stream;
  },
  /**
   * Start the OscillatorNode.
   */
  start: function() {
    this.oscillator.start();
  },
  /**
   * Stop the OscillatorNode.
   *   Once it stops, it cannot start again.
   */
  stop: function() {
    this.oscillator.stop();
  }
};

/**
 * This class creates a timer to repeatedly check if the shape of the FFT
 * data changes, or the data changes from non-0/0 to 0/non-0.
 *
 * @constructor
 * @param {AudioAnalyser} analyser
 *        A AudioAnalyser that is processing a audio stream
 * @param {integer} interval
 *        The interval in milliseconds for the timer.
 * @param {integer} tolerance
 *        The acceptable range of the variation of the FFT data
 */
function NoiseDetector(analyser, interval, tolerance = 0)
{
  this.analyser = analyser;
  this.interval = interval;
  this.tolerance = tolerance;
  this.data = [];
  this.detected = false;
}

NoiseDetector.prototype = {
  /**
   * Set the timer and start detecting.
   */
  start: function() {
    this.detector = setInterval(this.detect.bind(this), this.interval);
  },

  /**
   * Clear the timer and stop detecting.
   */
  stop: function() {
    clearInterval(this.detector);
  },

  /**
   * The detecting function to check if the variation of FFT data is
   * acceptable.
   */
  detect: function() {
    if (this.detected) {
      return;
    }
    let currentdata = this.analyser.getByteFrequencyData();
    if (this.data.length) {
      for (let i = 0 ; i < currentdata.length ; ++i) {
        if ((currentdata[i] != 0) != (this.data[i] != 0)) {
          this.detected = true;
          console.log("The data changes from 0 to non-0, or non-0 to 0!");
          return;
        }
        let diff = Math.abs(currentdata[i] - this.data[i]);
        if (diff > this.tolerance) {
          this.detected = true;
          console.log("The shape of wave is changed!");
        }
      }
    }
    this.data = currentdata.slice(0); // Copy data.
  },
};