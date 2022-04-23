const WP_TO_IMDB_FIX_DICT = new Map();

//order is important
//space and case matters!
WP_TO_IMDB_FIX_DICT.set(' is ', ' Is ');  //Ben is Back
WP_TO_IMDB_FIX_DICT.set(' Isn t ', " Isn't ");  //Daniel Isn t Real

//RegExp can be set too.
WP_TO_IMDB_FIX_DICT.set(/ in$/, ' In');  //Get in
WP_TO_IMDB_FIX_DICT.set(/([0-9])MHz/, '$1 Mhz');  //0.0MHz

//replacer function is okay since it just uses String.prototype.replace()
WP_TO_IMDB_FIX_DICT.set(/^[A-Z\-]+$/, match => match[0] + match.slice(1).toLowerCase());  //ULTRAMAN
