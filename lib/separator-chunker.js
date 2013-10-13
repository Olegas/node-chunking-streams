(function(){

   var util = require('util'),
      Transform = require('stream').Transform;

   util.inherits(SeparatorChunker, Transform);

   function SeparatorChunker(options) {
      if (!(this instanceof SeparatorChunker))
         return new SeparatorChunker(options);

      Transform.call(this, options);
      this._buffer = '';
      this._separator = (options && options.separator) || "\n";
      this._flushTail = (options && options.flushTail || false);
   }

   SeparatorChunker.prototype._transform = function (chunk, encoding, done) {

      // split chunk on lines
      var begin = 0, sepPos;
      this._buffer += chunk.toString();
      while((sepPos = this._buffer.indexOf(this._separator)) != -1) {
         var portion = this._buffer.substr(0, sepPos);
         this.push(portion);
         this._buffer = this._buffer.substr(sepPos + this._separator.length);
      }

      done();
   };

   SeparatorChunker.prototype._flush = function(done) {
      if(this._flushTail) {
         this.push(this._buffer);
      }
      done();
   };

   module.exports = SeparatorChunker;

})();