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
   * Get an array containing the indices of the peaks of pulses in FFT data.
   */
  getPeaks: function() {
    let peaks = [];
    const Direction = {
      Unknown: 0,
      Up: 1,
      Down: 2,
    };
    let dir = Direction.Unknown;
    let data = this.getByteFrequencyData();
    for (let i = 1 ; i < data.length ; ++i) {
      if (data[i] > data[i-1]) { // Go up.
        dir = Direction.Up;
      }
      if (data[i] < data[i-1]) { // Go down.
        if (dir == Direction.Up) {
          peaks.push(i-1);
        }
        dir = Direction.Down;
      }
    }
    return peaks;
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
 * This class creates a timer to repeatedly check if the stream that is
 * processed in the given analyser is a seamless sine wave or not.
 *
 * @constructor
 * @param {AudioAnalyser} analyser
 *        A AudioAnalyser that is processing a sine wave stream.
 * @param {integer} interval
 *        The interval in milliseconds for the timer.
 * @param {integer} frequency
 *        The frequency of the sine wave that is processed
 *        by the given analyser.
 * @param {integer} range
 *        A half of an acceptable width of the pulse whose peak is the
 *        frequency of the sine wave that is processed by the given analyser.
 * @param {integer} tolerance
 *        The acceptable range of the variation of the FFT data
 *
 *          peak
 *           v
 *           |
 *          |||    ^
 *         |||||   | tolerance
 *        |||||||  v
 *       |||||||||
 * ------+++++++++----------> Frequency
 *           ^
 *       |---|
 *         ^ |
 *     range |
 *           |
 *        Frequency of the sine wave
 *
 */
function SeamlessSineDetector(analyser, interval, frequency, range = 0, tolerance = 0)
{
  this.analyser = analyser;
  this.interval = interval;
  this.frequency = frequency;
  this.range = range;
  this.tolerance = tolerance;
  this.peak = this.analyser.binIndexForFrequency(this.frequency);
  this.data = [];
  this.seamlessness = true;
}

SeamlessSineDetector.prototype = {
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
    if (!this.seamlessness) {
      return;
    }

    // Make sure all the peaks are in the available range.
    let peaks = this.analyser.getPeaks();
    for (let i = 0 ; i < peaks.length ; ++i) {
      if (!this._isIndexInPulse(peaks[i])) {
        this.seamlessness = false;
        console.log("There are peaks out of range!");
        return;
      }
    }

    // Sort the peaks by the distance to the ideal peak(this.peak).
    // Make sure the nearer to the ideal peak is, the higher its FFT value is.
    let sortedPeaks = this._getSortedPeaksByDistance(peaks);
    for (let i = 1 ; i < sortedPeaks.length ; ++i) {
      if (sortedPeaks[i-1].value < sortedPeaks[i].value) {
        this.seamlessness = false;
        console.log("The farther peak should not be higher than the nearer peak.");
        return;
      }
    }

    let currentdata = this.analyser.getByteFrequencyData();
    if (this.data.length) {
      for (let i = 0 ; i < currentdata.length ; ++i) {
        // If the data is not in the pulse of a sine wave, then it must be 0.
        if (!this._isIndexInPulse(i)) {
          if (currentdata[i] == 0) {
            continue;
          }
          this.seamlessness = false;
          console.log("This FFT value should be 0!");
          return;
        }
        // If the data is in the pulse of a sine wave, then check
        // 1) The FFT value doesn't change from 0/non-0 to non-0/0.
        if ((currentdata[i] != 0) != (this.data[i] != 0)) {
          this.seamlessness = false;
          console.log("The data changes from 0 to non-0, or non-0 to 0!");
          return;
        }
        // 2) The variation of the FFT data is acceptable.
        let diff = Math.abs(currentdata[i] - this.data[i]);
        if (diff > this.tolerance) {
          this.seamlessness = false;
          console.log("The shape of wave is changed!");
        }
      }
    }
    this.data = currentdata.slice(0); // Copy data.
  },

  _isIndexInPulse: function(index) {
    let min = this.peak - this.range;
    if (min < 0) {
      min = 0;
    }

    let max = this.peak + this.range;
    if (max >= this.analyser.node.frequencyBinCount) {
      max = this.analyser.node.frequencyBinCount - 1;
    }

    return min <= index && index <= max;
  },

  _getSortedPeaksByDistance: function(peaks) {
    let sorted = [];
    let data = this.analyser.getByteFrequencyData();
    for (let i = 0 ; i < peaks.length ; ++i) {
      sorted.push({
        index: peaks[i],
        distance: Math.abs(this.peak - peaks[i]),
        value: data[peaks[i]],
      });
    }
    sorted.sort(function(x, y) {
      return x.distance - y.distance;
    });
    return sorted;
  },
};