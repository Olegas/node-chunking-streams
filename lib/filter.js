(function(){

   var util = require('util'),
       Transform = require('stream').Transform;

   util.inherits(FilterStream, Transform);

   function FilterStream(options) {
      if (!(this instanceof FilterStream))
         return new FilterStream(options);

      Transform.call(this, options);
      this._filter = options.filter || function() { return true; };
   }

   FilterStream.prototype._transform = function (chunk, encoding, done) {

      if (this._filter(chunk)) {
         this.push(chunk);
      }

      done();
   };

   module.exports = FilterStream;

})();