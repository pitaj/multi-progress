// from https://gist.github.com/nuxlli/b425344b92ac1ff99c74
// with some modifications & additions

var ProgressBar = require("progress");

function MultiProgress(stream) {
  var multi = Object.create(MultiProgress.prototype);
  multi.stream = stream || process.stderr;
  multi.cursor = 0;
  multi.bars = [];
  multi.terminates = 0;
  multi.amount = 0;
  multi.complete = false;
  multi.cleared = 0;

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
      if (self.terminates === self.amount) {
        self.terminate();
      }
      if (bar.clear) {
        self.cleared++;
        self.bars.splice(index, 1);
        self.move(self.bars.length);
        this.stream.clearLine();
        this.stream.cursorTo(0);
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
    this.complete = true;
  },

  move: function(index) {
    if(!this.stream.isTTY){
      return;
    }
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
