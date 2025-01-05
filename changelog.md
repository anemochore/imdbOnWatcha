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
    // ver 0.4.85 @ 2023-5-31
    //    netflix: fixed a small event-related syntax error
    //    wp: improved debug message when no result found (mainly for netflix)
    //    settings.js: changed variable name (determinePathnameByWhenUpdating)
    //    wavve: fixed settings etc (maybe DOM change)
    //    wavve: supports /my page again
    //    now use github pages in tm settings
    //    watcha: fixed large-div scraping
    //    wp: improved some logic (in vain) for non-english titles searching
    //    TODO: make sure edit() work!!!
    // ver 0.4.89 @ 2023-6-4
    //    disney+: improved title searching
    //    settings: now numberToBaseEl is generated automatically if omitted.
    //    watcha: fixed a bug of id searching of v0.4.85
    //    disney+: fixed edit() behaviors (along with settings)
    // ver 0.4.92 @ 2023-6-7
    //    netflix: fix edit() bug of v0.4.85
    //    wp: changed searching behaviors for a netflix title
    //    wavve: fixed edit() not working bug of v0.4.85
    //    wavve: fixed single-page updating work when navigating
    //    wavve: improved single-page searching to use year too
    //    wp: improved searching to choose the title with the closest date when there're many same titles
    // ver 0.4.96 @ 2023-6-23
    //    internal: removed temp log
    // ver 0.5.0 @ 2023-6-23
    //    internal: split files
    // ver 0.6.4 @ 2023-6-24
    //    now use justwatch instead of watcha pedia
    //    netflix: refactored large-div(single-page) logic
    // ver 0.6.7 @ 2023-6-25
    //    netflix: refactored large-div(single-page) logic again
    //    jw: improved searching logic
    //    wavve: fixed not displaying all fy-item divs
    // ver 0.6.10 @ 2023-6-30
    //    improved searching logic (trigger)
    //    wavve: suuport upper parts of /my page
    //    disney+: fix not working bug...
    //    TODO: add netflix and disneyplus main page
    //    KNOWN PROBLEM: wavve: clicking fy-item triggers click on underlying div
    // ver 0.6.11 @ 2023-7-25
    //    jw, imdb: fixed not working when no rating present
    // ver 0.6.12 @ 2023-7-29
    //    wavve: supports /supermultisection
    // ver 0.6.18 @ 2023-8-7
    //    kino: if searching failed and imdb rating already present on page, use the present rating
    //    cache: changed some key names for...
    //    watcha: improved search (additional searching) when org. title is available
    //    internal: clean-up
    //    internal: fixed stupid typo
    //    watcha: fixed a bug of v0.6.13
    // ver 0.6.24 @ 2023-8-24
    //    watcha: support /search page again (search and edit)
    //    watcha: improved list-searching on /search (I hope)
    //    imdb: fix a stopping bug of v0.6.16
    //    fixes.js: replace with fixesJW.js for some minor improvement on minor weird case -_-
    //    jw: modified minor logic
    //    internal: clean-up again
    // ver 0.6.25 @ 2023-9-2
    //    jw: modified minor logic
    // ver 0.6.27 @ 2023-10-3
    //    jw: modified minor logic
    //    kino: fixed selectors, with internal clean-up
    // ver 0.6.28 @ 2023-10-6
    //    internal: changed minor log text
    //    ~~TODO: add disneyplus large-div!!! (delayed)~~
    // ver 0.6.31 @ 2023-10-8
    //    kino: fixed dom throw
    //    kino: fixed edit not working
    //    jw, imdb: modified minor logic (support for mini series)
    // ver 0.6.32 @ 2023-10-9
    //    jw: fixed minor logic (regarding tv series)
    // ver 0.7.0 @ 2023-10-13
    //    jw: fixed throw of wrong type determination
    //    jw: changed api to graphQL (due to their recent breaking change)
    // ver 0.7.1 @ 2023-10-14
    //    jw: fixed minor logic (tv series logic, re-searching logic)
    //    internal: small clean-up (of v0.7.0)
    // ver 0.7.3 @ 2023-10-18
    //    jw: fixed logic of not prefering manual visit of imdb (of v0.6.31)
    //    jw: dirty fix for the case of 'Higurashi no naku koro ni'
    // ver 0.7.5 @ 2023-10-29
    //    jw: fixed logic when result is none
    //    app & setting: preparing to refactor not to use numberToBaseEl, targetEl, determinePathnameBy, etc.
    // ver 0.7.6 @ 2023-10-30
    //    kino: fixed not working (of v0.7.5)
    // ver 0.7.8 @ 2023-10-31
    //    jw: improved minor logic (for edge case)
    //    jw: fixed logic when result is none
    // ver 0.7.9 @ 2023-11-2
    //    jw, imdb: improved minor logic (for edge case of which imdbId and rating is null)
    // ver 0.7.10 @ 2023-11-28
    //    settings: fixed watcha selectors and changed urls
    // ver 0.7.11 @ 2023-12-1
    //    settings: changed kino selector according to dom change
    // ver 0.7.12 @ 2023-12-6
    //    settings: fixed watcha main url (bug of v0.7.10)
    // ver 0.7.16 @ 2023-12-8
    //    settings: improved watcha selectors
    //    watcha: support both large-div and list items
    //    settings, css: improved and refactored (mostly for watcha)
    //    wavve: support both large-div and list items
    // ver 0.7.17 @ 2024-3-26
    //    disneyplus: fixed changed urls
    // ver 0.7.21 @ 2024-5-21
    //    disneyplus: fixed changed urls
    //    disneyplus: supports large-div partially
    //    disneyplus: fixed not working on main page
    //    disneyplus: tried to support carousel in vain...
    // ver 0.7.23 @ 2024-6-2
    //    kino: fixed not working bug and title parsing (bug of v0.7.20)
    //    app & jw: fixed and improved search logic
    // ver 0.8.0 @ 2024-6-2
    //    tving: support now
    // ver 0.8.3 @ 2024-9-1
    //    wavve: fixed edit on large-div
    //    jw: fixed logic of manually entered imdb url
    //    watcha: fixed selectors (not perfect)
    // ver 0.8.4 @ 2024-11-13
    //    netflix: supports titles below on large-div
    // ver 0.8.5 @ 2024-12-25
    //    kino: fix orgTitle and year selectors
    // ver 0.9.0 @ 2024-12-25
    //    jw: fix minor logic
    //    uflix: support some pages(/main, /mine, /search)
    // ver 0.9.1 @ 2024-12-27
    //    uflix: fix div update logic
    // ver 0.9.2 @ 2024-12-28
    //    disneyplus: add ignoreItemIfMatches setting
    // ver 0.9.5 @ 2024-12-28
    //    disneyplus: fix setting and logic according to url changes
    //    internal: improving (refactoring) larde-div logic. applied to dp only as of now
    //    kino: fix type detection
    // ver 0.10.0 @ 2024-12-28
    //    coupang play: support now (partially)
    // ver 0.10.2 @ 2025-01-05
    //    uflix: fix getting year from title, etc