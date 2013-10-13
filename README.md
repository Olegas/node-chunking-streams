node-chunking-streams
=====================

[![Build Status](https://travis-ci.org/Olegas/node-chunking-streams.png?branch=master)](https://travis-ci.org/Olegas/node-chunking-streams)
[![Coverage Status](https://coveralls.io/repos/Olegas/node-chunking-streams/badge.png)](https://coveralls.io/r/Olegas/node-chunking-streams)
[![NPM version](https://badge.fury.io/js/node-chunking-streams.png)](http://badge.fury.io/js/node-chunking-streams)
[![Dependency Status](https://gemnasium.com/Olegas/node-chunking-streams.png)](https://gemnasium.com/Olegas/node-chunking-streams)

A set of Node.js streams to process data in chunks

 1. LineCounter
 1. SeparatorChunker
 1. SizeChunker
 1. GzipChunker
 1. S3MultipartUploader


LineCounter
-----------

Simple transform stream which counts lines (`\n` is a separator) and emit data chunks contains exactly specified number
 of them.

### Configuration

```javascript
  new LineCounter({
    numLines: 1,        // number of lines in a single output chunk. 1 is default
    flushTail: false    // on stream, end flush or not remaining buffer. false is default
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
        flushTail: false // on stream, end flush or not remaining buffer. false is default
    });
```