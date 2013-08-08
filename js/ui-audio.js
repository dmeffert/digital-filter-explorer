// This module supplies the functionality behind the buttons that control the audio playback.

//
define(
    ['jquery', 'underscore', 'audio'],
    function($, _, audio) {

    function setup() {

        // Add button state style transitions to the mouse events of all playback buttons.
        $('.play-button').mousedown(function(e) {
            $('.play-button').removeClass('play-button-on');
            $('.play-button').removeClass('button-down');
            $(this).addClass('play-button-on');
            $(this).addClass('button-down');
        });
        $('.stop-button').mousedown(function(e) {
            $('.play-button').removeClass('play-button-on');
            $('.stop-button').removeClass('stop-button-on');
            $('.stop-button').removeClass('button-down');
            $(this).addClass('stop-button-on');
            $(this).addClass('button-down');
        });
        $('.play-button').mouseup(function(e) {
            $(this).removeClass('button-down');
        });
        $('.play-button').mouseleave(function(e) {
            $(this).removeClass('button-down');
        });
        $('.stop-button').mouseup(function(e) {
            $(this).removeClass('button-down');
            $(this).removeClass('stop-button-on');
        });
        $('.stop-button').mouseleave(function(e) {
            $(this).removeClass('button-down');
        });

        // Map every playback button to an audio file.
        var trackButtons = {
            '#track01': 'audio/funkyguitar.mp3',
            '#track02': 'audio/saxophone.mp3',
            '#track03': 'audio/jazzpiano.mp3',
            '#track04': 'audio/ocean.mp3',
            '#track05': 'audio/drumnbass.mp3',
            '#track06': 'audio/hiphopbeat.mp3',
            '#track07': 'audio/breaks.mp3',
            '#track08': 'audio/psytrance.mp3'
        };
        _.each(trackButtons, function(audioFile, buttonSelector) {
            $(buttonSelector + '-play').click(function(e) {
                currentAudio = audioFile;
                audio.playAudio(audioFile);
                e.preventDefault();
            });
            $(buttonSelector + '-stop').click(function(e) {
                e.preventDefault();
                audio.stopAudio();
            });
         });

    }

    return { setup: setup };
});
