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