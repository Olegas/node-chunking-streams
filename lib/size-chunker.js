(function () {

   var util = require('util'),
      events = require('events'),
      Transform = require('stream').Transform,
      EventEmitter = events.EventEmitter;

   util.inherits(SizeChunker, Transform);

   function nop() {
   }

   function SizeChunker(options) {
      if (!(this instanceof SizeChunker))
         return new SizeChunker(options);

      Transform.call(this, options);
      this._bytesPassed = 0;
      this._currentChunk = -1;
      this._lastEmittedChunk = undefined;
      this._chunkSize = +(options && options.chunkSize);
      this._flushTail = (options && options.flushTail) || false;

      if (isNaN(this._chunkSize) || this._chunkSize <= 0) {
         throw new Error("Invalid chunk size. Must be a number greater than zero.");
      }

      this._readableState.objectMode = true;

      this.once('end', function () {
         if (this._flushTail && (this._lastEmittedChunk !== undefined) && this._bytesPassed > 0 ) {
            this.emit('chunkEnd', this._currentChunk, nop);
         }
      });
   }

   SizeChunker.prototype._finishChunk = function(done) {
      if (EventEmitter.listenerCount(this, 'chunkEnd') > 0) {
         this.emit('chunkEnd', this._currentChunk, function () {
            this._bytesPassed = 0;
            this._lastEmittedChunk = undefined;
            done();
         }.bind(this));
      } else {
         this._bytesPassed = 0;
         this._lastEmittedChunk = undefined;
         done();
      }
   };

   SizeChunker.prototype._startChunk = function(done) {
      this._currentChunk++;
      if (EventEmitter.listenerCount(this, 'chunkStart') > 0) {
         this.emit('chunkStart', this._currentChunk, done)
      } else {
         done();
      }
   };

   SizeChunker.prototype._pushData = function(buf) {
      this.push({
         data: buf,
         id: this._currentChunk
      });

      this._bytesPassed += buf.length;
   };

   SizeChunker.prototype._startIfNeededAndPushData = function(buf) {

      if (this._lastEmittedChunk != this._currentChunk) {
         this._startChunk(function() {
            this._lastEmittedChunk = this._currentChunk;
            this._pushData(buf);
         }.bind(this))
      } else {
         this._pushData(buf);
      }

   };

   SizeChunker.prototype._transform = function (chunk, encoding, done) {

      var _do_transform = function () {

         var
            bytesLeave = Math.min(chunk.length, this._chunkSize - this._bytesPassed),
            remainder;

         if (this._bytesPassed + chunk.length < this._chunkSize) {

            this._startIfNeededAndPushData(chunk);
            done();
         } else {

            remainder = bytesLeave - chunk.length;

            if (remainder === 0) {
               this._startIfNeededAndPushData(chunk);
               this._finishChunk(done);
            } else {
               this._startIfNeededAndPushData(chunk.slice(0, bytesLeave));
               chunk = chunk.slice(bytesLeave);
               this._finishChunk(_do_transform);
            }
         }

      }.bind(this);

      _do_transform();
   };

   module.exports = SizeChunker;


})();
