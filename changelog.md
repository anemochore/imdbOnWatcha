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
    //    changed imdb api (previous api was removed on rapidapi suddenly...) to https://rapidapi.com/SAdrian/api/data-imdb1/
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
    //    ~~TODO: capitalization problem ('Ben is Beck' should be adjusted to 'Ben Is Beck')~~
    // ver 0.3.20 @ 2022-3-31
    //    fixed css on kino
    //    fixed a crash during continual searching
    //    fixed a minor bug on imdbRun() when rating is not present
    //    ~~preparing and TODO: add a fix dict~~
    //    fixed single-page update problem temporarily
    // ver 0.3.24 @ 2022-3-31
    //    fixed single-page crash
    //    changed api usage on single-page to make code more elegant...
    //    fixed onEdit() crash
    //    fixed imdbRun() logic not to update falsely
    // ver 0.3.31 @ 2022-4-3
    //    fixed capitalization problem (added fixes.js)
    //    added aka-search feature of the api
    //    watcha: changed large-div update behavior, removed related commented old lines
    //    removed unused old roman to arabic lines
    //    lowered z-index of alert box
    //    watcha: removed wp edit link because it's meaningless
    //    fixed a bug relating excluding pages
    // ver 0.3.34 @ 2022-4-3
    //    watcha: changed single-page update behavior
    //    small fix for css
    //    small fixes for internal caching
    //    overhauled settings.js and relevant main logic
    // ver 0.4.3 @ 2022-4-3
    //    added netflix support (list-item only for now) and refactored accordingly
    //    now searching prefers movie, video, tv series (over podcast, etc)
    //    watcha: fixed single-page update logic
    //    fixed rating formatting on imdbRun()
    // ver 0.4.5 @ 2022-4-5
    //    fixed/improved various searching/caching logic/problems since replacing new API
    //    improved searching on WP
    // ver 0.4.8 @ 2022-4-10
    //    internal: console.log() style fixed and util funds (get from id from url and vice versa) added
    //    added imdbVisitedDate on cache when visiting imdb and now prefers imdb real result (less than 7 days) over api result
    //    added another new cache property 'type' for better searching/scraping
    // ver 0.4.13 @ 2022-4-11
    //    internal: refactored getText...(), etc
    //    refactored settings.js
    //    improved searching accuracy if item is tv series
    //    fixed year type and added some fixing lines
    //    netflix: added large-div support
    //    imdb: replaced scraping code
    // ver 0.4.16 @ 2022-4-15
    //    fixed wrongly updating large-div
    //    api: changed releaseDate to releaseYear (my requesting accepted by the author)
    //    created korean readme