// This module supplies the functionality behind the buttons and sliders that control the filter presets.

//
define(
    ['jquery', 'underscore', 'complex', 'filter', 'presets', 'audio', 'jquery.ui'],
    function($, _, Complex, filter, presets, audio) {

    var tooltipHandle = null;
    var tooltipSlider = null;
    var tooltip = $('#tooltip');
    var containerPos = $('.filter-controls').position();
    var offsetX = containerPos.left - tooltip.outerWidth() / 2 + 20;
    var offsetY = containerPos.top - tooltip.outerHeight() + 33;
    var drawDisplays = null;
    var filterTypeButtons = ['lowpass-button', 'highpass-button', 'feedforward-button', 'feedbackward-button'];

    // Adds button state style transitions to the mouse events of all filter select buttons.
    function initSelectButtons() {
        var buttons = $('.select-button');
        buttons.mousedown(function(e) {
            $(this).addClass('button-down');
            activateSelectButton($(this));
        });
        buttons.mouseup(function(e) {
            $(this).removeClass('button-down');
        });
        buttons.mouseleave(function(e) {
            $(this).removeClass('button-down');
        });
    }

    // Adds button state style transitions to the mouse events of all filter type buttons.
    function initFilterTypeButtons(buttonClass) {
        var buttons = $('.' + buttonClass);
        buttons.mousedown(function(e) {
            var filterGroup = $(this).parent();
             _.each(filterTypeButtons, function(buttonType) {
                filterGroup.find('.' + buttonType).removeClass(buttonType + '-on');
            });
            $(this).addClass('button-down ' + buttonClass + '-on');
        });
        buttons.mouseup(function(e) {
            $(this).removeClass('button-down');
        });
        buttons.mouseleave(function(e) {
            $(this).removeClass('button-down');
        });
    }

    // Binds the tooltip to the slider when the mouse cursor enters its handle button.
    function initSliders() {
        var sliders = $('.ui-slider');
        sliders.mouseenter(function() {
            tooltipSlider = $(this);
            tooltipHandle = $(this).children().first();
        });
    }

    // Lights a specific select button.
    function activateSelectButton(selectButton) {
        $('.select-button').removeClass('select-button-on');
        selectButton.addClass('select-button-on');
    }

    // Update the tooltip position and text.
    function updateTooltip(text) {
        if (!tooltipHandle || !tooltipSlider) return;
        tooltip.css('left', tooltipHandle.position().left + tooltipSlider.position().left + offsetX);
        tooltip.css('top',  tooltipHandle.position().top  + tooltipSlider.position().top  + offsetY);
        tooltip.children().first().html(text);
        tooltip.stop(true);
        tooltip.fadeIn(10);
        _.delay(function() { tooltip.fadeOut(800); }, 1000);
    }

    // Maps a linear scale to an exponential scale. This is used by the frequency parameter sliders.
    //   $$x \in [0,1] \mapsto \frac{50^x - 1}{50 - 1}$$
    function exponentialScale(x) {
        var base = 50;
        return (Math.pow(base, x) - 1) / (base - 1);
    }

    // Returns a tooltip string for a cutoff parameter tooltip.
    function cutoffTooltipText(cutoff) {
        var omega = String.fromCharCode(0x03C9);
        var pi = String.fromCharCode(0x03C0);
        return omega + '<sub>c</sub> = ' + Math.round(cutoff  * 1000 / Math.PI) / 1000 + pi;
    }


    // ### Filter preset controls ###
    // The following methods hook up all buttons and sliders to control the preset filter parameters.
    // Every preset contains an `update` function that is called from button and slider events. This
    // updates the specified filter parameter, recomputes the filter and updates the display.

    // 
    function initMovingAverageControls() {

        var order = 6;

        function update(parameter, value) {
            if (parameter == 'order') {
                if (value !== undefined) order = value;
                updateTooltip('k = '  + order);
            }
            filter.compute(presets.movingAverage(order));
            drawDisplays();
            activateSelectButton($('#moving-average-select'));
        }

        $("#moving-average-order div").slider({
            min: 2, max: 20, value: 6,
            slide: function(e, ui) { update('order', ui.value); }
        });

        $("#moving-average-order a").mousedown(function(e) { update('order'); });

        $('#moving-average-select').click(function(e) {
            e.preventDefault();
            update();
        });
    }

    function initLeakyIntegratorControls() {

        var lambda = 0.5;

        function update(parameter, value) {
            if (parameter == 'lambda') {
                if (value !== undefined) lambda = value;
                updateTooltip(String.fromCharCode(0x03BB) + ' = '  + lambda);
            }
            filter.compute(presets.leakyIntegrator(lambda));
            drawDisplays();
            activateSelectButton($('#leaky-integrator-select'));
        }

        $("#leaky-integrator-lambda div").slider({
            min: 10, max: 99, value: 50,
            slide: function(e, ui) { update('lambda', ui.value / 100); }
        });

        $("#leaky-integrator-lambda a").mousedown(function(e) { update('lambda'); });

        $('#leaky-integrator-select').click(function(e) {
            e.preventDefault();
            update();
        });
    }

    function initButterworthControls() {
        var cutoff = Math.PI * exponentialScale(0.5);
        var order = 6;
        var lowpass = true;

        function update(parameter, value) {
            if (parameter == 'cutoff') {
                if (value !== undefined) cutoff = value;
                updateTooltip(cutoffTooltipText(cutoff));
            }
            else if (parameter == 'order') {
                if (value !== undefined) order = value;
                updateTooltip('n = ' + order);
            }
            else if (parameter == 'lowpass') {
                lowpass = value;
            }
            filter.compute(presets.butterworth(cutoff, order, lowpass));
            drawDisplays();
            activateSelectButton($('#butterworth-select'));
        }

        $("#butterworth-cutoff div").slider({
            min: 50, max: 199, value: 100,
            slide: function(e, ui) { update('cutoff', Math.PI * exponentialScale(ui.value / 200)); }
        });

        $("#butterworth-order div").slider({
            min: 1, max: 3, value: 3,
            slide: function(e, ui) { update('order', ui.value * 2); }
        });

        $("#butterworth-cutoff a").mousedown(function(e) { update('cutoff'); });
        $("#butterworth-order a").mousedown(function(e) { update('order'); });

        $('#butterworth-select').click(function(e) {
            e.preventDefault();
            update();
        });

        $('#butterworth-lowpass').click(function(e) {
            e.preventDefault();
            update('lowpass', true);
        });

        $('#butterworth-highpass').click(function(e) {
            e.preventDefault();
            update('lowpass', false);
        });
    }

    function initChebyshevIControls() {
        var cutoff = Math.PI * exponentialScale(0.5);
        var order = 4;
        var ripple = 0.5;
        var lowpass = true;

        function update(parameter, value) {
            if (parameter == 'cutoff') {
                if (value !== undefined) cutoff = value;
                updateTooltip(cutoffTooltipText(cutoff));
            }
            else if (parameter == 'order') {
                if (value !== undefined) order = value;
                updateTooltip('n = ' + order);
            }
            else if (parameter == 'ripple') {
                if (value !== undefined) ripple = value;
                updateTooltip(String.fromCharCode(0x03B5) + ' = ' + ripple);
            }
            else if (parameter == 'lowpass') {
                lowpass = value;
            }
            filter.compute(presets.chebyshevTypeI(cutoff, order, ripple, lowpass));
            drawDisplays();
            activateSelectButton($('#chebyshevI-select'));
        }

        $("#chebyshevI-cutoff div").slider({
            min: 10, max:199, value: 100,
            slide: function(e, ui) { update('cutoff', Math.PI * exponentialScale(ui.value / 200)); }
        });

        $("#chebyshevI-order div").slider({
            min: 1, max: 3, value: 2,
            slide: function(e, ui) { update('order', ui.value * 2); }
        });

        $("#chebyshevI-ripple div").slider({
            min: 10, max: 90, value: 50,
            slide: function(e, ui) { update('ripple', ui.value / 100); }
        });

        $("#chebyshevI-cutoff a").mousedown(function(e) { update('cutoff'); } );
        $("#chebyshevI-order a").mousedown(function(e) { update('order'); } );
        $("#chebyshevI-ripple a").mousedown(function(e) { update('ripple'); } );

        $('#chebyshevI-select').click(function(e) {
            e.preventDefault();
            update();
        });

        $('#chebyshevI-lowpass').click(function(e) {
            e.preventDefault();
            update('lowpass', true);
        });

        $('#chebyshevI-highpass').click(function(e) {
            e.preventDefault();
            update('lowpass', false);
        });
    }

    function initCombControls() {
        var alpha = -0.9;
        var delay = 8;
        var feedForward = true;

        function update(parameter, value) {
            if (parameter == 'alpha') {
                if (value !== undefined) alpha = value;
                updateTooltip(String.fromCharCode(0x03B1) + ' = ' + Math.round(alpha  * 1000) / 1000 );
            }
            else if (parameter == 'delay') {
                if (value !== undefined) delay = value;
                updateTooltip('delay = ' + delay);
            }
            else if (parameter == 'feedForward') {
                if (value !== undefined) feedForward = value;
            }
            filter.compute(presets.comb(alpha, delay, feedForward));
            drawDisplays();
            activateSelectButton($('#comb-select'));
        }

        $("#comb-alpha div").slider({
            min: 15, max: 185, value: 10,
            slide: function(e, ui) { update('alpha', ui.value / 100 - 1); }
        });

        $("#comb-delay div").slider({
            min: 1, max: 16, value: 8,
            slide: function(e, ui) { update('delay', ui.value); }
        });

        $("#comb-alpha a").mousedown(function(e) { update('alpha'); } );
        $("#comb-delay a").mousedown(function(e) { update('delay'); } );

        $('#comb-select').click(function(e) {
            e.preventDefault();
            update();
        });

        $('#comb-feedforward').click(function(e) {
            e.preventDefault();
            update('feedForward', true);
        });

        $('#comb-feedbackward').click(function(e) {
            e.preventDefault();
            update('feedForward', false);
        });
    }

    function initBesselControls() {
        var cutoff = Math.PI * exponentialScale(0.5);
        var order = 3;
        var lowpass = true;

        function update(parameter, value) {
            if (parameter == 'cutoff') {
                cutoff = value;
                updateTooltip(String.fromCharCode(0x03C9) + '<sub>c</sub> = ' + Math.round(cutoff  * 1000 / Math.PI) / 1000 + String.fromCharCode(0x03C0));
            }
            else if (parameter == 'order') {
                order = value;
                updateTooltip('n = ' + order);
            }
            else if (parameter == 'lowpass') {
                lowpass = value;
            }

            filter.compute(presets.bessel(cutoff, order, lowpass));
            drawDisplays();
            activateSelectButton($('#bessel-select'));
        }

        $("#bessel-cutoff div").slider({
            min: 10, max: 199, value: 100,
            slide: function(e, ui) { update('cutoff', exponentialScale(ui.value / 200) * Math.PI); }
        });

        $("#bessel-order div").slider({
            min: 1, max: 6, value: 3,
            slide: function(e, ui) { update('order', ui.value); }
        });

        $('#bessel-select').click(function(e) {
            e.preventDefault();
            update();
        });

        $('#bessel-lowpass').click(function(e) {
            e.preventDefault();
            update('lowpass', true);
        });

        $('#bessel-highpass').click(function(e) {
            e.preventDefault();
            update('lowpass', false);
        });

    }

    function initOffControls() {
        
        function update() {
            filter.compute({ zeros: [], poles: [] });
            drawDisplays();
            activateSelectButton($('#off-select'));
        }

        $('#off-select').click(function(e) {
            e.preventDefault();
            update();
        });

        update();
    }


    // This method completely initializes the interface elements for the filter presets. The `repaint` parameter supplies
    // a function that must be called if the displays need to be repainted.
    function setup(repaint) {
        drawDisplays = repaint;

        initSelectButtons();
        _.each(filterTypeButtons, function(buttonType) {
            initFilterTypeButtons(buttonType);
        });

        initMovingAverageControls();
        initLeakyIntegratorControls();
        initButterworthControls();
        initChebyshevIControls();
        initCombControls();
        initBesselControls();
        initOffControls();
        initSliders();
    }


    return { setup: setup };
});
