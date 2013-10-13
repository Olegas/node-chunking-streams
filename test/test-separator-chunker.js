var lib = require('..'),
    Chunker = lib.SeparatorChunker,
    assert = require('assert');

describe('SeparatorChunker', function() {

    it('by default splits incoming stream on lines (\\n separator)', function(done) {

        var s = new Chunker(), fixture = [
            'a', 'b', 'c'
        ], i = 0;

        s.on('data', function(chunk){
            assert.equal(fixture[i++], chunk.toString());
        }).on('end', function(){
            assert.equal(3, i);
            done()
        }).end('a\nb\nc\n');

    });

    it('one can specify it\'s own separator with corresponding parameter', function(done){

        var s = new Chunker({ separator: 'X' }), fixture = [ 'a', 'b' ], i = 0;

        s.on('data', function(chunk){
            assert.equal(fixture[i++], chunk.toString());
        }).on('end', function(){
            assert.equal(fixture.length, i);
            done()
        }).end('aXbXc');

    });

    it('to flush stream tail (if ended, but no final separator met) use flushTail option', function(done){


        var s = new Chunker({ separator: 'X', flushTail: true }), fixture = [ 'a', 'b', 'c' ], i = 0;

        s.on('data', function(chunk){
            assert.equal(fixture[i++], chunk.toString());
        }).on('end', function(){
            assert.equal(fixture.length, i);
            done()
        }).end('aXbXcX');

    })

});
