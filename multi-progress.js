// from https://gist.github.com/nuxlli/b425344b92ac1ff99c74
// with some modifications & additions

var ProgressBar = require("progress");

/**
 * @typedef MultiProgress
 * @property {(schema: string, options: ProgressBarOptions) => ProgressBar} newBar Create a new progressbar
 * @property {() => void} terminate Terminate the progress bars
 * @property {(index: number) => void} move Move the progress bars
 * @property {(index: number, value: number, options?: any) => void} tick Tick a progres bar
 * @property {(index: number, value: number, options?: any) => void} update Update a progress bar
 * @property {boolean} isTTY
 */
/**
 * @typedef ProgressBarOptions
 * These are keys in the options object you can pass to the progress bar along with total as seen in the example above.
 * @property {number} total Total number of ticks to complete.
 * @property {number} [curr] current completed index
 * @property {string} [head] head character defaulting to complete character
 * @property {number} [width] The displayed width of the progress bar defaulting to total.
 * @property {number} [renderThrottle] minimum time between updates in milliseconds defaulting to 16
 * @property {NodeJS.WritableStream} [stream] The output stream defaulting to stderr.
 * @property {string} [complete] Completion character defaulting to "=".
 * @property {string} [incomplete] Incomplete character defaulting to "-".
 * @property {boolean} [clear] Option to clear the bar on completion defaulting to false.
 * @property {Function} [callback] Optional function to call when the progress bar completes. 
 */


/**
 * @type {MultiProgress}
 */
var emptyObj = {
  newBar: function () {
    return {
      tick: function () {},
      terminate: function () {},
      update: function () {},
      render: function () {},
    };
  },
  terminate: function () {},
  move: function () {},
  tick: function () {},
  update: function () {},
  isTTY: false
};

/**
 * spawn an instance with the optional stream to write to
 * (use of `new` is optional)
 * @param {NodeJS.WriteStream} stream 
 * @returns {MultiProgress}
 */
function MultiProgress(stream) {
  var multi = Object.create(MultiProgress.prototype);
  multi.stream = stream || process.stderr;
  
  if (!multi.stream.isTTY) {
    return emptyObj;
  }
  
  multi.cursor = 0;
  multi.bars = [];
  multi.terminates = 0;

  return multi;
}


MultiProgress.prototype = {
  newBar: function(schema, options) {
    options.stream = this.stream;
    var bar = new ProgressBar(schema, options);
    this.bars.push(bar);
    var index = this.bars.length - 1;

    // alloc line
    this.move(index);
    this.stream.write('\n');
    this.cursor ++;

    // replace original
    var self = this;
    bar.otick = bar.tick;
    bar.oterminate = bar.terminate;
    bar.oupdate = bar.update;
    bar.tick = function(value, options) {
      self.tick(index, value, options);
    };
    bar.terminate = function() {
      self.terminates++;
      if (self.terminates === self.bars.length) {
        self.terminate();
      }
    };
    bar.update = function(value, options){
      self.update(index, value, options);
    };

    return bar;
  },

  terminate: function() {
    this.move(this.bars.length);
    this.stream.clearLine();
    this.stream.cursorTo(0);
  },

  move: function(index) {
    this.stream.moveCursor(0, index - this.cursor);
    this.cursor = index;
  },

  tick: function(index, value, options) {
    var bar = this.bars[index];
    if (bar) {
      this.move(index);
      bar.otick(value, options);
    }
  },

  update: function(index, value, options){
    var bar = this.bars[index];
    if (bar) {
      this.move(index);
      bar.oupdate(value, options);
    }
  }
};

module.exports = MultiProgress;
