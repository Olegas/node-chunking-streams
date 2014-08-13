var libPath = process.env.COVER == 'CHUNKING' ? './lib-cov' : './lib';

module.exports = {
   SizeChunker: require(libPath + '/size-chunker'),
   LineCounter: require(libPath + '/line-counter'),
   GZipChunker: require(libPath + '/gzip-chunker'),
   S3MultipartUploader: require(libPath + '/s3-multipart'),
   SeparatorChunker: require(libPath + '/separator-chunker'),
   FilterStream: require(libPath + '/filter')
};

// To be deprecated
module.exports.Chunker = module.exports.SizeChunker;