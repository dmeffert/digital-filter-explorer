// This module supplies the functionality behind the displays that show the pole-zero plot and the frequency response.

//
define(
    ['jquery', 'underscore', 'complex', 'filter', 'presets', 'audio', 'jquery.ui'],
    function($, _, Complex, filter, presets, audio) {

    // The currently selected pole or zero.
    var selection = null;

    // The list from which the selection came, i.e. either `filter.poles` or `filter.zeros`.
    var selectionOrigin = null;

    // The pole or zero over which the cursor is hovering.
    var hover = null;

    // The position and dimensions of the unit circle in the $z$-plane `<canvas>` element.
    var unitCircle = {
        x: 137.8,
        y: 137.5,
        radius: 86
    };

    var magnitudeReponseContext = document.getElementById('magnitude-response').getContext('2d');
    var phaseResponseContext = document.getElementById('phase-response').getContext('2d');
    var zPlaneContext = document.getElementById('z-plane').getContext('2d');


    // This function simultaneously draws the magnitude and the phase response. To do so
    // we go from $\omega = -\pi$ to $+\pi$ over 390 pixels (the width of the `<canvas>` element)
    // at `dx` pixels per step. At every step we evaluate the transfer function of the filter in 
    // $z = e^{i\omega}$. This means we are really computing the DTFT at $\omega$, and thus 
    // obtain the frequency response of the filter at frequency $\omega$.
    // 
    // We then draw a line from the previous point to the current point at $y = |H(z)|$ 
    // for the magnitude reponse, and $y = \angle H(z)$ for the phase response.
    function drawFrequencyResponse() {

        _.each([magnitudeReponseContext, phaseResponseContext], function(context) {
            context.clearRect(0, 0, 390, 106);
            context.lineWidth = 2.0;
            context.strokeStyle = '#00374e';
            context.beginPath();
        });

        var dx = 2;
        var step = dx * 2 * Math.PI / 390;

        var x = 0;
        for (var omega = -Math.PI; omega <= Math.PI; omega += step) {
            var z = Complex.exp(new Complex(0, omega));
            var reponse = filter.evaluateTransferFunction(z);
            var my = 103.0 - reponse.modulus() * 100.0;
            var fy = 53.0 - reponse.argument() * 50.0 / Math.PI;

            if (x === 0) {
                magnitudeReponseContext.moveTo(x, my);
                phaseResponseContext.moveTo(x, fy);
            } else {
                magnitudeReponseContext.lineTo(x, my);
                phaseResponseContext.lineTo(x, fy);
            }
            x += dx;
        }
        magnitudeReponseContext.stroke();
        phaseResponseContext.stroke();
    }


    // This function draws the locations of the poles of zeros on the $z$-plane display. Poles 
    // are marked by a **X**, and zeros are marked by a **O**. When multiple zeros or poles are at 
    // the same location their multiplicity is drawn next to them. Hovered zeros/poles are highlighted,
    // and selected zeros/poles are highlighted and drawn with a thicker outline. 
    function drawPoleZeroPlot() {

        zPlaneContext.clearRect(0, 0, 275, 280);
        zPlaneContext.font = '12px Arial';

        // This helper function returns the pixel coordinates inside the $z$-plane canvas
        // for a complex number `z`.
        var coordinatesFromComplexNumber = function(z) {
            return {
                x: unitCircle.x + z.real * unitCircle.radius,
                y: unitCircle.y - z.imaginary * unitCircle.radius
            };
        };

        // This helper function is used to determine the multiplicity of poles or
        // zeros.
        var countMultiplicity = function(result, z) {
            var w = _.find(result, _.compose(_.partial(Complex.areEqual, z), function(w) { return w.z; }));
            if (w !== undefined) {
                w.multiplicity++;
            }
            else {
                result.push( { z: z, multiplicity: 1 });
            }
            return result;
        };

        // Draw a circle at each zero.
        var zerosToRender = _.reduce(filter.zeros, countMultiplicity, []);
        _.each(zerosToRender, function(zero) {
            zPlaneContext.beginPath();
            var p = coordinatesFromComplexNumber(zero.z);
            var radius = Complex.areEqual(zero.z, selection) ? 4.5 : 4.0;
            zPlaneContext.arc(p.x, p.y, radius, 0, 2 * Math.PI, false);
            zPlaneContext.strokeStyle = Complex.areEqual(zero.z, hover) ? '#00677e' : '#00374e';
            zPlaneContext.lineWidth = Complex.areEqual(zero.z, selection) ? 3.0 : 2.0;
            zPlaneContext.stroke();
            if (zero.multiplicity > 1) {
                zPlaneContext.fillText(zero.multiplicity, p.x + 5, p.y - 5);
            }
        });

        // Draw a cross at each pole.
        var polesToRender = _.reduce(filter.poles, countMultiplicity, []);
        _.each(polesToRender, function(pole) {
            zPlaneContext.beginPath();
            var p = coordinatesFromComplexNumber(pole.z);
            var radius = Complex.areEqual(pole.z, selection) ? 4.5 : 4.0;
            zPlaneContext.moveTo(p.x - radius, p.y + radius);
            zPlaneContext.lineTo(p.x + radius, p.y - radius);
            zPlaneContext.moveTo(p.x - radius, p.y - radius);
            zPlaneContext.lineTo(p.x + radius, p.y + radius);
            zPlaneContext.strokeStyle = Complex.areEqual(pole.z, hover) ? '#00677e' : '#00374e';
            zPlaneContext.lineWidth = Complex.areEqual(pole.z, selection) ? 3.0 : 2.0;
            zPlaneContext.stroke();
            if (pole.multiplicity > 1) {
                zPlaneContext.fillText(pole.multiplicity, p.x + 5, p.y - 5);
            }
        });
    }

    // This function redraws both displays.
    function drawBothDisplays() {
        drawPoleZeroPlot();
        drawFrequencyResponse();
    }


    // This function sets up the pole and zero manipulation controls for the pole-zero display. Poles
    // and zeros can be click-dragged through the $z$-plane.
    function initPoleZeroControls() {

        $('#z-plane').mousemove(function(e) {
            var SNAP_SIZE = 0.03;
            var offset = $(this).offset();
            var z = new Complex(
                ((e.pageX - offset.left) - unitCircle.x) / unitCircle.radius,
                -((e.pageY - offset.top) - unitCircle.y) / unitCircle.radius
            );
            if (selection !== null && selection !== undefined)  {

                // Find out if the selected zero or pole currently also has its conjugate in
                // the list of zeros or poles.
                var conjugate = _.find(selectionOrigin, function(root) {
                    return Math.abs(root.real - selection.real) < Complex.EPSILON &&
                           Math.abs(-root.imaginary - selection.imaginary) < Complex.EPSILON &&
                           root !== selection;
                });
                var hasConjugate = conjugate !== undefined;

                // Find out if the selected pole or zero needs a conjugate at its new position
                // (i.e. if it's not on the real axis).
                var needsConjugate = Math.abs(z.imaginary) > SNAP_SIZE;

                // Move the selected pole or zero.
                selection.real = z.real;
                selection.imaginary = z.imaginary;

                // Poles should remain inside the unit circle to ensure filter stability.
                if (_.contains(filter.poles, selection)) {
                    if (selection.modulusSquared() >= 1.0 - Complex.EPSILON) {
                        selection.scaleModulusTo(1.0 - Complex.EPSILON);
                    }
                }

                // Poles and zeros come in complex conjugate pairs. Add or remove conjugates
                // as needed, based on the previous position and the new position. A pole or 
                // zero only needs its conjugate present if it is not real.
                if (needsConjugate) {
                    if (hasConjugate) {
                        conjugate.real = selection.real;
                        conjugate.imaginary = -selection.imaginary;
                    }
                    else {
                        selectionOrigin.push(new Complex(selection.real, -selection.imaginary));
                    }
                }
                else {
                    if (hasConjugate) {
                        selectionOrigin.splice(selectionOrigin.indexOf(conjugate), 1);
                    }
                    selection.imaginary = 0.0;
                }

                // Since the poles and zeros determine the filter structure, we need to compute the new filter 
                // coefficients and redraw both the $z$-plane display and the frequency response displays.
                filter.recompute();
                drawBothDisplays();
            }
            else {
                // Test to see if the mouse is hovering over one of the poles or zero.
                hover = undefined;
                _.each([filter.zeros, filter.poles], function(list) {
                    if (hover === undefined) {
                        hover = _.find(list, function(root) {
                            return Complex.subtract(root, z).modulusSquared() < 1 / unitCircle.radius;
                        });
                        if (hover !== undefined) selectionOrigin = list;
                    }
                });
                drawPoleZeroPlot();
            }

        });

        $('#z-plane').mousedown(function(e) {
            selection = hover;
            drawBothDisplays();
        });

        $('#z-plane').mouseup(function(e) {
            selection = null;
            drawBothDisplays();
        });

        $('#z-plane').mouseleave(function(e) {
            selection = null;
            hover = null;
            drawBothDisplays();
        });
    }


    return {
        repaint: drawBothDisplays,
        setup: function() {
            initPoleZeroControls();
        }
    };
});
