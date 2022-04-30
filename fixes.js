const WP_TO_IMDB_FIX_DICT = new Map();
const FIXES = {};  //just for clean namespace...

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
FIXES.capitalize = matchString => matchString[0] + matchString.slice(1).toLowerCase();
//WP_TO_IMDB_FIX_DICT.set(/^[A-Z\-]+$/, FIXES.capitalize);  //ULTRAMAN
WP_TO_IMDB_FIX_DICT.set(/[A-ZA-Z]{2,}[^0-9 ]/g, FIXES.capitalize);  //KILL LIST

//another dirty case of replacer function...
FIXES.capitalizeAndJoinWithX = (m, p1, p2) => FIXES.capitalize(p1) + ' x ' + FIXES.capitalize(p2);
WP_TO_IMDB_FIX_DICT.set(/([A-Z]+)×([A-Z]+)/, FIXES.capitalizeAndJoinWithX);  //SPY×FAMILY