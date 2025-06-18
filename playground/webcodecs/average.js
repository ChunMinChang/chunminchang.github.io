// Import CircularQueue from circular-queue.js
// class CircularQueue {
//   constructor(capacity) {
//     if (typeof capacity !== "number" || capacity < 1) {
//       throw new Error("Please specify a valid capacity");
//     }
//     this.buffer = new Array(capacity + 1);
//     this.readIndex = 0; // index for next read
//     this.writeIndex = 0; // index for next write
//   }

//   get capacity() {
//     return this.buffer.length - 1;
//   }

//   get isEmpty() {
//     return this.readIndex == this.writeIndex;
//   }

//   get isFull() {
//     return (this.writeIndex + 1) % this.buffer.length == this.readIndex;
//   }

//   get size() {
//     if (this.writeIndex >= this.readIndex) {
//       return this.writeIndex - this.readIndex;
//     }
//     return this.writeIndex + this.buffer.length - this.readIndex;
//   }

//   get data() {
//     if (this.writeIndex >= this.readIndex) {
//       return this.buffer.slice(this.readIndex, this.writeIndex);
//     }
//     return this.buffer
//       .slice(this.readIndex)
//       .concat(this.buffer.slice(0, writeIndex));
//   }

//   enqueue(data) {
//     if (this.isFull) {
//       throw new Error("CircularBuffer is full!");
//     }
//     this.buffer[this.writeIndex] = data;
//     this.writeIndex = (this.writeIndex + 1) % this.buffer.length;
//   }

//   dequeue() {
//     if (this.isEmpty) {
//       return undefined;
//     }
//     const data = this.buffer[this.readIndex];
//     this.readIndex = (this.readIndex + 1) % this.buffer.length;
//     return data;
//   }
// }

class CumulativeAverage {
  constructor() {
    this.num = 0;
    this.avg = 0;
  }

  get average() {
    return this.avg;
  }

  get numberOfValues() {
    return this.num;
  }

  update(value) {
    this.num += 1;
    this.avg = this.avg + (value - this.avg) / this.num;
    return this.avg;
  }
}

class RollingAverage {
  constructor(length) {
    this.queue = new CircularQueue(length);
    this.avg = 0;
  }

  get average() {
    return this.avg;
  }

  get numberOfValues() {
    return this.queue.size;
  }

  get capacity() {
    return this.queue.capacity;
  }

  update(value) {
    if (!this.queue.isFull) {
      // cumulative average in this case
      this.queue.enqueue(value);
      this.avg = this.avg + (value - this.avg) / this.queue.size;
    } else {
      let oldest = this.queue.dequeue();
      this.queue.enqueue(value);
      this.avg = this.avg + (value - oldest) / this.queue.size;
    }
    return this.avg;
  }
}
