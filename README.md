# Digital Filter Explorer #

A small demo that allows you to explore the structure of some commonly used digital linear filters. The pole-zero plot and frequency response of the filter are drawn on a canvas. Additionally, on Web Audio enabled browsers you can listen to the effect of the filter on some random audio clips. The code was written with simplicity and clarity in mind, and is not optimized for speed. Watch in Google Chrome for good performance.

You can check out a live demo of the project [here](http://dmeffert.github.com/digital-filter-explorer). 

**Caution**: please turn the volume on your speakers down before playing any audio clips. Although all preset filter parameters should be within a safe range, by manipulating the zeros and poles it's quite possible to generate some heavy resonant peaks that can make your speakers scream.

## Building ##
Make sure Node.js and Grunt are installed. First fetch the required Grunt plugins with:

	npm install

Then you can build the minified JavaScript and CSS with:

	grunt

And build the documentation with:

	grunt docco


## Source documentation ##
Source code documentation is generated using Docco. Initially I thought it was a good idea to include LaTeX code in the comments to explain the mathsy stuff. It does look nice in the generated documentation, but it makes the comments much harder to read when you view the raw source files. In future projects I will probably be sticking to normal text comments.
 
- [**complex.js**](http://dmeffert.github.com/digital-filter-explorer/docs/complex.html): class for dealing with complex numbers
- [**filter.js**](http://dmeffert.github.com/digital-filter-explorer/docs/filter.html): computes the filter coefficients and transfer function
- [**presets.js**](http://dmeffert.github.com/digital-filter-explorer/docs/presets.html): generates the preset filter pole-zero structures
- [**ui-displays.js**](http://dmeffert.github.com/digital-filter-explorer/docs/ui-displays.html): handles the interaction and drawing of the frequency response and pole-zero displays
- [**ui-presets.js**](http://dmeffert.github.com/digital-filter-explorer/docs/ui-presets.html): handles the interaction with the filter preset controls
- [**ui-audio.js**](http://dmeffert.github.com/digital-filter-explorer/docs/ui-audio.html): handles the interaction with the audio playback buttons
- [**audio.js**](http://dmeffert.github.com/digital-filter-explorer/docs/audio.html): handles the loading and playing of the audio clips
- [**main.js**](http://dmeffert.github.com/digital-filter-explorer/docs/main.html): entry point of the app

## Tools used ##
This project uses the following resources:

- [jQuery](http://jquery.com) 
- [jQuery UI](http://jqueryui.com): for the slider widget for controlling the filter parameters
- [Underscore.js](http://underscorejs.org): for the functional goodies 
- [Require.js](http://requirejs.org): for modular loading of JavaScript code
- [Almond](https://github.com/jrburke/almond): optimized AMD loader for the built version
- [Grunt](http://gruntjs.com/): for building optimized single-file versions of the CSS and JavaScript
- [Pro Audio UI Kit](http://www.behance.net/gallery/Pro-Audio-UI-Kit/2726145): the user interface was constructed from the widgets in this kit
- [Breakbeat Paradise](): the saxophone and guitar samples came from this site

## References ##
- [Introduction to Digital Filters by Julius O. Smith III](https://ccrma.stanford.edu/~jos/filters/): excellent introduction to the theory behind digital filters
- [Butterworth filter page from the above document](https://ccrma.stanford.edu/~jos/filters/Butterworth_Lowpass_Poles_Zeros.html): transfer function pole locations
- [Chebyshev filter page on Wikipedia](http://en.wikipedia.org/wiki/Chebyshev_filter): transfer function pole locations
- [Bessel filter page on Wikipedia](http://en.wikipedia.org/wiki/Bessel_filter): transfer function
- [Comb filter page on Wikipedia](http://en.wikipedia.org/wiki/Comb_filter): transfer function zero/pole locations
- [Online polynomial root finder](http://xrjunque.nom.es/precis/rootfinder.aspx): this was used to compute the roots of the Bessel polynomials
- [MIT OpenCourseWare: DSP Lecture 15](http://www.youtube.com/watch?v=ZbYAZLQHXSg): clear presentation of the bilinear transform
 
## License ##

Copyright (c) 2013 Dennis Meffert, under the [MIT license](http://www.opensource.org/licenses/mit-license.php).