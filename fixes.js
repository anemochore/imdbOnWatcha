const WP_TO_IMDB_FIX_DICT = new Map();

//order is important
//space and case matters!
WP_TO_IMDB_FIX_DICT.set(' is ', ' Is ');  //Ben is Back
WP_TO_IMDB_FIX_DICT.set(' Isn t ', " Isn't ");  //Daniel Isn t Real

//RegExp can be set too.
WP_TO_IMDB_FIX_DICT.set(/ in$/, " In");  //Get in