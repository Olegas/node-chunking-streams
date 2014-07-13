node-chunking-streams
=====================

[![Build Status](https://travis-ci.org/Olegas/node-chunking-streams.png?branch=master)](https://travis-ci.org/Olegas/node-chunking-streams)
[![Coverage Status](https://coveralls.io/repos/Olegas/node-chunking-streams/badge.png)](https://coveralls.io/r/Olegas/node-chunking-streams)
[![NPM version](https://badge.fury.io/js/chunking-streams.png)](http://badge.fury.io/js/chunking-streams)
[![Dependency Status](https://gemnasium.com/Olegas/node-chunking-streams.png)](https://gemnasium.com/Olegas/node-chunking-streams)

A set of Node.js streams to process data in chunks

 1. LineCounter
 1. SeparatorChunker
 1. SizeChunker
 1. GzipChunker
 1. S3MultipartUploader

To intstall with NPM

```
npm install chunking-streams
```

To use with Node.JS

```javascript

var chunkingStreams = require('chunking-streams');

var LineCounter = chunkingStreams.LineCounter;
var SeparatorChunker = chunkingStreams.SeparatorChunker;
var SizeChunker = chunkingStreams.SizeChunker;

// ad so on...
```


LineCounter
-----------

Simple `TransformStream` which counts lines (`\n` is a separator) and emit data chunks contains exactly specified number
 of them.

### Configuration

```javascript
new LineCounter({
    numLines: 1,        // number of lines in a single output chunk. 1 is default
    flushTail: false    // on stream end, flush or not remaining buffer. false is default
});
```

SeparatorChunker
----------------


Split incoming data into chunks based on specified separator. After each separator found data chunk is emitted.
By default separator sequence is set to `\n`, so it is equals to LineCounter with `numLines: 1`

### Configuration

```javascript
new SeparatorChunker({
    separator: '\n', // separator sequence
    flushTail: false // on stream end, flush or not remaining buffer. false is default
});
```

SizeChunker
-----------

Split streams into chunks having exactly specified number of bytes. It is **object mode** stream!
Each data chunk is an object with the following fields:

  - id: number of chunk (starts from 0)
  - data: `Buffer` with data

SizeChunker has 2 additional events:

  - chunkStart: emitted on each chunk start.
  - chunkEnd: emitted on each chunk finish.

Both event handlers must accept two arguments:

  - id: number of chunk
  - done: callback function, **must** be called then processing is completed

If some tail data is not fit fully into specified chunk size, it can be emitted at the end if `flushTail` flag is set.

### Configuration

```javascript
new SizeChunker({
    chunkSize: 1024 // must be a number greater than zero.
    flushTail: true // flush or not remainder of an incoming stream. Defaults to false
});
```

### Example
```javascript
var input = fs.createReadStream('./input'),
    chunker = new SizeChunker({
        chunkSize: 1024
    }),
    output;

chunker.on('chunkStart', function(id, done) {
    output = fs.createWriteStream('./output-' + id);
    done();
});

chunker.on('chunkEnd', function(id, done) {
    output.end();
    done();
});

chunker.on('data', function(chunk) {
    output.write(chunk.data);
});

input.pipe(chunker);
```

### S3MultipartUploader

**INCOMPLETE**
