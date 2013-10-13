var lib = require('..'),
    Chunker = lib.LineCounter,
    assert = require('assert');

describe('LineCounter', function() {

    it('by default data chunk is emitted on each line received', function(done) {

        var s = new Chunker(), fixture = [ 'a\n', 'b\n', 'c\n' ], i = 0;

        s.on('data', function(chunk){
            assert.equal(fixture[i++], chunk.toString());
        }).on('end', function(){
            assert.equal(fixture.length, i);
            done()
        }).end('a\nb\nc\n');

    });

    it('one can specify required number of lines emitted', function(done){

        var s = new Chunker({ numLines: 2 }), fixture = [ 'a\nb\n', 'c\nd\n' ], i = 0;

        s.on('data', function(chunk){
            assert.equal(fixture[i++], chunk.toString());
        }).on('end', function(){
            assert.equal(fixture.length, i);
            done()
        }).end('a\nb\nc\nd\n');

    });

    it("if stream ends but required number of lines is not accumulated - remainder is truncated", function(done){

        var s = new Chunker({ numLines: 2 }), fixture = [ 'a\nb\n' ], i = 0;

        s.on('data', function(chunk){
            assert.equal(fixture[i++], chunk.toString());
        }).on('end', function(){
            assert.equal(fixture.length, i);
            done()
        }).end('a\nb\nc\n');

    });

    it('to flush stream tail (if ended, but required number of lines is not accumulated) use flushTail option', function(done){

        var s = new Chunker({ numLines: 2, flushTail: true }), fixture = [ 'a\nb\n', 'c\n' ], i = 0;

        s.on('data', function(chunk){
            assert.equal(fixture[i++], chunk.toString());
        }).on('end', function(){
            assert.equal(fixture.length, i);
            done()
        }).end('a\nb\nc\n');

    });

});
