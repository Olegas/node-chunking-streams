(function(){

   "use strict";

   var util = require('util');
   var Writable = require('stream').Writable;
   var GZipChunker = require('./gzip-chunker.js');
   var zlib = require('zlib');
   var path = require('path');

   util.inherits(S3MultipartUploader, Writable);

   function S3MultipartUploader(options) {
      if (!(this instanceof S3MultipartUploader))
         return new S3MultipartUploader(options);

      Writable.call(this, options);

      var self = this;

      this._bucket = options && options.bucket;
      this._key = options && options.key;
      this._s3 = options && options.s3;
      this._uploadId = '';
      this._buffers = [];
      this._eTags = [];
      this._done = false;
      this._lastSeenPart = 0;
      this._chunker = new GZipChunker({ chunkSize: 5 * 1024 * 1024 });
      this._chunkConsumer = function(chunk, done) {
         this._chunker.write(chunk);
         done();
      };

      this._chunker.on('chunkStart', function (chunkId) {
         console.log('S3MultipartUploader. Multipart upload {0}. Starting new chunk {1}'.format(self._uploadId, chunkId));
         self._buffers[chunkId] = new Buffer(0);
         self._lastSeenPart = chunkId;
      });

      this._chunker.on('data', function (chunk) {
         var bufNow = self._buffers[chunk.id];
         self._buffers[chunk.id] = Buffer.concat([ bufNow, chunk.data ], bufNow.length + chunk.data.length);
      });

      this._chunker.on('chunkEnd', function(chunkId){
         console.log('S3MultipartUploader. Multipart upload {0}. Chunk {1}. Starting part upload. '.format(self._uploadId, chunkId));
         self._s3.uploadPart({
            Bucket: self._bucket,
            Key: self._key,
            PartNumber: "" + chunkId,
            UploadId: self._uploadId,
            Body: self._buffers[chunkId]
         }, function(e, d){
            if(e) {
               console.error(e);
            } else {
               delete self._buffers[chunkId];
               self._donePart(chunkId, d.ETag);
            }
         });
      });

      this.once('finish', function finishListener(){
         console.log('S3MultipartUploader. Multipart upload {0}. Stream end.'.format(this._uploadId));
         this._chunker.end();
         this._done = true;
      });

      console.log('S3MultipartUploader. Initialized new instance to upload {0}'.format(this._key));
   }

   S3MultipartUploader.prototype._checkComplete = function() {
      var self = this;
      if(this._done && this._eTags.length == this._lastSeenPart + 1) {
         console.log('S3MultipartUploader. Multipart upload {0}. Done all chunks. Finalizing...'.format(this._uploadId));
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
            console.log('S3MultipartUploader. Multipart upload {0}. Complete.'.format(self._uploadId));
            if(err) {
               console.error(err);
            }
            self.emit('fileDone');
            self._s3 = null;
            self._buffers = null;
            self._eTags = null;
            self._chunker.removeAllListeners();
            self._chunker = null;
            self._chunkConsumer = null;
         });
      }
   };

   S3MultipartUploader.prototype._donePart = function(partId, eTag) {
      console.log('S3MultipartUploader. Multipart upload {0}. Done part {1}, got ETag {2}'.format(this._uploadId, partId, eTag));
      this._eTags[partId] = eTag;
      this._checkComplete();
   };

   S3MultipartUploader.prototype._write = function(chunk, encoding, done) {
      var self = this;

      if(!this._uploadId) {
         console.log('S3MultipartUploader. Initializing multipart upload');
         this._s3.createMultipartUpload({
            Bucket: this._bucket,
            Key: this._key
         }, function(e, r){
            console.log('S3MultipartUploader. Initialized multipart upload {0}'.format(r.UploadId));
            self._uploadId = r.UploadId;
            self._chunkConsumer(chunk, done);
         });
      } else {
         this._chunkConsumer(chunk, done)
      }
   };

   module.exports = S3MultipartUploader;

})();