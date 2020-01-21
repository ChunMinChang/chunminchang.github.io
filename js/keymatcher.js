class Queue {
  constructor(capacity) {
    this.queue = new Array(capacity);
    this.size = 0;
    this.start = 0;
  }
  push(value) {
    let pos = (this.start + this.size) % this.capacity;
    if (this.capacity == this.size) {
      // full
      console.assert(pos == this.start);
      this.start = (this.start + 1) % this.capacity;
    } else {
      // not full
      this.size += 1;
    }
    this.queue[pos] = value;
    console.assert(this.size <= this.capacity);
  }
  get capacity() {
    return this.queue.length;
  }
  get data() {
    let values = [];
    for (let i = 0; i < this.size; i++) {
      let index = (this.start + i) % this.capacity;
      values.push(this.queue[index]);
    }
    return values;
  }
}

class KeyMatcher {
  constructor(keys, onkeymatch) {
    this.keys = keys;
    this.onkeymatch = onkeymatch;
    this.queue = new Queue(keys.length);
  }
  init() {
    document.addEventListener("keydown", evt => {
      const key = event.key.toLowerCase();
      this.onkeydown(key);
    });
  }
  onkeydown(key) {
    this.queue.push(key);
    if (isEqualArray(this.queue.data, this.keys)) {
      this.onkeymatch();
    }
  }
}

function isEqualArray(x, y) {
  return JSON.stringify(x) == JSON.stringify(y);
}

window.addEventListener("DOMContentLoaded", () => {
  const key = "resume";
  let keyMatcher = new KeyMatcher(key.split(""), () => {
    showDetails();
  });
  keyMatcher.init();
});

function showDetails() {
  console.log("show resume!");
  let elements = document.querySelectorAll(".passcode");
  elements.forEach(element => {
    element.classList.remove("passcode");
  });
}
