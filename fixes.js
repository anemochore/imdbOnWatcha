const WP_TO_IMDB_FIX_DICT = new Map();

//order is important
//space and case matters!
WP_TO_IMDB_FIX_DICT.set(' is ', ' Is ');  //Ben is Back
WP_TO_IMDB_FIX_DICT.set(' Isn t ', " Isn't ");  //Daniel Isn t Real

//testing...
//from https://help.imdb.com/article/contribution/titles/title-formatting/G56U5ERK7YY47CQB#
//Death In The Land Of Encantos
WP_TO_IMDB_FIX_DICT.set(' A ', " a ");
WP_TO_IMDB_FIX_DICT.set(' An ', " an ");
WP_TO_IMDB_FIX_DICT.set(' And ', " and ");
WP_TO_IMDB_FIX_DICT.set(' As ', " as ");
WP_TO_IMDB_FIX_DICT.set(' At ', " at ");
WP_TO_IMDB_FIX_DICT.set(' By ', " by ");
WP_TO_IMDB_FIX_DICT.set(' For ', " for ");
WP_TO_IMDB_FIX_DICT.set(' From ', " from ");
WP_TO_IMDB_FIX_DICT.set(' In ', " in ");
WP_TO_IMDB_FIX_DICT.set(' Of ', " of ");
WP_TO_IMDB_FIX_DICT.set(' On ', " on ");
WP_TO_IMDB_FIX_DICT.set(' Or ', " or ");
WP_TO_IMDB_FIX_DICT.set(' The ', " the ");
WP_TO_IMDB_FIX_DICT.set(' To ', " to ");
WP_TO_IMDB_FIX_DICT.set(' With ', " with ");

//RegExp can be set too.
WP_TO_IMDB_FIX_DICT.set(/ in$/, ' In');  //Get in
WP_TO_IMDB_FIX_DICT.set(/([0-9])MHz/, '$1 Mhz');  //0.0MHz

//replacer function is okay since it just uses String.prototype.replace()
WP_TO_IMDB_FIX_DICT.set(/^[A-Z\-]+$/, match => match[0] + match.slice(1).toLowerCase());  //ULTRAMAN
