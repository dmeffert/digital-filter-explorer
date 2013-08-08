// This module supplies the functions to create the filter presets. The moving average, leaky
// integrator and comb filter are designed directly as digital filters. The Butterworth, Chebyshev
// and Bessel filters are designed from their analog prototype and then converted to digital form
// using the bilinear transform.

//
define(
    ['underscore', 'complex'],
    function(_, Complex) {

    // ### Math functions ###
    // First we add the extra trigonometric and hyperbolic functions we will need to the global 
    // `Math ` object.

    // The cotangent is given by: $$\cot(\theta) = \frac{1}{\tan(\theta)}$$
    Math.cot = Math.cot || function(theta) {
        return 1 / Math.tan(theta);
    };

    // The area hyperbolic sine is given by: $$\operatorname{arsinh}(x) = \ln \left(x + \sqrt{x^{2} + 1} \right)$$
    Math.arsinh = Math.arsinh || function(x) {
        return Math.log(x + Math.sqrt(x * x + 1));
    };

    // The hyperbolic sine is given by: $$\sinh x = \frac {e^x - e^{-x}} {2}$$
    Math.sinh = Math.sinh || function(x) {
        return (Math.exp(x) - Math.exp(-x)) / 2;
    };

    // The hyperbolic cosine is given by: $$\cosh x = \frac {e^x + e^{-x}} {2}$$
    Math.cosh = Math.cosh || function(x) {
        return (Math.exp(x) + Math.exp(-x)) / 2;
    };


    // ### Bilinear transform ###
    // The *bilinear transformation* is a mapping from the "analog" $s$-plane to the "digital" 
    // $z$-plane, characterized by:
    //     $$s \mapsto \frac{1 + s/c}{1 - s/c}$$ 
    // where $c > 0$. Under this transformation, the $i\Omega$ axis from $\Omega = -\infty$ to 
    // $+\infty$ gets mapped to the $e^{i\omega}$ unit circle from $\omega = -\pi$ to $+\pi$ exactly 
    // once. The relationship between $\Omega$ and $\omega$ under this mapping is non-linear, but 
    // we can make sure that the point corresponding to the frequency $\Omega\_c = 1$ rad/sec is 
    // always mapped to a specific digital frequency of our choosing, namely $\omega\_c = $ 
    // `prewarpFrequency` by picking:
    //     $$c = \cot \frac{\omega\_c}{2}$$
    function bilinearTransform(s, prewarpFrequency) {
        var c = new Complex(Math.cot(prewarpFrequency / 2));
        var sc = Complex.divide(s, c);
        return Complex.divide(
            Complex.add(new Complex(1), sc),
            Complex.subtract(new Complex(1), sc)
        );
    }

    // ### Highpass transform ###
    // This function maps the $z$-plane zeros and poles from a lowpass design to a highpass design
    // by negating them, effectively "flipping" the frequency response around $\frac{\pi}{2}$.
    function highpassTransform(roots) {
        return _.map(roots, function(z) {
            return z.negation();
        });
    }

    var presets = {

        // ### Moving average filter ###
        // The *moving average* filter is one the easiest digital filters to understand. The output
        // signal is simply the average of a number of consecutive points of the input signal. Thus, 
        // for $k$ points we can describe the operation of the filter by the equation:
        //     $$y[n] = \frac{1}{k}\sum\_{i=0}^{k-1}x[n-i]$$
        // This corresponds to the following transfer function:
        //     $$H(z) = \frac{1 + z + z^2 + ... + z^k}{z^k}$$
        movingAverage: function(k) {
            var zeros = [];
            for (var i = 1; i < k; i++) {
                var z = Complex.exp(new Complex(0, i * 2 * Math.PI / k));
                zeros.push(z);
            }

            return {
                zeros: zeros,
                poles: []
            };
        },

        // ### Leaky integrator ###
        // The *leaky integrator* allows us to calculate the smoothed version of a sequence in a
        // recursive fashion. It is given by the equation:
        //     $$y[n] = \lambda y[n-1] + (1 - \lambda)x[n]$$
        // Which corresponds to the following transfer function:
        //     $$H(z) = \frac{1-\lambda}{1 - \lambda z^{-1}}$$
        leakyIntegrator: function(lambda) {
            return {
                zeros: [],
                poles:  [new Complex(lambda)]
            };
        },

        // ### Butterworth filter ###
        // The *Butterworth* filter has the flattest obtainable magnitude reponse in the passband,
        // with monotonic decrease of magnitude. Its analog transfer function is characterized by 
        // the following magnitude response:
        //     $$|H\_a(i\Omega)| = \sqrt{\frac{1}{1 + (\Omega^{2n}/\Omega\_c)}}$$
        // We design the filter to have an analog cutoff frequency $\Omega\_c = 1$ and map this frequency 
        // to the desired digital cutoff frequency $\omega\_c$ with the bilinear transform.
        // 
        // The poles are located at $e^{-i\theta\_k}$ for $k = 0, 1, ... n-1$ where 
        //     $$\theta\_k = \frac{\pi}{2} + \frac{(2 + k + 1)\pi}{2n}$$
        butterworth: function(cutoff, n, lowpass) {

            cutoff = lowpass ? cutoff : Math.PI - cutoff;

            var zeros = [], poles = [];
            for (var k = 0; k < n; k++) {
                var theta = Math.PI / 2 + Math.PI * (2 * k + 1) / (2 * n);
                var s_k = Complex.exp(new Complex(0, -theta));
                var pole = bilinearTransform(s_k, cutoff);
                zeros.push(new Complex(-1, 0));
                poles.push(pole);
            }

            return {
                zeros: lowpass ? zeros : highpassTransform(zeros),
                poles: lowpass ? poles : highpassTransform(poles),
                normalize: { frequency: lowpass ? 0 : Math.PI, gain: 1 }
            };
        },

        // ### Chebyshev filter ###
        // *Chebyshev* Type I filters have a better rate of attenuation beyond the passband, at the 
        // cost of a ripple in the passband (or in the stopband, for Type II filters). The Chebyshev 
        // Type I filter is characterized by the following magnitude response:
        //     $$|H\_a(i\Omega)| = \frac{1}{\sqrt{1 + \varepsilon^2T^2\_n(\Omega/\Omega\_c)}}$$
        // where $T_n$ is the Chebyshev polynomial of order $n$.
        // 
        // Just like with the Butterworth filter, we design the filter to have an analog cutoff frequency 
        // $\Omega\_c = 1$ and map this frequency to the desired digital cutoff frequency 
        // $\omega\_c$ with the bilinear transform.
        // 
        // The poles are located at:
        //     $$\sinh(\frac{1}{n}\operatorname{arsinh}(\frac{1}{\varepsilon}))\sin(\theta\_m) + \\\\
        //       i \cosh(\frac{1}{n}\operatorname{arsinh}(\frac{1}{\varepsilon}))\cos(\theta\_m)$$
        // for $m = 1, 2, ..., n$ where
        //     $$\theta\_m = \frac{\pi}{2}\frac{2m-1}{n}$$
        chebyshevTypeI: function(cutoff, n, ripple, lowpass) {

            var epsilon = ripple;
            var x = Math.arsinh(1 / epsilon) / n;
            var sinh = Math.sinh(x);
            var cosh = Math.cosh(x);

            cutoff = lowpass ? cutoff : Math.PI - cutoff;

            var zeros = [], poles = [];
            for (var m = 1; m <= n; m++) {
                var theta_m = (Math.PI / 2) * (2 * m - 1) / n;
                var s_pm = new Complex(-sinh * Math.sin(theta_m), cosh * Math.cos(theta_m));
                var pole = bilinearTransform(s_pm, cutoff);
                zeros.push(new Complex(-1, 0));
                poles.push(pole);
            }

            return {
                zeros: lowpass ? zeros : highpassTransform(zeros),
                poles: lowpass ? poles : highpassTransform(poles),
                normalize: { frequency: lowpass ? cutoff : Math.PI, gain: 1 / Math.sqrt(1 + epsilon * epsilon) }
            };
        },

        // ### Bessel filter ###
        // In the analog domain the *Bessel* filter is characterized by having the most linear phase 
        // response. This advantage does not really translate all that well to the digital domain, 
        // where it is possible to design FIR filters with exact linear phase. 
        // 
        // The analog transfer function of the Bessel filter is:
        //     $$H_a(s) = \frac{\theta\_n(0)}{\theta\_n(s / \Omega\_c)}$$
        // where $\theta\_n(s)$ is the $n$th order reverse Bessel polynomial given by
        //     $$\theta\_n(s) = \sum\_{k=0}^n \frac{s^k(2n - k)!}{2^{n-k}!(n-k)!}$$
        // 
        // Again, we design the filter to have an analog cutoff frequency $\Omega\_c = 1$ and map this 
        // frequency to the desired digital cutoff frequency $\omega\_c$ with the bilinear transform.
        // 
        // Since there is no straightforward explicit expression for the roots of Bessel polynomials 
        // they are precomputed using a polynomial root finder and directly included in the source code.
        bessel: function(cutoff, n, lowpass) {

            var factorial = _.memoize(function(n) {
                if (n <= 1) return 1;
                return factorial(n-1) * n;
            });

            function reverseBesselCoefficient(k, n) {
                return factorial(n + k) / (Math.pow(2, k) * factorial(k) * factorial(n - k));
            }

            function logReverseBesselPolynomial(n) {
                for (var k = 0; k <= n; k++) {
                    console.log(reverseBesselCoefficient(k, n));
                }
            }

            var reverseBesselRoots = [
                [
                    new Complex(-1.00000000000000)
                ],
                [
                    new Complex(-1.50000000000000,  0.866025403784439),
                    new Complex(-1.50000000000000, -0.866025403784439)
                ],
                [
                    new Complex(-2.32218535462609),
                    new Complex(-1.83890732268696,  1.754380959783720),
                    new Complex(-1.83890732268696, -1.754380959783720)
                ],
                [
                    new Complex(-2.10378939717963,  2.657418041856750),
                    new Complex(-2.10378939717963, -2.657418041856750),
                    new Complex(-2.89621060282037,  0.867234128934507),
                    new Complex(-2.89621060282037, -0.867234128934507)
                ],
                [
                    new Complex(-3.64673859532965),
                    new Complex(-2.32467430318165,  3.57102292033798),
                    new Complex(-2.32467430318165, -3.57102292033798),
                    new Complex(-3.35195639915353,  1.74266141618320),
                    new Complex(-3.35195639915353, -1.74266141618320)
                ],
                [
                    new Complex(-2.51593224781083,  4.49267295365395),
                    new Complex(-2.51593224781083, -4.49267295365395),
                    new Complex(-3.73570835632581,  2.62627231144713),
                    new Complex(-3.73570835632581, -2.62627231144713),
                    new Complex(-4.24835939586337,  0.86750967323136),
                    new Complex(-4.24835939586337, -0.86750967323136)
                ]
            ];

            cutoff = lowpass ? cutoff : Math.PI - cutoff;

            var zeros = [], poles = [];
            for (var i = 0; i < n; i++) {
                var pole = bilinearTransform(reverseBesselRoots[n-1][i], cutoff);
                zeros.push(new Complex(-1, 0));
                poles.push(pole);
            }

            return {
                zeros: lowpass ? zeros : highpassTransform(zeros),
                poles: lowpass ? poles : highpassTransform(poles),
                normalize: { frequency: lowpass ? 0 : Math.PI, gain: 1 }
            };
        },

        // ### Comb filter ###
        // The *comb* filter comes in two flavors: *feedforward* and *feedbackward*. It derives its name from the
        // appearance of a comb like shape in the frequency reponse. The feedforward comb filter simply takes
        // the input signal and adds to it a scaled and delayed copy of the input signal. Assuming a delay of $k$
        // samples and scale factor $\alpha$, the filter can be described by the equation
        //     $$y[n] = x[n] + \alpha x[n-k]$$
        // and the corresponding transfer function is:
        //     $$H(z) = \frac{z^k + \alpha}{z^k}$$
        // The feedbackward comb filter takes the input signal and adds to it a delayed copy of the output
        // signal. For a delay of $k$ samples and a scale factor $\alpha$, its equation is
        //     $$y[n] = x[n] + \alpha y[n-k]$$
        // which corresponds to the transfer function:
        //     $$H(z) = \frac{z^k}{z^k - \alpha}$$
        comb: function(alpha, delay, isFeedForward) {

            var k = delay;
            var alphaKthRoot = new Complex(alpha * (isFeedForward ? 1 : -1)).root(k);
            var zeros = [], poles = [];
            for (var i = 0; i < k; i++) {
                var z = Complex.multiply(alphaKthRoot, Complex.exp(new Complex(0, i * Math.PI * 2 / k)));
                zeros.push(isFeedForward ? z : new Complex(0));
                poles.push(isFeedForward ? new Complex(0) : z);
            }

            return {
                zeros: zeros,
                poles: poles,
                normalize: { frequency: alpha > 0 ? Math.PI / k : 0, gain: 1 }
            };

        }

    };

    //
    return presets;
});

