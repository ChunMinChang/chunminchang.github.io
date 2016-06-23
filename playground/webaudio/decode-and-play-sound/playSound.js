'use strict';

(function(aExports) {

  var audioContext;
  var source;

  function debug(aMsg) {
    console.log('[demo.js] ' + aMsg);
  }

  function init() {
    // Set audio context
    try {
      audioContext = new AudioContext();
    } catch(e) {
      debug(e);
      debug('Web Audio API is not supported in this browser');
      return;
    }

    // Set callbacks
    setEventHandlers();
  }

  function setEventHandlers() {
    let playButton = document.querySelector('#playButton');
    let stopButton = document.querySelector('#stopButton');
    let loop = document.querySelector('#loop');

    playButton.onclick = play;
    stopButton.onclick = stop;
    loop.onclick = setLoop;

    function resetButtonState() {
      // Make play button clickable
      playButton.disabled = false;
      // Make stop button unclickable
      stopButton.disabled = true;;
    }

    function onEnded(aEvent) {
      resetButtonState();
    }

    function play(aEvent) {
      let soundUrl = '../sounds/acoustic-guitar-strummy2.mp3';
      loadSound(soundUrl)
      .then(setAudioSource)
      .then(function() {
        // Set ended callback that will be fired upon sound finishes playing
        // If source.loop is set to true, then there is no 'end',
        // so the callback won't be triggered.
        source.onended = onEnded;
        // play the source now
        source.start(0);
        // Set loop for source
        source.loop = loop.checked;
        // Make play button unclickable
        playButton.disabled = true;
        // Make stop button clickable
        stopButton.disabled = false;
      });
    }

    function stop(aEvent) {
      if (!source) {
        debug('Audio source is not loaded yet');
        return;
      }
      // Stop playing the sound now
      source.stop(0);

      resetButtonState();
    }

    function setLoop(aEvent) {
      if (!source) {
        debug('Audio source is not loaded yet');
        return;
      }

      source.loop = loop.checked;
    }
  }

  // Media formats for the browsers:
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Supported_media_formats#Browser_compatibility
  function loadSound(aUrl) {
    return new Promise(function(aResolve, aReject) {
      // If there is no Audio Context yet, do nothing!
      if (!audioContext) {
        aReject('No available AudioContext');
        return;
      }

      // Use XMLHttpRequest for fetching sound files.
      // The audio file data is binary
      // so we set the responseType of the request to 'arraybuffer'.
      var request = new XMLHttpRequest();
      request.open('GET', aUrl, true);
      request.responseType = 'arraybuffer';

      // Once the undecoded audio file data has been received
      // it can be kept around for later decoding
      request.onload = function() {
        let audioData = request.response;

        // Decode asynchronously
        audioContext.decodeAudioData(audioData, function onDecoded(aBuffer) {
          aResolve(aBuffer);
        }, function onError(aError) {
          debug('Error with decoding audio data');
          aReject(aError);
        });
      }

      request.onerror = function() {
        aReject('BufferLoader: XHR error');
      }

      // Send the XMLHttpRequest request
      request.send();
    });
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
