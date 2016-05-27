// from https://gist.github.com/nuxlli/b425344b92ac1ff99c74
// with some modifications & additions

var ProgressBar = require("progress");

function MultiProgress(stream) {
  this.stream = stream || process.stderr;
  this.cursor = 0;
  this.bars = [];
  this.terminates = 0;

  if (!stream.isTTY) {
    console.error(new Error('TTY console required'));
    this.move  = function() {};
    this.terminate  = function() {};
    this.tick  = function() {};
    this.update  = function() {};
  }
}

MultiProgress.prototype = {
  newBar: function(schema, options) {
    options.stream = this.stream;
    var bar = new ProgressBar(schema, options);
    this.bars.push(bar);
    var index = this.bars.length - 1;

    // alloc line
    this.stream.isTTY && this.move(index);
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
