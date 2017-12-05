//
//  non-zero         /-----\              /-----\             /-----\
//  (+ or /)        /       \            /       \           /       \
//                 /         \          /         \         /         \
//  zero  --------/           \--------/           \-------/           \-------
//                                ^                    ^
//                              sink!                sink!
//
// The following method calculate how many sinks in a given data.
// The size of a sink must be larger than `N`, or it's not a sink.

// ============================================================================
//   ZeroSinkCounter
// ============================================================================

//   WindowCounter
// ----------------------------------------------
function WindowCounter(size) {
  // Private:
  this._size = size;
  this._queue = [];
  this._sum = 0;
  // Number of same neighbors with the last element.
  this._sequence = 0;
}

WindowCounter.prototype = {
  // Public APIs
  get sum() {
    return this._sum;
  },

  get areAllSame() {
    return this._sequence >= this._queue.length - 1;
  },

  areAllSameAs(value) {
    return this.areAllSame && this.sum == value * this._queue.length;
  },

  count(data) {
    if (this._queue.length) {
      let last = this._queue[this._queue.length - 1];
      this._sequence = (data == last) ? this._sequence + 1 : 0;
    }
    if (this._queue.length >= this._size) {
      this._sum -= this._queue.shift();
    }
    this._queue.push(data);
    this._sum += data;
  },
};

//   WindowChecker
// ----------------------------------------------
function WindowChecker(size, target) {
  // Private:
  this._size = size;
  this._target = target;
  this._queue = [];
  this._sequence = 0;
  // this._maxSeq = 0;
}

WindowChecker.prototype = {
  // Public APIs
  get areAllSameAsTarget() {
    return this._sequence >= this._queue.length;
  },

  count(data) {
    if (this._queue.length >= this._size) {
      this._queue.shift();
    }
    this._queue.push(data);
    this._sequence = (data == this._target) ? this._sequence + 1 : 0;
    // this._maxSeq = Math.max(this._sequence, this._maxSeq);
  },
};

//   TREND Enum
// ----------------------------------------------
const TREND = {
  UNKNOWN: 0,
  DOWN: 1,
  UP: 2
};

//   ZeroSinkCounter (using WindowCounter)
// ----------------------------------------------
// The sink is a 0s between non-0s, so it can be counted when the data changes
// from non-0s to 0s to non-0s. We use a Trend enum to track the curve of the
// data. When the data changes from non-0s to 0s, the curve is labeled `DOWN`.
// When the data changes from 0s to non-0s, the curve is labeled `UP`. Thus,
// the sink is counted when the curve is from DOWN to UP.
//
// To distinguish 0s and non-0s

// function ZeroSinkCounter(size) {
//   this._sinks = 0;
//   this._size = size;
//   this._windowCounter = new WindowCounter(size);
//   // Set this to true to avoid counting the leading-0s as a sink.
//   this._lastFound = true;
//   this._trend = TREND.UNKNOWN;
// }

// ZeroSinkCounter.prototype = {
//   // Private APIs
//   _countSink() {
//     let found = this._windowCounter.areAllSameAs(0);
//     if (!this._lastFound && found) {
//       this._trend = TREND.DOWN;
//     }

//     if (this._lastFound && !found) {
//       if (this._trend == TREND.DOWN) {
//         ++this._sinks;
//       }
//       this._trend = TREND.UP;
//     }

//     this._lastFound = found;
//   },

//   // Public APIs
//   count(data) {
//     this._windowCounter.count(data);
//     this._countSink();
//   },

//   get sinks() {
//     return this._sinks;
//   },
// };


//   ZeroSinkCounter (using WindowChecker)
// ----------------------------------------------
// function ZeroSinkCounter(size) {
//   this._sinks = 0;
//   this._allZeroFinder = new WindowChecker(size, 0);
//   // Set this to true to avoid counting the leading-0s as a sink.
//   this._lastResult = true;
//   this._trend = TREND.UNKNOWN;
// }

// ZeroSinkCounter.prototype = {
//   // Private APIs
//   _countSink() {
//     if (!this._lastResult && this._allZeroFinder.areAllSameAsTarget) {
//       this._trend = TREND.DOWN;
//     }

//     if (this._lastResult && !this._allZeroFinder.areAllSameAsTarget) {
//       if (this._trend == TREND.DOWN) {
//         ++this._sinks;
//       }
//       this._trend = TREND.UP;
//     }

//     this._lastResult = this._allZeroFinder.areAllSameAsTarget;
//   },

//   // Public APIs
//   count(data) {
//     this._allZeroFinder.count(data);
//     this._countSink();
//   },

//   get sinks() {
//     return this._sinks;
//   },
// };



// function ZeroSinkCounter(size) {
//   this._sinks = 0;
//   this._allZeroFinder = new WindowChecker(size, 0);
//   // Set this to true to avoid counting the leading-0s as a sink.
//   this._lastResult = true;
//   this._start = false;
// }

// ZeroSinkCounter.prototype = {
//   // Private APIs
//   _countSink() {
//     // The sinks can be counted when the data change from 0s to non-0s, but
//     // the counting should be started after the wave is from non-0 to 0,
//     // to prevent from counting the leading-0s in the data.
//     if (!this._lastResult && this._allZeroFinder.areAllSameAsTarget) {
//       this._start = true;
//     }

//     if (this._start && this._lastResult &&
//         !this._allZeroFinder.areAllSameAsTarget) {
//       ++this._sinks;
//     }

//     this._lastResult = this._allZeroFinder.areAllSameAsTarget;
//   },

//   // Public APIs
//   count(data) {
//     this._allZeroFinder.count(data);
//     this._countSink();
//   },

//   get sinks() {
//     return this._sinks;
//   },
// };



function ZeroSinkCounter(size) {
  this._toZero = 0;
  this._allZeroFinder = new WindowChecker(size, 0);
  // Set this to true to avoid counting the leading-0s as a sink.
  this._lastResult = true;
}

ZeroSinkCounter.prototype = {
  // Private APIs
  _countSink() {
    // The sinks can be counted when the data change from non-0s to 0s, but
    // the ending-0s may be counted as well so it needs to be cut if needed.
    if (!this._lastResult && this._allZeroFinder.areAllSameAsTarget) {
      ++this._toZero;
    }
    this._lastResult = this._allZeroFinder.areAllSameAsTarget;
  },

  // Public APIs
  count(data) {
    this._allZeroFinder.count(data);
    this._countSink();
  },

  get sinks() {
    let tail = this._allZeroFinder.areAllSameAsTarget ? 1 : 0;
    return this._toZero - tail;
  },
};