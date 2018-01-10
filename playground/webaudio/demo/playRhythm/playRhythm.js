'use strict';

(function(aExports) {

  var audioContext;
  var bufferLoader;
  var source;

  function debug(aMsg) {
    console.log('[demo.js] ' + aMsg);
  }

  function init() {
    // Set audio context
    try {
      audioContext = new AudioContext();

      // Load songs
      let songs = {
        kick: '../sounds/kick.wav',
        snare: '../sounds/snare.wav',
        hihat: '../sounds/hihat.wav',
      };
      bufferLoader = new BufferLoader(songs);

      bufferLoader.load();
    } catch(e) {
      debug(e);
      return;
    }

    // Set callbacks
    setEventHandlers();
  }

  function setEventHandlers() {
    let playButton = document.querySelector('#playButton');
    playButton.onclick = play;

    function resetButtonState() {
      // Make play button clickable
      playButton.disabled = false;
    }

    function onEnded(aEvent) {
      resetButtonState();
    }

    function play(aEvent) {
      // play the sound
      playRhythm(2);
      // Set ended callback that will be fired upon sound finishes playing
      source.onended = onEnded;
      // Make play button unclickable
      playButton.disabled = true;
    }
  }

  function playSound(aBuffer, aTime) {
    setAudioSource(aBuffer);
    source.start(aTime);
  }

  function playRhythm(aRepeat) {
    let kick = bufferLoader.bufferList.kick;
    let snare = bufferLoader.bufferList.snare;
    let hihat = bufferLoader.bufferList.hihat;

    // We'll start playing the rhythm 100 milliseconds from "now"
    const startTime = audioContext.currentTime + 0.100;
    // Delay Time for quarter-note beats
    //   = 60 s       (1 minute) / Tempo (BPM)
    //   = 60,000 ms  (1 minute) / Tempo (BPM)
    // Delay Time for eighth-note beats
    //   = Delay Time for quarter-note beats / 2
    //   = 30 s / Tempo (BPM)
    const tempo = 80; // BPM (beats per minute)
    const eighthNoteTime = 30 / tempo; // seconds

    // Play |aRepeat| bars of the following:
    for (var bar = 0; bar < aRepeat; bar++) {
      let time = startTime + bar * 8 * eighthNoteTime;
      // Play the bass (kick) drum on beats 1, 5
      playSound(kick, time);
      playSound(kick, time + 4 * eighthNoteTime);
      // Play the snare drum on beats 3, 7
      playSound(snare, time + 2 * eighthNoteTime);
      playSound(snare, time + 6 * eighthNoteTime);
      // Play the hi-hat every eighthh note.
      for (var i = 0; i < 8; ++i) {
        playSound(hihat, time + i * eighthNoteTime);
      }
    }
  }

  // BufferLoader class:
  // @ aUrlList:  A list containg all the urls of the sounds will be loaded
  function BufferLoader(aUrlList) {
    this.urlList = aUrlList;
    this.bufferList = {};
  }

  BufferLoader.prototype.load = function() {
    let self = this;
    return new Promise(function(aResolve, aReject) {
      if (!audioContext) {
        aReject('No available AudioContext');
        return;
      }

      // A function that will be fired upon all the urls in list are loaded
      self.onLoaded = function() {
        debug('All songs are loaded!');
        aResolve();
      }

      // A function that will be fired if there is anything wrong in decoding
      let handled = false;
      self.onError = function(aError, aKey) {
        debug(aError);
        debug('Failed to load song ' + aKey + ': ' + self.urlList[aKey]);
        if (!handled) {
          handled = true;
          aReject(aError);
        }
      }

      for (let key in self.urlList) {
        self.loadBuffer(key);
      }
    });
  }

  BufferLoader.prototype.loadBuffer = function(aKey) {
    // Use XMLHttpRequest for fetching sound files.
    // The audio file data is binary
    // so we set the responseType of the request to 'arraybuffer'.
    var request = new XMLHttpRequest();
    let url = this.urlList[aKey];
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // We will use |this| in request.onload.
    // However, the |this| in request.onload is |request|,
    // so we set |self| to |this| and use |self| in request.onload.
    let self = this;

    // Once the undecoded audio file data has been received
    // it can be kept around for later decoding
    request.onload = function() {
      let audioData = request.response;

      // Decode asynchronously
      audioContext.decodeAudioData(audioData, function onDecoded(aBuffer) {
        self.bufferList[aKey] = aBuffer;
        if (Object.keys(self.bufferList).length ==
            Object.keys(self.urlList).length) {
          self.onLoaded();
        }
      }, function onError(aError) {
        debug('Error with decoding audio data');
        self.onError(aError, aKey);
      });
    }

    request.onerror = function() {
      debug('BufferLoader: XHR error');
      self.onError('XHR error', aKey);
    }

    // Send the XMLHttpRequest request
    request.send();
  }

  function setAudioSource(aBuffer) {
    // Creates a sound source which is a AudioBufferSourceNode
    source = audioContext.createBufferSource();
    // Tell the source which sound to play
    source.buffer = aBuffer;
    // Connect the source to the context's destination
    // (system default is the speakers)
    source.connect(audioContext.destination);

    // The source, a AudioBufferSourceNode, is one-time-use only.
    // If we want to play the audio from the source repleatly,
    // we need to create the a new AudioBufferSourceNode and assign its
    // reference to the source.
  }

  // Run all the functions after the DOM content is loaded.
  aExports.ready(init);
}(window));
