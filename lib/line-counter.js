(function(){

   var util = require('util'),
       Transform = require('stream').Transform;

   util.inherits(LineCounter, Transform);

   function LineCounter(options) {
      if (!(this instanceof LineCounter))
         return new LineCounter(options);

      Transform.call(this, options);
      this._lines = '';
      this._accumulatedLines = 0;
      this._numLines = (options && options.numLines) || 1;
      this._flushTail = (options && options.flushTail) || false;
   }

   LineCounter.prototype._transform = function (chunk, encoding, done) {

      // split chunk on lines
      var begin = 0;
      for (var i = 0; i < chunk.length; i++) {
         if (chunk[i] === 10) { // '\n'
            this._accumulatedLines++;
            if (this._accumulatedLines == this._numLines) {
               this._lines += chunk.slice(begin, i + 1).toString();
               this.push(this._lines);
               this._lines = '';
               this._accumulatedLines = 0;
               begin = i + 1;
            }
         }
      }

      this._lines += chunk.slice(begin).toString();

      done();
   };

   LineCounter.prototype._flush = function(done) {
      if(this._flushTail) {
         this.push(this._lines);
      }
      done();
   };

   module.exports = LineCounter;

})();