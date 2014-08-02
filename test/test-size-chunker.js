var lib = require('..'),
   Chunker = lib.SizeChunker,
   assert = require('assert');

describe('SizeChunker', function () {

   it('Can split incoming data by chunks of specified size', function (done) {

      var s = new Chunker({ chunkSize: 10 }), fixture = [
         'aaaaaaaaaa', 'bbbbbbbbbb', 'cccccccccc'
      ], buf = '', i = 0;

      s.on('chunkEnd',function (chunkNum, d) {
         assert.equal(buf, fixture[chunkNum]);
         i++;
         buf = '';
         d();
      }).on('data',function (chunk) {
         buf += chunk.data.toString();
      }).on('end', function () {
         assert.equal(fixture.length, i);
         done()
      });

      setTimeout(function () {
         s.write('aaaaaaaaaabbbbb');
      }, 10);

      setTimeout(function () {
         s.end('bbbbbcccccccccc');
      }, 10);

   });

   describe('Tail data (which is not fully fit into specified size)', function () {

      it('is emitted, when flushTail is set', function (done) {

         var s = new Chunker({ chunkSize: 10, flushTail: true }), fixture = [
            'aaaaaaaaaa', 'bbbbbbbbbb', 'cccccccccc', 'dd'
         ], buf = '', i = 0;

         s.on('chunkEnd',function (chunkNum, d) {
            assert.equal(buf, fixture[chunkNum]);
            i++;
            buf = '';
            d();
         }).on('data',function (chunk) {
            buf += chunk.data.toString();
         }).on('end', function () {
            assert.equal(fixture.length, i);
            done()
         });

         setTimeout(function () {
            s.write('aaaaaaaaaabbbbb');
         }, 10);

         setTimeout(function () {
            s.write('bbbbbccccccccc');
         }, 10);

         setTimeout(function () {
            s.end('cdd');
         }, 10);

      });

      it('is ignored, when flushTail is not set (default is false)', function (done) {

         var s = new Chunker({ chunkSize: 10 }), fixture = [
            'aaaaaaaaaa', 'bbbbbbbbbb', 'cccccccccc'
         ], buf = '', i = 0;

         s.on('chunkEnd',function (chunkNum, d) {
            assert.equal(buf, fixture[chunkNum]);
            i++;
            buf = '';
            d();
         }).on('data',function (chunk) {
            buf += chunk.data.toString();
         }).on('end', function () {
            assert.equal(fixture.length, i);
            done()
         });

         setTimeout(function () {
            s.write('aaaaaaaaaabbbbb');
         }, 10);

         setTimeout(function () {
            s.write('bbbbbccccccccc');
         }, 10);

         setTimeout(function () {
            s.end('cdd');
         }, 10);

      });

   });


});
