var Stream = require('stream');
var marked = require('marked');
var gutil = require('gulp-util');
var path = require('path');
var BufferStreams = require('bufferstreams');
var _ = require('lodash');

var PLUGIN_NAME = 'gulp-marked';

// File level transform function
function fileMarked(opt) {
  // Return a callback function handling the buffered content
  return function(err, buf, callback) {

    console.log('fileMarked');

    // Handle any error
    if (err) throw err;

    // Set options
    marked.setOptions(opt || {});

    // Use the buffered content
    marked(buf.toString('utf-8'), function (err, content) {

      // Report any error with the callback
      if (err) {
        callback(new gutil.PluginError(PLUGIN_NAME, err, { showStack: true }));
      // Give the transformed buffer back
      } else {
        callback(null, content);
      }
    });
  };
}

// Plugin function
function gulpMarked(opt) {
  // Create a new Renderer object
  if (opt) {
    opt.renderer = _.assignIn(new marked.Renderer(), opt.renderer);
  }
  marked.setOptions(opt || {});

  var stream = Stream.Transform({ objectMode: true });

  stream._transform = function (file, options, callback) {
     // Do nothing when null
    if (file.isNull()) {
      stream.push(file);
      callback();
      return;
    }

    // If the ext doesn't match, pass it through
    var ext = path.extname(file.path);
    if (ext !== '.md' && ext !== '.markdown') {
      stream.push(file); callback();
      return;
    }

    file.path = gutil.replaceExtension(file.path, '.html');

    // Buffers
    if (file.isBuffer()) {
      marked(String(file.contents), function (err, content) {
        if (err) {
          callback(
            new gutil.PluginError(PLUGIN_NAME, err, { showStack: true })
          );
          return;
        }

        file.contents = new Buffer(content);
        stream.push(file);
        callback();
      });
    // Streams
    } else {
      if (file.isStream()) {
        callback(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
        return;
      }
    }
  };

  return stream;
}

// Export the marked library for convinience
gulpMarked.marked = marked;

// Export the file level transform function for other plugins usage
gulpMarked.fileTransform = fileMarked;

// Export the plugin main function
module.exports = gulpMarked;

