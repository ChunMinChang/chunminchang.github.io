let audio = document.createElement('audio');

let playlist = getGooglePlaylist();
let index = 0;

function onPlayPauseClick() {
  playAudio();
}

function playAudio() {
  audio.src = playlist[index].src;
  audio.play()
    .then(_ => updateMetadata())
    .catch(error => Logger.log(error));
}

function updateMetadata() {
  let track = playlist[index];

  Logger.log('Playing ' + track.title + ' track...');
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: track.album,
    artwork: track.artwork
  });
}

/* Previous Track & Next Track */

navigator.mediaSession.setActionHandler('previoustrack', function() {
  Logger.log('> User clicked "Previous Track" icon.');
  index = (index - 1 + playlist.length) % playlist.length;
  playAudio();
});

navigator.mediaSession.setActionHandler('nexttrack', function() {
  Logger.log('> User clicked "Next Track" icon.');
  index = (index + 1) % playlist.length;
  playAudio();
});

audio.addEventListener('ended', function() {
  // Play automatically the next track when audio ends.
  index = (index - 1 + playlist.length) % playlist.length;
  playAudio();
});

/* Seek Backward & Seek Forward */

let skipTime = 10; /* Time to skip in seconds */

navigator.mediaSession.setActionHandler('seekbackward', function() {
  Logger.log('> User clicked "Seek Backward" icon.');
  audio.currentTime = Math.max(audio.currentTime - skipTime, 0);
});

navigator.mediaSession.setActionHandler('seekforward', function() {
  Logger.log('> User clicked "Seek Forward" icon.');
  audio.currentTime = Math.min(audio.currentTime + skipTime, audio.duration);
});

/* Play & Pause */

navigator.mediaSession.setActionHandler('play', function() {
  Logger.log('> User clicked "Play" icon.');
  audio.play();
  // Do something more than just playing audio...
});

navigator.mediaSession.setActionHandler('pause', function() {
  Logger.log('> User clicked "Pause" icon.');
  audio.pause();
  // Do something more than just pausing audio...
});

/* Stop (supported since Chrome 77) */

try {
  navigator.mediaSession.setActionHandler('stop', function() {
    Logger.log('> User clicked "Stop" icon.');
    // TODO: Clear UI playback...
  });
} catch (error) {
  Logger.log('Warning! The "stop" media session action is not supported.');
}

// /* Utils */

function getGooglePlaylist() {
  const BASE_URL = 'https://storage.googleapis.com/media-session/';

  return [{
    src: BASE_URL + 'sintel/snow-fight.mp3',
    title: 'Snow Fight',
    artist: 'Jan Morgenstern',
    album: 'Sintel',
    artwork: [{
        src: BASE_URL + 'sintel/artwork-96.png',
        sizes: '96x96',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'sintel/artwork-128.png',
        sizes: '128x128',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'sintel/artwork-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'sintel/artwork-256.png',
        sizes: '256x256',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'sintel/artwork-384.png',
        sizes: '384x384',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'sintel/artwork-512.png',
        sizes: '512x512',
        type: 'image/png'
      },
    ]
  }, {
    src: BASE_URL + 'big-buck-bunny/prelude.mp3',
    title: 'Prelude',
    artist: 'Jan Morgenstern',
    album: 'Big Buck Bunny',
    artwork: [{
        src: BASE_URL + 'big-buck-bunny/artwork-96.png',
        sizes: '96x96',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'big-buck-bunny/artwork-128.png',
        sizes: '128x128',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'big-buck-bunny/artwork-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'big-buck-bunny/artwork-256.png',
        sizes: '256x256',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'big-buck-bunny/artwork-384.png',
        sizes: '384x384',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'big-buck-bunny/artwork-512.png',
        sizes: '512x512',
        type: 'image/png'
      },
    ]
  }, {
    src: BASE_URL + 'elephants-dream/the-wires.mp3',
    title: 'The Wires',
    artist: 'Jan Morgenstern',
    album: 'Elephants Dream',
    artwork: [{
        src: BASE_URL + 'elephants-dream/artwork-96.png',
        sizes: '96x96',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'elephants-dream/artwork-128.png',
        sizes: '128x128',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'elephants-dream/artwork-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'elephants-dream/artwork-256.png',
        sizes: '256x256',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'elephants-dream/artwork-384.png',
        sizes: '384x384',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'elephants-dream/artwork-512.png',
        sizes: '512x512',
        type: 'image/png'
      },
    ]
  }, {
    src: BASE_URL + 'caminandes/original-score.mp3',
    title: 'Original Score',
    artist: 'Jan Morgenstern',
    album: 'Caminandes 2: Gran Dillama',
    artwork: [{
        src: BASE_URL + 'caminandes/artwork-96.png',
        sizes: '96x96',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'caminandes/artwork-128.png',
        sizes: '128x128',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'caminandes/artwork-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'caminandes/artwork-256.png',
        sizes: '256x256',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'caminandes/artwork-384.png',
        sizes: '384x384',
        type: 'image/png'
      },
      {
        src: BASE_URL + 'caminandes/artwork-512.png',
        sizes: '512x512',
        type: 'image/png'
      },
    ]
  }];
}

// Add a global error event listener early on in the page load, to help ensure that browsers
// which don't support specific functionality still end up displaying a meaningful message.
window.addEventListener('error', function(error) {
  console.error(error);
  Logger.setStatus(error.message + ' (Your browser may not support this feature.)');
  error.preventDefault();
});

// Init
window.addEventListener('DOMContentLoaded', (event) => {
  let playBtn = document.querySelector('#playpause');
  if (!('mediaSession' in navigator)) {
    Logger.setStatus('The Media Session API is not yet available in this browser');
    playBtn.disabled = true;
    return;
  }

  Logger.setStatus('Click the play button to start');
  // MediaSession.init();
  playBtn.addEventListener('click', onPlayPauseClick);
});

let Logger = {
  log: function() {
    var line = Array.prototype.slice.call(arguments).map(function(argument) {
      return typeof argument === 'string' ? argument : JSON.stringify(argument);
    }).join(' ');

    document.querySelector('#log').textContent += line + '\n';
  },

  clearLog: function() {
    document.querySelector('#log').textContent = '';
  },

  setStatus: function(status) {
    document.querySelector('#status').textContent = status;
  },

  setContent: function(newContent) {
    var content = document.querySelector('#content');
    while (content.hasChildNodes()) {
      content.removeChild(content.lastChild);
    }
    content.appendChild(newContent);
  }
};