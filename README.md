# imdb on watcha
Search and show IMDb ratings on Watcha running on [Tampermonkey](https://www.tampermonkey.net/).

## features
1. Searches Korean titles on [Watcha Pedia](https://pedia.watcha.com/) to get English titles.
2. Searches English title on IMDb and scrapes data using [this API](https://rapidapi.com/SAdrian/api/data-imdb1/).
3. Stores Watcha Pedia and IMDb data cache on Tampermonkey storage.
4. If search was imperfect, clicking an item (which reveals more infomation like release year) will initiate search again.
5. If search was still imperfect, you can enter the correct url manually to update the cache.
6. Still, the API is not perfect. So when you visit the IMDb page, the script will try to update the cache if possible.

## usage
1. Install [Tampermonkey](https://www.tampermonkey.net/) if not installed.
2. Install `app.js` into Tampermonkey.
3. In Tampermonkey setting, set 'Config Mode' to 'Advanced' and refresh in order to access 'Storage' tab for scripts.
4. Upon first run (accessing watcha.com), an error popup will show up saying the API keys should be set. You should subscribe for free and get the key at [the API page](https://rapidapi.com/SAdrian/api/data-imdb1/).
5. Set the key at 'Storage' tab for the script in JSON format, eg. `"RAPID_API_KEY": "YOUR_LONG_API_KEY_BLAH_BLAH"` and refresh.
6. **IMPORTANT: Now, before accesing watcha.com, please logout on pedia.watcha.com and then re-login on watcha.com!
7. Now refreshing watcha.com will initiate the script run.
8. Processing details can be found in browser console.
9. **IMPORTANT: When the API is blocked, you should contact the API provider.

## screenshot
![sample](https://user-images.githubusercontent.com/8731054/123694785-bcd88d00-d894-11eb-9e37-a2ce4233448a.png)

## supported sites
1. watcha.com
2. m.kinolights.com (only /title pages)
2. todo: netflix

## todo
0. fix (remove) large-div handling on watcha & improve click-ability on fy-item links
1. support for imdb my rating -> not possible. scraping is being blocked sooner or later. user rating url sample: https://www.imdb.com/user/ur105461136/ratings
2. css tuning... -> partially done.
3. support for fetching rating per single season/episode in case of drama on imdb. maybe later...
4. support for netflix (but... other extensions are already available)
5. support for uflix (but... now i don't have an account there)
6. augmenting search -> partially done, partially discarded to reduce queries.
7. add ui to edit cache -> done.
8. add support or another script to get ratings and store on cache when accessing imdb. -> done.
9. 왓챠는 한국 사람이 쓰는 건데 왜 문서는 영어로 썼나...
10. make it smoother and more efficient when clicking left/right arrows.

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
    // ver 0.0.46 @ 2021-6-29
    //    edited selectors according to watcha dom change
    //    improved imdb searching
    //    changed 'n/a' rating's font-color
    //    changed rating color scale (5 -> 10 colors)
    //    changed imdb update logic
    //    fixed large div selectors according to watcha dom change... twice
    // ver 0.0.47 @ 2021-6-30
    //    fixed large div selectors according to watcha dom change... again
    // ver 0.0.48 @ 2021-7-4
    //    fixed imdb code according to imdb dom change
    // ver 0.0.53 @ 2021-7-7
    //    fixed large div update code
    //    fixed manual update code... twice
    //    fixed large div update flow
    //    fixed /contents large div update code
    // ver 0.0.57 @ 2021-7-20
    //    added /people path
    //    fixed /contents large div update code... twice
    //    changed imdb searching code and imdb access code
    // ver 0.1.0 @ 2021-7-26
    //    added m.kinolights.com site support (only /title pages)
    // ver 0.1.4 @ 2021-7-26
    //    kinolights handler logic fix
    //    improved imdb searching
    //    fixed imdb cache use... twice
    // ver 0.1.7 @ 2021-8-31
    //    also runs when imdb rating is 0 in kinolights
    //    now 'edit' works in kinolights
    //    fixed a bug that didn't remove a flag when large/manual update in watcha
    // ver 0.1.8 @ 2021-9-9
    //    fixed imdb code (cache setting)
    // ver 0.1.9 @ 2021-9-27
    //    fixed selectors according to watchapedia dom change
    // ver 0.1.13 @ 2021-9-28
    //    fixed a bug that does not unset imdb flag when imdb manual updating
    //    fixed selectors according to watchapedia dom change again
    //    fixed a crash when 'image title' large div updating
    //    fixed a bug that searches wp unnecessarily when large div updating
    // ver 0.1.14 @ 2021-9-29
    //    now force update on kino even if rating is already present
    // ver 0.2.0 @ 2022-1-4
    //    now abort immediately previous fetching when url changed
    // ver 0.2.2 @ 2022-1-4
    //    removed unnecessary lines after v0.2.0
    //    changed the first message (splash)
    // ver 0.2.3 @ 2022-1-26
    //    fixed infinite running on kinolights (bug caused by v0.2.2)
    // ver 0.2.4 @ 2022-1-28
    //    trivial refactoring
    // ver 0.2.5 @ 2022-1-30
    //    temporary fix for watch dom changes (list screen only for now)
    // ver 0.2.6 @ 2022-2-1
    //    fixed a bug that does not use fallback imdb rating on kinolights
    // ver 0.2.7 @ 2022-2-1
    //    temporary fix for watch dom changes #2 (still large div is worngly only once or twice updated)
    // ver 0.2.9 @ 2022-2-2
    //    now internally caches queries when imdb searching too
    //    temporary fix for watch dom changes #3 (large div handling fixed and related code refactored)
    // ver 0.2.10 @ 2022-3-7
    //    temporary fix for watch dom changes #4 (now works on main page partly and doesn't break)
    // ver 0.2.11 @ 2022-3-12
    //    fixed a crash when fetched-date is invalid in cache
    // ver 0.2.15 @ 2022-3-13
    //    fixed info box position (no longer <a> under <a>)
    //    fixed for watch dom changes #5 (large div handling on single page)
    //    removed old commented lines (wp html parsing)
    //    now imdb year is prefered to wp year
    // ver 0.3.0 @ 2022-3-13
    //    seperated setting file (still many selectors are hard-coded)
    //    fixed bugs related with large div
    //    now when updating large div, selected list-item info-box blinks for 2s
    //    some refactoring and removed some commented lines
    // ver 0.3.4 @ 2022-3-14
    //    fixed 'edit' not working bug
    //    modified selectors (for watcha home screen, etc)
    //    now fix wrong title or year after manually updating imdb url
    //    refactored more
    // ver 0.3.7 @ 2022-3-20
    //    fixed imdb selector according to dom change
    //    changed imdb api (previous api was removed on rapidapi suddenly...)
    //    fixed org-titles searching and updated readme
    // ver 0.3.9 @ 2022-3-20
    //    fixed org-titles searching again
    //    fixed a bug on imdbRun()
    //    NOTE: new api is faster but search accuracy is rather dissapointing
    // ver 0.3.10 @ 2022-3-24
    //    now scrapes org-titles instead of searching+scraping (watcha)
    // ver 0.3.11 @ 2022-3-24
    //    fixed single-page logic (watcha)
    //    ~~TODO: replace API~~
    // ver 0.3.15 @ 2022-3-29
    //    fixed new api usage to search and scrape in the same time by requesting the author
    //    fixed wp search loginc to leverage cache
    //    fixed single page crash (temporary)
    //    modified css for readability
    //    TODO: capitalization problem ('Ben is Beck' should be adjusted to 'Ben Is Beck')
    // ver 0.3.19 @ 2022-3-31
    //    fixed css on kino
    //    fixed a crash during continual searching
    //    fixed a minor bug on imdbRun() when rating is not present
    //    preparing and TODO: add a fix dict