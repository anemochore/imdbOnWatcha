# imdb on watcha
search and show imdb rating on watcha. running on [tampermonkey](https://www.tampermonkey.net/).

## features
1. searches korean titles on [watcha pedia](https://pedia.watcha.com/) to get english titles.
2. searches english title on imdb and scrapes data using [this api](https://rapidapi.com/hmerritt/api/imdb-internet-movie-database-unofficial/).
3. stores watcha pedia and imdb data cache on tampermonkey storage.
4. if search was imperfect, clicking an item (which reveals more infomation like release year) will initiate search again.
5. if search was still imperfect, you can enter the correct url manually to update db.

## usage
1. install tampermonkey if not installed.
2. install `app.js` into tampermonkey.
3. in tampermonkey setting, set 'Config Mode' to 'Advanced' and refresh in order to access 'Storage' tab for scripts.
4. upon first run (accessing watcha.com), error popup says the api keys should be set. you should subscribe for free and get the key at [the api page](https://rapidapi.com/hmerritt/api/imdb-internet-movie-database-unofficial/).
5. now set the key at 'Storage' tab for the script in json format, eg: `"RAPID_API_KEY": "YOUR_LONG_API_KEY_BLAH_BLAH"`.
6. now refreshing watcha.com will initiate the script run.
7. processing details can be found in browser console.

## screenshot (prototype)
![sample](https://user-images.githubusercontent.com/8731054/121945768-1ddd6c80-cd8f-11eb-9d67-078e799f43e3.png)

## supported sites
1. watcha.com
2. todo: netflix?

## todo
1. support for imdb my rating -> not possible. scraping is being blocked sooner or later. user rating url sample: https://www.imdb.com/user/ur105461136/ratings
2. css tuning... -> partially done.
3. support for fetching rating per single season/episode in case of drama on imdb. maybe later...
4. support for netflix (but... other extensions are already available)
5. support for uflix (but... now i don't have an account there)
6. augmenting search -> partially done, partially discarded to reduce queries.
7. add ui to edit cache -> done.
8. add support or another script to get ratings and store on cache when accessing imdb. -> done.

## limitations
1. there's no way to find out the release year of a movie in list screen. ie 헤드헌터 (2011), 헤드헌터 (1993), and 헤드헌터 (2018) cannot be distinguished from one another.
2. in rather small browser window size, items at the bottom are shown but won't be processed (since the script cannot recognize dom change).
3. the accuracy of ratings getting via api is not quite good.

## history
// ver 0.0.1 @ 2021-5-20
//    first ver. naver crawling is almost done.
// ver 0.0.2 @ 2021-5-21
//    second ver. imdb crawling is blocked soon!
// ver 0.0.3 @ 2021-5-22
//    mutation observing (hopefully) perfectly done.
// ver 0.0.4 @ 2021-5-24
//    mutation observing fixed.
// ver 0.0.6 @ 2021-5-28
//    imdb api adopted (later changed): https://rapidapi.com/apidojo/api/imdb8/
//    refactored async fetching
// ver 0.0.8 @ 2021-5-31
//    imdb searching and scraping on hold
//    searches kinolights instead of naver movie
// ver 0.0.11 @ 2021-6-10~2021-6-11
//    search kinolights instead of naver movie via google cse prototyping done!
//    removed large-div update
//    imdb api reverted: https://rapidapi.com/rapidapi/api/movie-database-imdb-alternative/
// ver 0.0.16 @ 2021-6-15
//    div update (html tagging) bug fix
//    imdb rating and flag refactored again
//    kl searching improved
//    css added per rating
// ver 0.0.18 @ 2021-6-15
//    abort fetching on-url-change (including changing search keyword when searching)
//    reduced unnecessary multiple fetching (some kind of internal caching)
// ver 0.0.19 @ 2021-6-16
//    refactored on-url-change flow
// ver 0.0.20 @ 2021-6-16
//    now searches watcha pedia instead of kl
//    imdb api changed: https://rapidapi.com/hmerritt/api/imdb-internet-movie-database-unofficial/
// ver 0.0.21 @ 2021-6-17
//    watcha pedia scraping ig not possible due to lazy loading. reverted to kl.
// ver 0.0.25 @ 2021-6-18
//    tried to improve kl searching in vain...
//    revivaled large-div update to augment imperfect searching
//    tried to improve kl searching again...
//    fixed large div update
// ver 0.0.26 @ 2021-6-18
//    improved imdb searching slightly
// ver 0.0.30 @ 2021-6-21
//    now api keys should be manually set in tampermonkey setting
//    when accessed imdb, the cache will be updated if the movie's flag is set
//    improved imdb searching slightly
//    now force a little sleep to toast to fade out
// ver 0.0.36 @ 2021-6-23
//    now searches and scrapes watcha pedia again (idk why but lazy loading is gone)
//    watcha pedia language setting should be english!
//    improved large div update (supports for /contents/ path too)
//    improved imdb searching
//    fixed imdb access codes
//    fixed wrong cache use
// ver 0.0.39 @ 2021-6-29
//    fixed wrong divs update when navigating back and forth, etc
//    refactored to class structure to enable ui
//    added ui for manual update