requirejs.config({
    baseUrl: 'js',
    shim: {
        'jquery': { exports: '$' },
        'jquery.ui': ['jquery'],
        'underscore': { exports: '_' }
    },
    paths: {
        'jquery': 'lib/jquery-2.0.2.min',
        'jquery.ui': 'lib/jquery-ui-1.10.3.min',
        'underscore': 'lib/underscore'
    }
});

// This module is the entry point of the app. It initializes all user interface components, 
// initializes the audio system and loads the audio clips.

//
require(
    ['ui-audio', 'ui-displays', 'ui-presets', 'audio', 'filter', 'presets'],
    function(uiAudio, uiDisplays, uiPresets, audio, filter, presets) {

    // Prevent the user from selecting text.
    document.onselectstart = function() { return false; };

    // Initialize to a filter that does nothing.
    filter.compute({ zeros: [], poles: [] });

    // Initialize the user interface.
    uiAudio.setup();
    uiDisplays.setup();
    uiPresets.setup(uiDisplays.repaint);

    // Callback function for the script processor. It applies the `process` function of the current 
    // filter to all sample frames.
    function process(e) {
        var leftIn = e.inputBuffer.getChannelData(0);
        var rightIn = e.inputBuffer.getChannelData(1);
        var leftOut = e.outputBuffer.getChannelData(0);
        var rightOut = e.outputBuffer.getChannelData(1);

        for (var i = 0; i < leftIn.length; i++) {
            var out = filter.process(leftIn[i], rightIn[i]);
            leftOut[i] = out.left;
            rightOut[i] = out.right;
        }
    }

    var audioFiles = [
        'audio/funkyguitar.mp3',
        'audio/saxophone.mp3',
        'audio/jazzpiano.mp3',
        'audio/ocean.mp3',
        'audio/breaks.mp3',
        'audio/hiphopbeat.mp3',
        'audio/drumnbass.mp3',
        'audio/psytrance.mp3'
    ];
    audio.init(process);
    _.each(audioFiles, function(audioFile) {
        audio.loadAudio(audioFile);
    });
});