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
    // ver 0.4.26 @ 2022-4-18
    //    netflix: fixed (possibly) crash on updating large-div of new movie
    //    fixed year type when scraping wp
    //    netflix: fixed/improved searching
    //    netflix: improved/modified large-div searching using its year, type
    //    watcha: modified scraping logic (season 1 is scraped now)
    //    watcha: fixed selector on /watch/ pages
    //    fixed/modified internal caching logic
    //    fixed aka-search async parts
    //    netflix: fixed edit code
    //    internal: changed api host due to its notice
    // ver 0.4.32 @ 2022-4-20
    //    applied aka-search when scraping ratings too
    //    changed aka-search logic (year included now)
    //    wp: get original non-english title if it's latin
    //    fixed logic of scraping season-1
    //    fixed logic of scraping season-1 on edit()
    //    fixed fixed.js in vain
    //    TODO: use platform info (where the title is served) on wp
    // ver 0.4.36 @ 2022-4-23
    //    fixed a bug of not getting type when large-div updating
    //    watcha: fixed a bug of large-div not updating after navigations
    //    settings.js: fixed/improved selectors
    //    fixed.js: added 'ULTRAMAN' case
    // ver 0.4.40 @ 2022-4-25
    //    wp: fixed a bug of not getting types
    //    applied aka-search when scraping ratings is 'n/a'
    //    fixed aka-search tiitle-fix logic
    //    fixed.js: added capitalization rules
    // ver 0.4.54 @ 2022-5-1
    //    watcha: fixed a bug of getting not clean id
    //    watcha: fixed a crash (bug of wp parsing after v0.4.40)
    //    watcha: fixed selectors not to select people or genre
    //    watcha: now don't show info at all on 이어보기
    //    watcha: fixed a weird bug of not showing info when entering single-page from list-screen
    //    netflix: fixed url changes behavior (bug of v0.4.40)
    //    netflix: fixed a bug of getting wrong formatted title
    //    netflix: improved searching by using more correct type
    //    fixed a crash when aka-searching (bug of v0.4.40)
    //    fixed a bug of not storing imdb url, etc (bug of v0.4.40)
    //    improved searching: 'tv mini series' type added
    //    now searches year-1 to year+1 range when aka-searching
    //    fixed.js: added 'SPY×FAMILY', 'KILL LIST' cases
    //    internal: now awaits gm_cache (idk this is really needed)
    //    TODO: solve '퍼시픽 림: 어둠의 시간'
    // ver 0.4.55 @ 2022-5-5
    //    internal: awaits setting gm_cache (missed from v0.4.54)
    // ver 0.4.59 @ 2022-5-28
    //    fixed wrong css
    //    internal: added setting regarding 'isTVSeries' and refactored relevant funcs
    //    kino: fixed a bug not updating (maybe their code has changed)
    //    wavve: now supports wavve (partially)
    // ver 0.4.60 @ 2022-7-10
    //    watcha: changed wishlist pathname due to its change
    //    TODO: add support for watcha main page
    // ver 0.4.61 @ 2022-7-27
    //    temporary disabled waave support except for single-page
    //    TODO: add support for more waave
    // ver 0.4.64 @ 2022-10-7
    //    kino (with setting): fix a bug not getting org-title (maybe their dom has changed)
    //    wp: if no match, search org-title again (if available, like kino). limitation: in this case, compare the date only due to not chainging locale
    //    wp: fix a bug not getting page url (use getAttribute("href") instead of .href) (maybe their code has changed)
    // ver 0.4.65 @ 2023-2-1
    //    fixed wrongly setting ?? when searching/scraping (bug of v0.4.54)
    //    settings.js: edited selectors according to watcha dom change
    // ver 0.4.68 @ 2023-5-6
    //    fixed readme
    //    settings.js: edited watcha main selectors
    //    fixed imdb code (not recognizing matching org-title)
    //    settings.js: edited watcha large-div selectors
    // ver 0.4.71 @ 2023-5-11
    //    wp: fixed generating wrong url
    //    wp: improved scraping logic (locale header seems not working anymore)
    //    improved imdb searching logic (tv series vs tv mini series problem)
    // ver 0.4.72 @ 2023-5-15
    //    fixed wrong db key ('orgtitles')
    // ver 0.4.73 @ 2023-5-20
    //    fixed a imdb parsing bug of v0.4.72
    // ver 0.4.77 @ 2023-5-23
    //    settings.js: edited selectors according to kinolights dom change
    //    updated readme
    //    disney+ support (only list items for now)
    //    fixed aka search logic