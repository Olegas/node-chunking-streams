(function(){

   "use strict";

   var util = require('util');
   var Writable = require('stream').Writable;
   var GZipChunker = require('./gzip-chunker.js');
   var SizeChunker = require('./size-chunker');
   var zlib = require('zlib');
   var path = require('path');

   util.inherits(S3MultipartUploader, Writable);

   function S3MultipartUploader(options) {
      if (!(this instanceof S3MultipartUploader))
         return new S3MultipartUploader(options);

      Writable.call(this, options);

      var self = this,
          chunkerOptions = {
             chunkSize: 5 * 1024 * 1024
          };

      this._bucket = options && options.bucket;
      this._key = options && options.key;
      this._s3 = options && options.s3;
      this._useGzip = options && options.gzip || false;
      this._poolSize = options && options.poolSize || 4;
      this._debug = options && options.debug || false;
      this._uploadId = '';
      this._buffers = [];
      this._eTags = [];
      this._done = false;
      this._lastSeenPart = 0;
      this._chunker = this._useGzip ? new GZipChunker(chunkerOptions) : new SizeChunker(chunkerOptions);
      this._chunkConsumer = function(chunk, done) {
         this._chunker.write(chunk);
         done();
      };

      this._chunker.on('chunkStart', function (chunkId, done) {
         self._buffers[chunkId] = new Buffer(0);
         self._lastSeenPart = chunkId;
         if(done) {
            done();
         }
      });

      this._chunker.on('data', function (chunk) {
         var bufNow = self._buffers[chunk.id];
         self._buffers[chunk.id] = Buffer.concat([ bufNow, chunk.data ], bufNow.length + chunk.data.length);
      });

      this._chunker.on('chunkEnd', function(chunkId, done){

         var executor = function() {
            // acquire resource
            self._poolSize--;
            self._s3.uploadPart({
               Bucket: self._bucket,
               Key: self._key,
               PartNumber: "" + chunkId,
               UploadId: self._uploadId,
               Body: self._buffers[chunkId]
            }, function(e, d){
               // release resource
               self._poolSize++;
               if(e) {
                  console.error(e);
               } else {
                  delete self._buffers[chunkId];
                  self._donePart(chunkId, d.ETag);
               }
            });
            done();
         }, interval;

         if(self._poolSize > 0) {
            executor();
         } else {
            interval = setInterval(function(){
               if(self._poolSize > 0) {
                  clearInterval(interval);
                  executor();
               }
            }, 100)
         }

      });

      this.once('finish', function finishListener(){
         this._chunker.end();
         this._done = true;
      });
   }

   S3MultipartUploader.prototype._checkComplete = function() {
      var self = this,
          completedParts = this._eTags.reduce(function(memo, etag){
            return (memo + (etag ? 1 : 0));
          }, 0);
      if(this._done && completedParts == this._lastSeenPart) {
         this._s3.completeMultipartUpload({
            Bucket: this._bucket,
            Key: this._key,
            UploadId: this._uploadId,
            MultipartUpload: {
               Parts: this._eTags.reduce(function(prev, item, idx){
                  if(idx > 0) {
                     prev.push({
                        ETag: item,
                        PartNumber: idx
                     });
                  }
                  return prev;
               }, [])
            }
         }, function(err){
            if(err) {
               self.emit('error', err);
            } else {
               self.emit('fileDone');
               self._s3 = null;
               self._buffers = null;
               self._eTags = null;
               self._chunker.removeAllListeners();
               self._chunker = null;
               self._chunkConsumer = null;
            }
         });
      }
   };

   S3MultipartUploader.prototype._donePart = function(partId, eTag) {
      this._eTags[partId] = eTag;
      this._checkComplete();
   };

   S3MultipartUploader.prototype._write = function(chunk, encoding, done) {
      var self = this;

      if(!this._uploadId) {
         this._s3.createMultipartUpload({
            Bucket: this._bucket,
            Key: this._key
         }, function(e, r){
            if(e) {
               self.emit('error', e);
            } else {
               self._uploadId = r.UploadId;
               self._chunkConsumer(chunk, done);
            }
         });
      } else {
         this._chunkConsumer(chunk, done)
      }
   };

   module.exports = S3MultipartUploader;

})();