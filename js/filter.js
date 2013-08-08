define(
    ['underscore', 'complex'], 
    function(_, Complex) {

    // This helper function computes the coefficients of a polynomial from its roots, given by the
    // parameter `roots`. Let these roots be denoted by $r\_0, r\_1, ..., r\_n$, the coefficients by
    // $a\_0, a\_1, ..., a\_n$ and the polynomial by $P(z)$. 
    // Then $P(z)$ has degree $n$ and we can write 
    //     $$P(z) = \prod\_{i=0}^{n}(z - r\_i) = \sum\_{i=0}^{n}a\_iz^i$$
    // Now we will compute $P(z)$ in $n$ iterations. To do so, first we define 
    //     $$P\_j(z) = \prod\_{i=0}^{j}(z - r\_i) = \sum\_{i=0}^{j}a\_{j,i}z^i$$
    // Observe that $P\_0(z) = 1$, and $P\_n(z) = P(z)$. The coefficients $a\_{j,i}$ for these 
    // intermediate  polynomials are then obtained from the following recurrence relation: 
    //     $$a\_{j,i} = \begin{cases} 
    //       -a\_{j-1,0}r_j                  &\mbox{if } i = 0 \\\\
    //        a\_{j-1,i-1}                   &\mbox{if } i = j \\\\
    //        a\_{j-1,i-1} - a\_{j-1,i}r\_j  &\mbox{otherwise}
    //     \end{cases}$$
    function getPolynomialCoefficientsFromRoots(roots, coefficients) {
        if (coefficients === undefined) coefficients = [new Complex(1)];
        if (_.isEmpty(roots)) return coefficients;
        var root = _.first(roots);
        var k = coefficients.length;
        var newCoefficients = _.map(_.range(k + 1), function(n) {
            if      (n === 0)   return Complex.multiply(root.negation(), coefficients[0]);
            else if (n === k)   return _.last(coefficients);
            else                return Complex.subtract(coefficients[n - 1], Complex.multiply(root, coefficients[n]));
        });
        return getPolynomialCoefficientsFromRoots(_.tail(roots), newCoefficients);
    }

    // 
    var filter = {

        coefficients: [],
        history: null,
        poles: null,
        zeros: null,
        normalize: null,

        compute: function(settings) {

            var self = this;
            self.zeros = settings.zeros;
            self.poles = settings.poles;
            self.normalize = settings.normalize;

            // Get the polynomial coefficients from the poles and zeros.
            self.coefficients = {
                b: getPolynomialCoefficientsFromRoots(self.zeros).reverse(),
                a: getPolynomialCoefficientsFromRoots(self.poles).reverse()
            };

            // Normalize the frequency response. A frequency and desired gain for this frequency is 
            // specified in the `settings.normalize` object. If no normalization object is specified 
            // we normalize DC to unity. The  coefficients of the numerator polynomial are scaled to 
            // make sure the magnitude equals the desired  gain at the specified frequency.
            self.normalize = settings.normalize || { frequency: 0, gain: 1 };
            var gain = self.normalize.gain / self.evaluateTransferFunction(Complex.exp(new Complex(0, self.normalize.frequency))).modulus();
            self.coefficients.b = _.map(self.coefficients.b, function(x) { return Complex.multiply(x, new Complex(gain)); });

            // Helper function that creates a zero filled array of size `n`.
            function zeroArray(n) {
                return Array.apply(null, new Array(n)).map(Number.prototype.valueOf, 0);
            }

            // Create and initialize history buffers for the input and output signals.
            self.history = {
                left:  { x: zeroArray(self.coefficients.b.length), y: zeroArray(self.coefficients.a.length - 1) },
                right: { x: zeroArray(self.coefficients.b.length), y: zeroArray(self.coefficients.a.length - 1) }
            };

            return self.coefficients;
        },

        // Recomputes the filter coefficients based on updated zeros and poles.
        recompute: function() {
            this.compute({
                zeros: this.zeros,
                poles: this.poles,
                normalize: this.normalize
            });
        },

        // Evaluates the transfer function at the complex number `z` and returns the result. The
        // transfer function evaluated in the unit circle `z` $= e^{i\omega}$ with $\omega = -\pi$ 
        // to $+\pi$ gives us the frequency response.
        evaluateTransferFunction: function(z) {
            var self = this;
            var zInversePowers = [new Complex(1)];
            var zInverse = z.reciprocal();
            for (var i = 1; i < Math.max(self.coefficients.a.length, self.coefficients.b.length); i++) {
                zInversePowers.push(Complex.multiply(zInversePowers[i-1], zInverse));
            }
            var iterator = function(sum, coefficient, i) {
                return Complex.add(sum, Complex.multiply(coefficient, zInversePowers[i]));
            };
            var num = _.reduce(self.coefficients.b, iterator, new Complex(0));
            var den = _.reduce(self.coefficients.a, iterator, new Complex(0));
            return Complex.divide(num, den);
        },

        // Processes a stereo sample frame using the filter coefficients. 
        process: function(inLeft, inRight) {
            var self = this;

            var processChannel = function(sample, history) {
                history.x.unshift(sample);
                var x = _.reduce(self.coefficients.b, function(sum, b, i) { return sum + b.real * history.x[i]; }, 0.0);
                var y = _.reduce(_.tail(self.coefficients.a), function(sum, a, i) { return sum + a.real * history.y[i]; }, 0.0);
                var output = x - y;
                history.y.unshift(output);
                history.x.pop();
                history.y.pop();
                return output;
            };

            var out = {
                left:  processChannel(inLeft,  self.history.left),
                right: processChannel(inRight, self.history.right)
            };

            return out;
        },


    };

    return filter;
});