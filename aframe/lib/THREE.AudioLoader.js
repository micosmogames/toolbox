/* global THREE */

/*
 * The THREE.AudioLoader that ships with aframe 0.8.2 has a problem when an audio src is reused across multiple entities.
 * This hacks in a patched AudioLoader from: https://raw.githubusercontent.com/meatwallace/three.js/c91cad381242eb02644137232c17c4c454265e95/src/loaders/AudioLoader.js
 */

const { AudioContext, FileLoader, DefaultLoadingManager } = THREE;

function AudioLoader(manager) {
  this.manager = manager !== undefined ? manager : DefaultLoadingManager;
}

Object.assign(AudioLoader.prototype, {
  load: function(url, onLoad, onProgress, onError) {
    var loader = new FileLoader(this.manager);
    loader.setResponseType("arraybuffer");
    loader.load(
      url,
      function(buffer) {
        if (!(buffer instanceof ArrayBuffer)) {
          // Audio and Video preload does not give you a buffer.
          return;
        }
        // Create a copy of the buffer. The `decodeAudioData` method
        // detaches the buffer when complete, preventing reuse.
        var bufferCopy = buffer.slice(0);
        var context = AudioContext.getContext();
        context.decodeAudioData(bufferCopy, function(audioBuffer) {
          onLoad(audioBuffer);
        }, err => {
          console.log(`Audio file '${url}':`, err);
        });
      },
      onProgress,
      onError
    );
  }
});

THREE.AudioLoader = AudioLoader;
