// This module provides the interface to the Web Audio API. It handles the playback of the audio 
// clips that are processed by the filters we design.

//
define(
    [],
    function() {

    var audio = {

        processor: null,
        source: null,
        context: null,
        buffers: [],

        // Attempts to initialize the audio context, and creates a script processor node 
        // which will be responsible for the actual signal processing. The `processs` callback
        // is the method which runs the currently active filter over the queued audio buffer.
        init: function(process) {
            if (webkitAudioContext) {
                this.context = new webkitAudioContext();
                this.processor = this.context.createScriptProcessor(2048);
                this.processor.onaudioprocess = process;
                this.processor.connect(this.context.destination);
                $('#web-audio-enabled').show();
            }
        },

        // Asynchronously loads an audio file with URI given by `file` and stores it in the 
        // dictionary of audio buffers. `success` is an optional callback function to run 
        // when the loading was successful.
        loadAudio: function(file, success) {
            var self = this;
            var request = new XMLHttpRequest();
            request.open('GET', file, true);
            request.responseType = 'arraybuffer';
            request.onload = function() {
                self.context.decodeAudioData(request.response,
                    function(buffer) {
                        self.buffers[file] = buffer;
                        if (success) success();
                    }
                );
            };
            request.send();
        },

        // Stops the current playback, and starts the playback of the audio file with URI given by 
        // `file`, hooking it up to the script processor that runs the currently active filter. 
        // There is no playback if the audio clip could not be found in the audio buffer dictionary.
        playAudio: function(file) {
            if (this.source) this.source.stop(0);
            if (!this.buffers[file]) return;
            this.source = this.context.createBufferSource();
            this.source.buffer = this.buffers[file];
            this.source.connect(this.processor);
            this.source.start(0);
        },

        // Stops the current playback.
        stopAudio: function() {
            if (this.source) this.source.stop(0);
        }
    };

    return audio;
});