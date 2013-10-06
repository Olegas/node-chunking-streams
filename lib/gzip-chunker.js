(function(){

   "use strict";

   var util = require('util'),
       Transform = require('stream').Transform,
       zlib = require('zlib');

   util.inherits(GZipChunker, Transform);

   function GZipChunker(options) {
      if(!(this instanceof GZipChunker)) {
         return new GZipChunker(options);
      }

      Transform.call(this, options);
      this._bytesPassed = 0;
      this._currentChunk = 0;
      this._chunkSize = options && options.chunkSize || 10;

      this._readableState.objectMode = true;

      this._dataHandler = function(chunk) {

         this._pushChunk(chunk);
         this._bytesPassed += chunk.length;

         if (this._bytesPassed > this._chunkSize) {
            this._chunkEnd();
         }
      }.bind(this);
   }

   GZipChunker.prototype._pushChunk = function(chunk) {
      this.push({
         data: chunk,
         id: this._currentChunk
      });
   };

   GZipChunker.prototype._chunkEnd = function(finalChunk, done) {
      var self = this;
      if(this._gzip) {
         console.log('GZipChunker. Finally flushing gzip data');
         this._gzip.removeListener('data', this._dataHandler);
         this._gzip.on('data', function(chunk){
            self._pushChunk(chunk);
         });
         this._gzip.on('end', function(){
            this.removeAllListeners();
            console.log('GZipChunker. Finally all data flushed');
            self.emit('chunkEnd', self._currentChunk);
            if(!finalChunk) {
               self._nextChunk();
            } else {
               if(done) {
                  done();
               }
            }
         });
         this._gzip.end();
      }
   };

   GZipChunker.prototype._nextChunk = function() {
      this._gzip = zlib.createGzip();
      this._gzip.on('data', this._dataHandler);
      this._bytesPassed = 0;
      this.emit('chunkStart', ++this._currentChunk);
   };

   GZipChunker.prototype._transform = function(chunk, encoding, done) {
      if(!this._gzip) {
         this._nextChunk();
      }
      this._gzip.write(chunk);
      done();
   };

   GZipChunker.prototype._flush = function(done) {
      this._chunkEnd(true, done);
   };

   module.exports = GZipChunker;

})();