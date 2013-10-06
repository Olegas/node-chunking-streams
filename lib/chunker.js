(function(){

   var util = require('util'),
       Transform = require('stream').Transform;

   util.inherits(Chunker, Transform);

   function nop(){}

   function Chunker(options) {
      if (!(this instanceof Chunker))
         return new Chunker(options);

      Transform.call(this, options);
      this._bytesPassed = 0;
      this._currentChunk = 0;
      this._chunkSize = options && options.chunkSize || 10;

      this._readableState.objectMode = true;

      this.once('end', function(){
         this.emit('chunkEnd', this._currentChunk, nop);
      });
   }

   Chunker.prototype._transform = function (chunk, encoding, done) {

      var _do_transform = function () {

         this.push({
            data: chunk,
            id: this._currentChunk
         });

         this._bytesPassed += chunk.length;

         if (this._bytesPassed > this._chunkSize) {
            this.emit('chunkEnd', this._currentChunk, function(){
               this._bytesPassed = 0;
               this.emit('chunkStart', ++this._currentChunk, done);
            }.bind(this));
         }
         else {
            done();
         }

      }.bind(this);

      if (this._currentChunk == 0) {
         this.emit('chunkStart', ++this._currentChunk, _do_transform);
      } else {
         _do_transform();
      }
   };

   module.exports = Chunker;


})();