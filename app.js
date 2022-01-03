// ==UserScript==
// @name         imdb on watcha
// @namespace    http://tampermonkey.net/
// @version      0.2.0
// @updateURL    https://raw.githubusercontent.com/anemochore/imdbOnWatcha/master/app.js
// @downloadURL  https://raw.githubusercontent.com/anemochore/imdbOnWatcha/master/app.js
// @description  try to take over the world!
// @author       fallensky@naver.com
// @include      https://watcha.com/*
// @include      https://www.imdb.com/title/*
// @include      https://m.kinolights.com/*
//// @include      https://www.netflix.com/*
// @resource     CSS https://raw.githubusercontent.com/anemochore/imdbOnWatcha/master/fy_css.css
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @connect      pedia.watcha.com
// @connect      imdb-internet-movie-database-unofficial.p.rapidapi.com
// ==/UserScript==

/*
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
*/

class FyGlobal {

  constructor() {
    //setting per sites
    const includingPathses = {
      'watcha.com': ['/home', '/explore', '/watched', '/wishes', '/watchings', '/search', '/ratings', '/arrivals', '/staffmades', '/contents', '/people'],  //dev todo:  /  '/tutorial'],
      'm.kinolights.com': ['/title'],
    };
    const excludingPathses = {
      'watcha.com': [],
      'm.kinolights.com': [],
    };
    //todo+++
    const excludingSectionTexts = {
      'watcha.com': ['새로운 에피소드', '혼자 보기 아쉬울 때, 같이 봐요 우리!'],
    };
    const rootSelectors = {
      'watcha.com': 'main',
      'm.kinolights.com': 'html',
    };
    const selectors = {
      'watcha.com': 'li div[class*="-Row"] ul>li',
    };
    const selectorsForException = {
      'watcha.com': 'h1',
    };
    const titleSelectors = {
      'watcha.com': 'h1, div[class*="-StyledText"]',
      'm.kinolights.com': 'h3.title-kr',
    };
    const largeDivSelectors = {
      'watcha.com': 'div.enter-done',
      'm.kinolights.com': 'div.movie-title-wrap',
    };
    const largeDivSelectorsOnExit = {
      'watcha.com': 'div.exit-active',
    };
    const subSelectors = {
      'watcha.com': 'div',
      'm.kinolights.com': null,  //no insert
    };
    const extraSelectors = {
      'm.kinolights.com': 'span.imdb-wrap>div.score',
    };
    const handlers = {
      'watcha.com': this.handlerForWatcha,
      'm.kinolights.com': this.handlerForKino,
    };
    const largeDivUpdates = {
      'watcha.com': this.largeDivUpdateForWatcha,
      'm.kinolights.com': this.largeDivUpdateForKino,
    };

    //global vars & flags
    this.prevLocationOriginPathname = document.location.origin+document.location.pathname;
    this.isFetching = false;
    this.XHR = null;

    //first setup
    const site = document.location.host;

    this.includingPaths = includingPathses[site];
    this.excludingPaths = excludingPathses[site];
    this.rootSelector = rootSelectors[site];
    this.selector = selectors[site];
    this.selectorForException = selectorsForException[site];
    this.titleSelector = titleSelectors[site];
    this.largeDivSelector = largeDivSelectors[site];
    this.largeDivSelectorOnExit = largeDivSelectorsOnExit[site];
    this.subSelector = subSelectors[site];
    this.extraSelector = extraSelectors[site];
    this.handler = handlers[site];
    this.largeDivUpdate = largeDivUpdates[site];
  }

  run() {
    unsafeWindow.GM_getValue = GM_getValue;  //for this.edit()

    //캐시 없으면 생성
    if(!GM_getValue('OT_CACHE_WITH_IMDB_RATINGS'))
      GM_setValue('OT_CACHE_WITH_IMDB_RATINGS', {});


    //imdb 접속 시 캐시 업데이트
    if(document.location.host == 'www.imdb.com') {
      const otCache = GM_getValue('OT_CACHE_WITH_IMDB_RATINGS');

      let path = document.location.pathname;
      if(!path.startsWith('/title/') || path.endsWith('/episodes')) {
        toast.log();
        return;
      }

      const imdbId = path.split('/')[2];
      let imdbRating = document.querySelector('span[class^="AggregateRatingButton_"]');
      if(imdbRating)
        imdbRating = imdbRating.textContent;
      else
        imdbRating = 'n/a!';

      let orgTitle = document.title.replace(/ - IMDb$/, '');
      orgTitle = orgTitle.replace(/ \(TV Episode( (\d{4})\)|\))$/, '');

      //ex: \"The Kill Count\" Saw 3D (2010) (TV Episode 2018)
      //ex: \"Review It\" Spider-Man 2 (2004) (TV Episode)
      let trueYear;
      [orgTitle, trueYear] = orgTitle.split(' (');

      //ex1: \"We Eat Films\" Saw 3D (TV Episode 2010)
      //ex2: Majutsushi Orphen Mubouhen (TV Series 1998–1999)
      //ex3: Sorcerous Stabber Orphen (TV Series 2020– )
      if(!trueYear || isNaN(parseInt(trueYear.slice(0, 4))))
        trueYear = document.title.replace(/ - IMDb$/, '').match(/(\d{4})(– |)\)$/)[1];
      else
        trueYear = trueYear.slice(0, 4);

      const keys = Object.keys(otCache);
      const values = Object.values(otCache);
      const ids = values.map(el => el.imdbId);
      const orgTitles = values.map(el => el.orgTitle);
      const years = values.map(el => el.year);
      const flags = values.map(el => el.imdbFlag);

      let idx = -1;
      if(imdbId && ids.includes(imdbId)) {
        idx = ids.indexOf(imdbId);
      }
      else {
        idx = orgTitles.indexOf(orgTitle);

        if(idx > -1) {
          orgTitles.slice(idx).some((sTitle, i) => {
            if(sTitle == orgTitle && years[i].year == trueYear) {
              //exact match
              idx = i;
              return true;  //break (take the first match)
            }
          });
        }
        else {
          orgTitles.some((sTitle, i) => {
            if(sTitle && sTitle.replace(/ - /g, '').replace(/ /g, '').toLowerCase() == orgTitle.replace(/ - /g, '').replace(/ /g, '').toLowerCase() && years[i].year == trueYear) {
              //exact match (ignoring - & spaces and cases)
              idx = i;
              return true;  //break (take the first match)
            }
          });
        }
      }

      if(idx > -1) {
        const cache = otCache[keys[idx]];

        if(flags[idx] != '') {
          if(imdbRating == 'n/a' && !isNaN(parseFloat(cache.imdbRating))) {
            toast.log('warning: imdb rating is n/a. so deleting the cache which is probably wrong!');

            cache.imdbId = 'n/a';  //다시 업데이트하지 못하게 막음
            cache.imdbRating = 'n/a';
            cache.imdbUrl = 'https://www.imdb.com/find?s=tt&q=' + encodeURIComponent(orgTitles[idx]);
          }
          else if(Math.abs(cache.year - trueYear) > 1) {
            toast.log('warning: year on imdb is ' + (trueYear || 'n/a') + ', which quite differs from ' + cache.year + '. so deleting the cache which is probably wrong!');

            cache.imdbId = 'n/a';  //다시 업데이트하지 못하게 막음
            cache.imdbRating = 'n/a';
            cache.imdbUrl = 'https://www.imdb.com/find?s=tt&q=' + encodeURIComponent(orgTitles[idx]);
          }
          else {
            if(cache.imdbUrl.startsWith('https://www.imdb.com/find?')) {
              toast.log('updated the whole cache (id was not set) for '+orgTitle+' ('+trueYear+').');

              cache.imdbId = imdbId;
              if(path.endsWith('/'))
                path = path.slice(0, -1);
              cache.imdbUrl = 'https://www.imdb.com' + path;
            }
            else
              toast.log('rating for '+orgTitle+' ('+trueYear+') was successfully updated on the cache.');

            cache.imdbRating = imdbRating;
          }
          cache.imdbFlag = '';

          cache.imdbRatingFetchedDate = new Date();
          GM_setValue('OT_CACHE_WITH_IMDB_RATINGS', otCache);
        }
        else if(imdbRating != cache.imdbRating) {
          if(cache.imdbRating == 'n/a') {
            toast.log('updated the whole cache (flag was not set) for '+orgTitle+' ('+trueYear+').');

            cache.imdbId = imdbId;
            if(path.endsWith('/'))
              path = path.slice(0, -1);
            cache.imdbUrl = 'https://www.imdb.com' + path;
          }
          else {
            toast.log('imdb rating differs from the cache, so updating the cache for '+orgTitle+' ('+trueYear+').');
          }
          cache.imdbRating = imdbRating;

          cache.imdbRatingFetchedDate = new Date();
          GM_setValue('OT_CACHE_WITH_IMDB_RATINGS', otCache);
        }
        else {
          toast.log('imdb flag is not set and imdb rating is the same as cache, so no update.');
        }
      }
      else {
        toast.log('this title is not yet stored on "imdb on watcha" cache.');
      }
      toast.log();
      return;
    }

    //to get the previous url. https://stackoverflow.com/a/52809105
    window.addEventListener('locationchange', e => {
      fy.entry(e);
    });

    history.pushState = (f => function pushState() {
      fy.prevLocationOriginPathname = document.location.origin+document.location.pathname;
      var ret = f.apply(this, arguments);
      window.dispatchEvent(new Event('pushstate'));
      window.dispatchEvent(new Event('locationchange'));
      return ret;
    })(history.pushState);

    history.replaceState = (f => function replaceState() {
      fy.prevLocationOriginPathname = document.location.origin+document.location.pathname;
      var ret = f.apply(this, arguments);
      window.dispatchEvent(new Event('replacestate'));
      window.dispatchEvent(new Event('locationchange'));
      return ret;
    })(history.replaceState);

    window.addEventListener('popstate', () => {
      window.dispatchEvent(new Event('locationchange'))
    });


    //check api keys
    if(!RAPID_API_KEY || RAPID_API_KEY == DEFAULT_MSG) {
      GM_setValue('RAPID_API_KEY', DEFAULT_MSG);
      alert("set RAPID_API_KEY in Tampermonkey's setting first.");
      toast.log();
      return;
    }


    //css 로딩
    const css = GM_getResourceText('CSS');
    GM_addStyle(css);


    //mutation observer
    fy.observer = new MutationObserver(fy.handler);
    fy.observerOption = {childList: true, subtree: true};


    //real entry point
    fy.entry();
  }

  async entry(e = null) {
    //entry point
    fy.root = document.querySelector(fy.rootSelector);
    const curLocation = document.location;

    //ignoring # or ?mappingSource... at the end
    if(fy.prevLocationOriginPathname != curLocation.origin+curLocation.pathname && fy.isFetching) {
      toast.log('url changed. so aborting current fetching...');
      fy.XHR.abort();
      fy.isFetching = false;

      //reset fy-item attributs
      const itemDivs = [...fy.root.querySelectorAll('['+FY_UNIQ_STRING+']')];
      itemDivs.forEach((item, i) => {
        item.removeAttribute(FY_UNIQ_STRING);
      });
    }

    let isExit = false;
    //check if the page is included in excludingPath
    let isExcludingPath = false;
    fy.excludingPaths.some(path => {
      if(curLocation.pathname.startsWith(path)) {
        fy.isExcludingPath = true;
        return true;  //break
      }
    });
    if(fy.isExcludingPath) {
      toast.log('on excluding page');
      isExit = true;
    }

    //check if the page is included in includingPath
    let isIncludingPath = false;
    fy.includingPaths.some(path => {
      if(curLocation.pathname.startsWith(path)) {
        isIncludingPath = true;
        return true;  //break
      }
    });
    if(!isIncludingPath) {
      toast.log('not in including page');
      isExit = true;
    }

    //init
    fy.observer.disconnect();

    toast.log();
    if(!isExit && !fy.isFetching) {
      toast.log('fy script initiating...');
      let selector = fy.selector;
      if(!selector)
        selector = fy.largeDivSelector;
      if(fy.selectorForException)
        selector = fy.selectorForException + ', ' + selector;

      await elementReady(selector, fy.root);
      fy.handler();  //force first run
    }
  }

  async handlerForKino() {
    const largeDiv = document.querySelector(fy.largeDivSelector+':not(['+FY_UNIQ_STRING+'])');

    if(largeDiv)
      fy.largeDivUpdate(largeDiv);
  }

  async handlerForWatcha(m, o) {
    const itemDivs = [...fy.root.querySelectorAll(fy.selector+':not(['+FY_UNIQ_STRING+'])')];
    const itemNum = itemDivs.length;

    let largeDiv = fy.root.querySelector(fy.largeDivSelectorOnExit);
    if(largeDiv) {
      //closing large div
      console.debug('exiting large div...');  //dev
      //toast.log();
      fy.observer.observe(fy.root, fy.observerOption);
    }
    else {
      const largeDivSelectorExtra = 'main>div>div>div>h1:not([hidden]), main>div>div>div>h1+img';
      largeDiv = fy.root.querySelector(fy.largeDivSelector+':not(['+FY_UNIQ_STRING+'])') ||
        fy.root.querySelector(largeDivSelectorExtra);

      if(itemNum == 0 && largeDiv) {
        fy.observer.disconnect();
        fy.largeDivUpdate(largeDiv);
      }
      else if(itemNum > 0) {
        fy.observer.disconnect();
        toast.log('searching on wp or cache for', itemNum, 'items...');

        //change flow
        fy.observer.disconnect();
        fy.search(itemDivs);
      }
      else {
        //nothing to do
        //toast.log();
        fy.observer.observe(fy.root, fy.observerOption);
      }
    }
  }

  async search(itemDivs, trueYear = null, trueUrl = null, trueImdbUrl = null, trueOrgTitle = null, fallbackImdbRating = null) {
    const otCache = GM_getValue('OT_CACHE_WITH_IMDB_RATINGS');

    /*
    if(!itemDivs) {
      //nothing to do
      toast.log();
      return;
    }
    */

    let otData = [];
    let titles = Array(itemDivs.length).fill(null);
    let allTitles = Array(itemDivs.length).fill(null);

    fy.preUpdateDivs(itemDivs);

    itemDivs.forEach((item, i) => {
      let title = item.querySelector(fy.titleSelector).textContent;
      allTitles[i] = title;

      //드라마의 경우, 불필요한 텍스트 치환
      const oldTitle = title;
      const strsToReplace = [
        [/: 에피소드 \d+$/,  ''],
        //[/ 시즌 (\d+)$/,     ' $1'],  //네이버 영화 검색 시
        //[/ (\d+기): (\d+)$/, ' $1기'],  //네이버 영화 검색 시
      ];
      strsToReplace.forEach(str => {
        const t = title.match(str[0]);
        if(t)
          title = title.replace(str[0], str[1]);
      });
      if(oldTitle != title)
        console.debug(oldTitle + ' is adjusted to ' + title);

      //일단 캐시에 있다면 그 정보가 뭐든 div 업데이트에는 사용한다.
      otData[i] = otCache[title] || {};  //referenced-cloning is okay.
      const cache = otData[i];

      //캐시에 원제와 imdb 평점이 있다면 캐시 사용 대상
      if(cache.orgTitle && cache.imdbRating) {
        //단, 캐시가 오래되었거나 원제가 없다면 다시 페칭.
        const UPDATE_INTERVAL_DAYS = 30;  //in days
        if(dateDiffInDays(new Date(), new Date(cache.imdbRatingFetchedDate)) > UPDATE_INTERVAL_DAYS) {
          console.debug(title + ' cache is over than ' + UPDATE_INTERVAL_DAYS + ' days. so updating now...');  //dev (verbose)
          titles[i] = title;
        }
        /*
        else if(trueUrl) {
          //수동 업데이트 시에도 다시 페칭.
          titles[i] = title;
        }
        */
        else {
          console.debug(title + ' cache will be used: ' + cache.orgTitle+' ('+cache.year+')');
        }
      }
      else {
        //캐시에 없다면 당연히 페칭
        titles[i] = title;
      }
      otData[i].query = title;
    });

    //똑같은 검색어가 여러 개라면 내부 캐싱(앞에 똑같은 검색어가 있다면 뒤에 나오는 애는 캐싱)
    const indexCaches = [];
    titles.slice(1).forEach((title, i) => {
      if(title) {
        const prevIdx = titles.slice(0, 1+i).indexOf(title);
        if(prevIdx > -1) {
          indexCaches[1+i] = String(prevIdx);  //to use with filter
          titles[1+i] = null;
          otData[1+i] = {};
        }
      }
    });

    /*
    //augmenting search (removing 'subtitles')
    const augTitlesShort = Array(titles.length).fill(null);
    const REGS_TO_REMOVE = [/: | : |:/, / - /];
    titles.forEach((title, i) => {
      if(title) {
        REGS_TO_REMOVE.some(reg => {
          if(title.match(reg))
            augTitlesShort[i] = title.slice(0, title.match(reg).index);
        });
      }
    });

    //additional augmenting search (replacing roman numbers to arabic numbers)
    //ex: 블레이드 III -> 블레이드 3
    const augTitlesArabic = Array(titles.length).fill(null);
    augTitlesShort.forEach((title, i) => {
      if(title && title.match(SMALL_ROMANS_AT_THE_END)) {
        const match = title.match(SMALL_ROMANS_AT_THE_END)[0];
        if(match != '')
          augTitlesArabic[i] = title.replace(SMALL_ROMANS_AT_THE_END, roman2arabic(match));
      }
    });

    //aug 서치에 맞게 titles 등도 늘린다.
    if(augTitlesShort.filter(el => el).length > 0 || augTitlesArabic.filter(el => el).length > 0) {
      titles = titles.concat(augTitlesShort).concat(augTitlesArabic);
      allTitles = allTitles.concat(allTitles).concat(allTitles);
      otData = otData.concat(otData).concat(otData);
    }
    */

    //start searching
    let timeWaited = 0;
    (async function waitForFetchingDone_() {
      if(!fy.isFetching) {
        if(timeWaited > 0)
          toast.log('previous fetching completed!');

        //large div update
        if(trueYear) {
          otData[0].year = trueYear;
        }

        //large div update or wp manual update
        if(trueUrl) {
          otData[0].otUrl = trueUrl;
          otData[0].otFlag = '';
        }

        //imdb manual update
        if(trueImdbUrl) {
          otData[0].imdbUrl = trueImdbUrl;
          otData[0].imdbFlag = '';
        }

        //kino update
        if(trueOrgTitle) {
          otData[0].orgTitle = trueOrgTitle;
        }

        let searchLength = titles.filter(el => el).length;
        if(searchLength == 0) {
          console.log('nothing to search or scrape on wp.');
          searchImdbAndWrapUp_(itemDivs);  //otData, etc. are passed.
          return;
        }
        else if(!trueUrl) {
          //목록 업데이트
          let PREFIX = 'https://pedia.watcha.com/ko-KR/search?query=';
          //왓챠피디아는 .을 없애야 함...
          const otSearchResults = await fy.fetchAll(titles.map(title => title ? PREFIX + encodeURI(title.replace(/\./g, '')) : null));
          parseWpSearchResults_(otSearchResults);  //otData, etc. are passed.
          searchLength = otSearchResults.filter(el => el).length;
          if(searchLength == 0) {
            console.log('org. titles searching result is empty.');
            searchImdbAndWrapUp_(itemDivs);  //otData, etc. are passed.
            return;
          }
          else {
            console.log('org. titles searching done:', searchLength);  //dev
          }
        }

        //이 부분도 내부 캐싱이 가능하긴 할 텐데 귀찮으니 그냥 두자.
        if(!trueImdbUrl && !trueOrgTitle) {
          toast.log('scraping org. titles...');
          const otScrapeResults = await fy.fetchAll(titles.map((title, i) => title ? otData[i].otUrl : null), {
            headers: {
              'Accept-Language': 'en-KR',
            },
          });
          searchLength = otScrapeResults.filter(el => el).length;

          if(searchLength == 0) {
            console.log('org. titles scraping result is empty.');
            searchImdbAndWrapUp_(itemDivs);  //otData, etc. are passed.
            return;
          }

          console.log('org. titles scraping done:', searchLength);  //dev
          parseWpScrapeResults_(otScrapeResults);  //otData, etc. are passed.
        }

        searchImdbAndWrapUp_(itemDivs);  //otData, etc. are passed.
      }
      else {
        timeWaited += 500;
        toast.log('...waiting for previous fetching done for', timeWaited, 'ms...');
        setTimeout(waitForFetchingDone_, 500);
      }
    })();
    //end of flow


    function parseWpSearchResults_(results) {
      results.forEach((result, i) => {
        const title = titles[i];
        if(!result) {
          if(title) {
            console.warn('search for',title,'on wp failed! no result at all!');
            otData[i].otFlag = '??';
          }
          return;  //continue
        }

        //to update cache
        otData[i].query = title;

        const targetDoc = new DOMParser().parseFromString(result, 'text/html');

        //to make selecting easier
        [...targetDoc.querySelectorAll('style[data-emotion-css]')].forEach(el => {
          el.remove();
        });

        let sDivs = targetDoc.querySelector('div[class*="StyledTabContentContainer"] section>section:first-child ul');
        if(!sDivs) {
          console.warn(title, 'seems not found on wp!');
          console.debug(targetDoc.documentElement.outerHTML);
          otData[i].otFlag = '??';
          return;  //continue
        }

        sDivs = [...sDivs.querySelectorAll('li>a>div:last-child')];
        const sTitles = sDivs.map(el => el.children[0].textContent);
        const sYears  = sDivs.map(el => el.children[1].textContent.split(' ・ ')[0]);
        //카테고리(영화, TV 프로그램 등)는 레이지 로딩이라 스크레이핑 불가

        let idx = -1, firstNotNullIdx = -1, exactMatchCount = 0;
        sTitles.forEach((sTitle, j) => {
          if(sTitle) {
            if(sTitle == title
              && (!trueYear || (trueYear && trueYear == sYears[j]))) {
              //exact match
              //trueYear가 있다면 아이템의 연도와도 일치해야 함.
              if(idx == -1) {
                idx = j;
                otData[i].otFlag = '';
              }
              exactMatchCount++;
            }
            else if(sTitle.replace(/ - /g, '').replace(/ /g, '') == title.replace(/ - /g, '').replace(/ /g, '')
              && (!trueYear || (trueYear && trueYear == sYears[j]))
              ) {
              //exact match (ignoring - & spaces)
              //trueYear가 있다면 아이템과 일치해야 하고 exactMatchCount도 증가함.
              if(idx == -1) {
                idx = j;
                otData[i].otFlag = '';
              }
              if(trueYear) {
                exactMatchCount++;
              }
            }
          }
        });
        if(exactMatchCount > 1) {
          console.warn(exactMatchCount + ' multiple exact matches for ' + title + (trueYear ? ' ('+trueYear+')' : '') + ' found on wp. so taking the first result.');
          otData[i].otFlag = '?';
        }
        else if(idx == -1) {
          idx = 0;
          console.warn(title + ' seems not found on wp. so just taking the first result: ' + sTitles[idx]);
          otData[i].otFlag = '??';
        }

        const code = sDivs[idx].parentNode.href.split('/').pop();
        otData[i].otUrl = 'https://pedia.watcha.com/en-KR/contents/' + code;
      });
    }

    function parseWpScrapeResults_(results) {
      results.forEach((result, i) => {
        if(!result)
          return;  //continue

        const targetDoc = new DOMParser().parseFromString(result, 'text/html');

        /*
        const startIdx = result.indexOf('개요<!--');
        const endIdx = result.slice(startIdx).indexOf('년</span>');
        const tempYear2 = result.slice(startIdx, startIdx+endIdx).slice(-4);
        */

        /*
        const fy.rootObj = JSON.parse(targetDoc.querySelector('div#fy.root').getAttribute('data-initial-state'));
        if(!fy.rootObj) {
          console.warn('scraping failed on', otData[i].otUrl);
          console.debug(targetDoc.documentElement.outerHTML);
          otData[i].otFlag = '??';

          return;  //continue
        }

        const code = otData[i].otUrl.split('/').pop();
        const cm = fy.rootObj.contentManager.byCode[code].byUrlKey['/api/contents/:code'];
        const orgTitle = cm.engTitle;
        const tempYear = cm.year;
        */
        let [orgTitle, tempYear] = targetDoc.title
        .replace(/ - Watcha Pedia$/, '').replace(/\)$/, '').split(' (');

        //console.debug(document.title, orgTitle, tempYear);  //dev
        if(orgTitle == '' || !tempYear) {
          console.warn('scraping failed on', otData[i].otUrl);
          console.debug(targetDoc.documentElement.outerHTML);
          otData[i].otFlag = '??';

          return;  //continue
        }

        //year chack when large div updating
        if(trueYear) {
          const yearDiff = Math.abs(tempYear - trueYear);
          if(yearDiff == 1) {
            console.debug('very mild warning: year on wp is ' + tempYear + ', which differs 1 year from ' + trueYear + ' for ' + orgTitle + '. discarding it.');
            tempYear = trueYear;
          }
          else if(yearDiff > 1) {
            console.warn('year on wp is ' + tempYear + ', which quite differs from ' + trueYear + ' for ' + orgTitle + ". discarding it, but there's chance that wp data is totally wrong.");
            otData[i].otFlag = '?';
            tempYear = trueYear;
          }
        }

        otData[i].orgTitle = orgTitle;
        otData[i].year = tempYear;
      });
    }


    async function searchImdbAndWrapUp_(itemDivs) {
      const HEADERS = {
        'x-rapidapi-key': RAPID_API_KEY,
        'x-rapidapi-host': RAPID_API_HOST,
      };
      const FETCH_INTERVAL = 0;  //dev. seems ok.

      //id나 평점이 없으면 imdb 찾음.
      //혹은 trueYear/trueUrl/trueImdbUrl이 있어도 이 배열에 넣고 실제로 찾지는 않음.
      const otDataFiltered = otData.map(el => (!el.imdbId || !el.imdbRating || trueYear || trueUrl || trueImdbUrl) ? el : {});  
      const orgTitles = otDataFiltered.map(el => el.orgTitle);
      const years = otDataFiltered.map(el => el.year);

      let imdbData = [], newImdbData = [];
      let imdbResults = [], searchLength;

      //왓챠용 검색 전 제목 정리
      //드라마의 경우, 불필요한 텍스트 치환
      orgTitles.forEach((title, i) => {
        if(title) {
          const oldTitle = title;
          const strsToReplace = [
            [/ Season (\d+)$/,     ''],
          ];
          strsToReplace.forEach(str => {
            const t = title.match(str[0]);
            if(t)
              orgTitles[i] = title.replace(str[0], str[1]);
          });
          if(oldTitle != title)
            console.debug(oldTitle + ' is adjusted to ' + title + ' internally');
        }
      });

      let imdbPrefix = 'https://imdb-internet-movie-database-unofficial.p.rapidapi.com/search/';
      const tempYearString = trueYear ? '%20('+trueYear+')' : '';

      //물론, 원제가 있는 애들만 찾는다. 없으면 못 찾지. 예외는 수동 업데이트 시.
      //이상해 보이지만 uri 인코딩 전에 .과 /는 먼저 바꿔줘서 한 번 더 uri 인코딩을 하게 해야 한다.
      //다른 문자가 더 있을지도... [ ]도 삭제해야 한다(ex: [REC] 4: Apocalipsis).
      let filtered = orgTitles.map((title, i) => title ? 
        imdbPrefix + encodeURIComponent(orgTitles[i].replace(/\./g, '%2E').replace(/\//g, '%2F').replace(/(\[|\])/g, '')) + tempYearString :
        null
      );
      searchLength = filtered.filter(el => el).length;

      if(searchLength == 0) {
        console.log('nothing to search on imdb.');
      }
      else if(!trueImdbUrl) {
        toast.log('now searching on imdb for',searchLength,'items...');

        imdbResults = await fy.fetchAll(filtered, HEADERS, FETCH_INTERVAL);
        searchLength = imdbResults.filter(el => el).length;
      }

      if(searchLength == 0) {
        console.log('imdb searching result is empty.');
      }
      else {
        imdbPrefix = 'https://imdb-internet-movie-database-unofficial.p.rapidapi.com/film/';
        if(!trueImdbUrl) {
          console.log('imdb searching done:', searchLength);
          imdbData = parseImdbResults_('search');  //imdbResults, etc are passed.

          //get ratings. id가 있는 애들만 찾는다.
          filtered = imdbData.map(el => (el.imdbId && el.imdbId != 'n/a') ? imdbPrefix + el.imdbId : null);
          searchLength = filtered.filter(el => el).length;
        }
        else {
          const tempImdbId = trueImdbUrl.replace('https://www.imdb.com/title/', '').replace('/', '');
          filtered = [imdbPrefix + tempImdbId];
          otData[0].imdbId = tempImdbId;
          imdbData = [otData[0]];
        }

        if(searchLength == 0) {
          console.log('nothing to get ratings on imdb.');
        }
        else {
          toast.log('getting imdb ratings for',searchLength,'items...');

          imdbResults = await fy.fetchAll(filtered, HEADERS, FETCH_INTERVAL);
          searchLength = imdbResults.filter(el => el).length;
          if(searchLength == 0) {
            console.log('imdb scraping result is empty.');
          }
          else {
            console.log('getting imdb ratings done:', searchLength);
            newImdbData = parseImdbResults_('rating');  //imdbResults, imdbData, etc are passed.
          }
        }

        imdbData.forEach((oldEl, i) => {
          const el = newImdbData[i];
          if(el && el.imdbRating) {
            otData[i].imdbFlag = el.imdbFlag || '';
            otData[i].imdbId = el.imdbId;
            otData[i].imdbUrl = el.imdbUrl;
            otData[i].year = el.year;
            otData[i].imdbRating = el.imdbRating;
            otData[i].imdbRatingFetchedDate = el.imdbRatingFetchedDate;
            otData[i].query = allTitles[i];  //to update cache
          }
          else if(oldEl && oldEl.imdbUrl) {
            otData[i].imdbFlag = oldEl.imdbFlag || '';
            if(oldEl.imdbId)  //for special mis-working case
              otData[i].imdbId = oldEl.imdbId;
            otData[i].imdbUrl = oldEl.imdbUrl;  //검색 실패(또는 api 스크레이핑 실패)로 url만 건진 경우를 위해
            otData[i].query = allTitles[i];  //to update cache
          }
        });
      }

      //내부 캐시 반영
      if(indexCaches.filter(el => el).length > 0) {
        console.debug('internal cache used for ' + indexCaches.filter(el => el).length + ' titles');
        indexCaches.forEach((indexCache, i) => {
          if(indexCache)
            otData[i] = otData[indexCache];  //referenced-cloning is okay.
        });
      }

      //캐싱
      setGMCache('OT_CACHE_WITH_IMDB_RATINGS', otData);

      //change flow: update divs
      fy.updateDivs(itemDivs, otData);


      function parseImdbResults_(type) {
        imdbResults.forEach((r, i) => {
          if(!r)
            return;  //continue

          let imdbDatum = {};
          if(imdbData[i])  //second run
            imdbDatum = imdbData[i];

          let orgTitle = orgTitles[i];  //may be adjusted
          const year = years[i];

          let res;
          try {
            res = JSON.parse(r);
          }
          catch(e) {
            console.warn('parsing error: ', r);
          }

          if(!res || (type == 'search' && !res.titles) || (type == 'rating' && !res.rating)) {
            console.warn('searching or scraping', orgTitle, 'via API failed or no results on imdb!');
            if(res)
              console.debug(res);  //dev

            if(res && res.id) {  //special mis-working case for this API
              if(otData[i].imdbId && otData[i].imdbUrl && otData[i].imdbFlag == '') {
                console.debug('cache flag is okay. so discard search result and use the cache flag.');
                imdbDatum.imdbFlag = '';
              }
              else {
                imdbDatum.imdbId = res.id;
                imdbDatum.imdbUrl = 'https://www.imdb.com/title/' + res.id;  //이 api의 특이 케이스;
                if(imdbDatum.imdbFlag == '') {  //if search was successful
                  if(fallbackImdbRating) {
                    console.debug('scraping was unsuccessful. so just use kino data.');
                    imdbDatum.imdbRating = fallbackImdbRating;
                    imdbDatum.imdbRatingFetchedDate = new Date();
                  }
                  else
                    imdbDatum.imdbFlag = '?';
                }
                else
                  imdbDatum.imdbFlag = '??';
              }
            }
            else {
              imdbDatum.imdbUrl = 'https://www.imdb.com/find?s=tt&q=' + encodeURIComponent(orgTitle+' '+year);
              imdbDatum.imdbFlag = '??';
            }
          }
          else if(type == 'search') {
            const titles = res.titles.map(el => el.title);
            const ids = res.titles.map(el => el.id);

            //검색 결과에 대한 제목 정리
            //ex: Spider-Man II -> Spider-Man 2
            if(!titles.includes(orgTitle) && orgTitle.match(SMALL_ROMANS_AT_THE_END)) {
              const match = orgTitle.match(SMALL_ROMANS_AT_THE_END)[0];
              const possibleTitle = orgTitle.replace(SMALL_ROMANS_AT_THE_END, roman2arabic(match));
              if(titles.includes(possibleTitle)) {
                console.debug(orgTitle + ' is adjusted to ' + possibleTitle);
                orgTitle = possibleTitle;
                imdbDatum.orgTitle = orgTitle;
              }
            }

            let idx = -1, exactMatchCount = 0;
            titles.forEach((sTitle, j) => {
              if(sTitle == orgTitle) {
                //exact match
                if(idx == -1) {
                  idx = j;
                  imdbDatum.imdbFlag = '';
                }
                exactMatchCount++;
              }
              else if(sTitle.replace(/ /g, '').toLowerCase() == orgTitle.replace(/ /g, '').toLowerCase()) {
                //exact match (ignoring spaces and cases)
                if(idx == -1) {
                  idx = j;
                  imdbDatum.imdbFlag = '';
                }
                if(trueYear) {
                  exactMatchCount++;
                }
              }
            });

            if(exactMatchCount > 1) {
              console.warn(exactMatchCount + ' multiple exact matches for ' + orgTitle + ' found on imdb. so taking the first exact match.');
              imdbDatum.imdbFlag = '?';
            }
            else if(idx == -1) {
              idx = 0;
              if(titles[idx]) {
                console.warn(orgTitle + ' seems not found on imdb. so taking the first result: ' + titles[idx]);
              }
              else {
                console.warn(orgTitle + ' seems not found on imdb. no similar results!');
              }
              imdbDatum.imdbFlag = '??';
            }

            imdbDatum.imdbId = ids[idx];
            if(imdbDatum.imdbId)
              imdbDatum.imdbUrl = 'https://www.imdb.com/title/' + imdbDatum.imdbId;
          }
          else if(type == 'rating') {
            //imdbDatum.imdbRating = res.imdbRating;
            imdbDatum.imdbRating = res.rating;
            if(imdbDatum.imdbRating != 'N/A' && isNaN(parseFloat(imdbDatum.imdbRating))) {
              console.warn('imdb rating is not a number: ' + imdbDatum.imdbRating);
              imdbDatum.imdbFlag = '??';
            }
            imdbDatum.imdbRatingFetchedDate = new Date();

            if(isNaN(parseInt(imdbDatum.year)))
              imdbDatum.year = res.year || year;

            //final! year difference check
            if(!trueImdbUrl) {
              const tempYear = res.year;
              const sTrueYear = trueYear || imdbDatum.year;
              let yearDiff;
              if(tempYear && sTrueYear)
                yearDiff = Math.abs(tempYear - sTrueYear);
              //console.debug(yearDiff, tempYear, sTrueYear, trueYear, imdbDatum.year);  //dev

              //if trueYear or imdbDatum.year is n/a, the difference cannot be checked.
              if(yearDiff == 1) {
                console.debug('mild warning: year on imdb is ' + (tempYear || 'n/a') + ', which differs 1 year from ' + sTrueYear + ' for ' + orgTitle);
                imdbDatum.imdbFlag = '?';
              }
              else if(yearDiff > 1) {
                console.warn('year on imdb is ' + (tempYear || 'n/a') + ', which quite differs from ' + sTrueYear + ' for ' + orgTitle);
                imdbDatum.imdbFlag = '??';
              }
              else if(!isNaN(yearDiff)) {
                if(imdbDatum.imdbFlag == '??')
                  imdbDatum.imdbFlag = '?';
                else if(imdbDatum.imdbFlag == '?')
                  imdbDatum.imdbFlag = '';
              }
            }
          }

          imdbData[i] = imdbDatum;
        });

        return imdbData;
      }
    }
  }

  async largeDivUpdateForKino(largeDiv) {
    //no error-check
    const imdbRating = largeDiv.querySelector(fy.extraSelector).textContent.trim().replace(' ·', '');

    //if(isNaN(parseFloat(imdbRating)) || parseFloat(imdbRating) == 0) {
      //toast.log('imdb rating is not present on kino. so forcing update...');
      toast.log('forcing update...');

      const trueOrgTitle = largeDiv.querySelector('h4.title-en').textContent;
      const trueYear = largeDiv.querySelector('p.metadata>span:last-child').textContent;

      fy.search([largeDiv], trueYear, null, null, trueOrgTitle, imdbRating);
    //}
    //else {
      //toast.log('imdb rating is present. so nothing to do.');
      //toast.log();
    //}
  }

  async largeDivUpdateForWatcha(largeDiv) {
    let isContensPage = false;

    if(largeDiv.nodeName == 'IMG')
      largeDiv = largeDiv.previousSibling;

    if(largeDiv.nodeName == 'H1') {
      // /contents/ path
      isContensPage = true;
      largeDiv = largeDiv.parentNode.parentNode.parentNode;
    }
    else
      largeDiv.setAttribute(FY_UNIQ_STRING, '');

    const commonSelector = 'div[class*="-ContentMetaCreditWithPredicted"]';
    await elementReady(commonSelector, largeDiv);

    const trueYearSelector = 'div li:last-of-type>span>span:last-of-type';
    let trueYear = largeDiv.querySelector(trueYearSelector);
    if(trueYear)
      trueYear = trueYear.textContent.trim().slice(-5).slice(0, 4);
    else {
      //nothing to do (상세정보, 비슷한 작품 등의 탭을 눌렀을 때)
      //toast.log();
      fy.observer.observe(fy.root, fy.observerOption);
      return;
    }

    /*
    let trueCat = largeDiv.querySelector('[data-select="content_meta"]').textContent;
    if(trueCat.includes('에피소드'))
      trueCat = 'tv';
    else
      trueCat = 'movie';
    */

    const code = largeDiv.querySelector('a[aria-label="재생"]').href.split('/').pop();
    const trueUrl = 'https://pedia.watcha.com/en-KR/contents/' + code;  //english page

    let forceUpdate = false;
    let fyItems, otFlag, imdbFlag, tempYear;
    if(isContensPage) {
      if(largeDiv.getAttribute(FY_UNIQ_STRING) == null) {
        forceUpdate = true;
        fyItems = [largeDiv];
      }
      else {
        const sEl = largeDiv.querySelector('.fy-external-site');
        if(sEl) {
          tempYear = sEl.getAttribute('year');
          imdbFlag = largeDiv.querySelector('.fy-imdb-rating').getAttribute('flag');
        }

        if(imdbFlag != '' || trueYear != tempYear) {
          forceUpdate = true; 
        }
      }
    }
    else {
      let trueTitle = largeDiv.querySelector('h1');
      if(trueTitle)
        trueTitle = trueTitle.textContent;
      else
        trueTitle = largeDiv.querySelector('img').alt

      //large div 페칭 후 업데이트할 아이템들. 페칭이 오래 걸리면 달라질 수도 있지만... 귀찮.
      fyItems = [...fy.root.querySelectorAll(fy.selector + '['+FY_UNIQ_STRING+']')]
      .filter(item => item.querySelector(fy.titleSelector).textContent == trueTitle);
      await elementReady('.content-preview-exit-done', fy.root);

      //현재 선택한 아이템
      const fyItem = fyItems.filter(el => el.querySelector('div[class*="-Content"]>div').childElementCount == 3).pop();

      const sEl = fyItem.querySelector('.fy-external-site');
      otFlag = sEl.getAttribute('flag');
      tempYear = sEl.getAttribute('year');
      imdbFlag = fyItem.querySelector('.fy-imdb-rating').getAttribute('flag');

      //ot 플래그가 ?/??이거나 imdb 플래그가 ??면 다시 검색. 혹은 연도가 달라도.
      if(otFlag != '' || imdbFlag == '??' || trueYear != tempYear)
        forceUpdate = true;
    }

    if(forceUpdate && fyItems) {
      //change flow
      if(isContensPage)
        toast.log('force large div updating... (on a single content page)');
      else
        toast.log('force large div updating...');

      fy.search(fyItems, trueYear, trueUrl);
    }
    else { 
      if(fyItems) {
        toast.log('already updated.');  //잘 안 나타나는 경우가 있다??
        toast.log();
      }

      //nothing to do (보고싶어요 등에 마우스 오버, 아웃 시)
      fy.observer.observe(fy.root, fy.observerOption);
    }
  }

  preUpdateDivs(itemDivs) {
    //div pre-update if not done yet
    if(fy.subSelector) {
      itemDivs.forEach((item, i) => {
        if(item.getAttribute(FY_UNIQ_STRING) == null) {
          item.setAttribute(FY_UNIQ_STRING, '');
          const div = document.createElement('div');
          div.className = FY_UNIQ_STRING;
          item.insertBefore(div, item.querySelector(fy.subSelector));
        }
      });
    }
    else {
      //in case of kinolights
      const el = itemDivs[0].querySelector(fy.extraSelector);
      el.setAttribute(FY_UNIQ_STRING, '');
      el.classList.add(FY_UNIQ_STRING);
    }
  }

  updateDivs(itemDivs, otData) {
    toast.log('updating divs...');
    itemDivs.forEach((item, i) => {
      updateDiv_(item, otData[i]);
    });
    toast.log('divs updated!');

    //wrap up
    toast.log();
    fy.observer.observe(fy.root, fy.observerOption);


    function updateDiv_(fyItemToUpdate, otDatum = {}) {
      const selector = fy.subSelector ? fy.subSelector + '.' + FY_UNIQ_STRING : fy.extraSelector;
      const div = fyItemToUpdate.querySelector(selector);

      if(!div) {
        console.warn('no fy-item sub div found for ' + fyItemToUpdate);
        return;
      }

      let flag = otDatum.otFlag || '';
      let year = otDatum.year || '';
      let innerHtml = '';

      if(otDatum.otUrl)
        innerHtml += `<a href="${otDatum.otUrl}" target="_blank">`;

      if(fy.subSelector)
        innerHtml += `<span class="fy-external-site" year="${year}" flag="${flag}">[WP]${flag}</span>`;

      if(otDatum.otUrl)
        innerHtml += `</a>`;

      if(fy.subSelector)
        innerHtml += `<a href="javascript:void(0);" onClick="fy.edit(this, 'ot')" class="fy-edit">edit</a> `;

      let label = 'n/a';
      if(otDatum.imdbRatingFetchedDate) {
        let yourDate = new Date(otDatum.imdbRatingFetchedDate);
        const offset = yourDate.getTimezoneOffset();
        yourDate = new Date(yourDate.getTime() - (offset*60*1000));
        label = yourDate.toISOString().split('T')[0];  //Date to yyyy-mm-dd
      }

      let rating = 'n/a', ratingCss = 'na';
      if(otDatum.imdbRating && parseFloat(otDatum.imdbRating) >= 0) {
        rating = parseFloat(otDatum.imdbRating);
        [...Array(10).keys()].reverse().some(n => {
          //[9, 8, 7, ..., 2, 1, 0]
          if(rating > n) {
            ratingCss = n;
            return true;
          }
        });
        rating = rating.toFixed(1);
      }

      flag = otDatum.imdbFlag || '';
      if(otDatum.imdbUrl)
        innerHtml += `<a href="${otDatum.imdbUrl}" target="_blank" title=${label}>`;

      innerHtml += `<span class="fy-imdb-rating over-${ratingCss}" flag="${flag}">${rating}${flag}</span>`;

      if(otDatum.imdbUrl)
        innerHtml += `</a>`;

      innerHtml += `<a href="javascript:void(0);" onClick="fy.edit(this, 'imdb')" class="fy-edit">edit</a> `;

      //in case of kinolights
      if(!fy.subSelector)
        innerHtml += ' · ';

      div.innerHTML = innerHtml;
    }
  }


  //public members
  //watcha only for now
  edit(el, type) {
    const otCache = GM_getValue('OT_CACHE_WITH_IMDB_RATINGS');  //exported earlier

    let fyItem;
    switch(document.location.host) {
      case 'm.kinolights.com':
        fyItem = document.querySelector('div.movie-info-container');
        break;
      case 'watcha.com':
        fyItem = el.parentNode.parentNode;
        break;
    }

    const title = fyItem.querySelector(fy.titleSelector).textContent;
    const otDatum = otCache[title];

    if(type == 'ot') {
      let trueUrl = prompt("Enter proper Watcha Pedia url: ", otDatum.otUrl);
      if(!trueUrl)
        return;
      else if(!trueUrl.startsWith('https://pedia.watcha.com/')) {
        alert('Not a valid Watcha Pedia url. it should be "https://pedia.watcha.com/en-KR/contents/WP_CODE" format!');
        return;
      }
      trueUrl = trueUrl.trim().replace('/ko-KR/', '/en-KR/').replace(/\/\?.*$/, '');

      //change flow
      fy.observer.disconnect();
      fy.search([fyItem], null, trueUrl);
    }
    else if(type == 'imdb') {
      let trueUrl = prompt("First make sure that Watcha Pedia info is correct. If so, enter proper IMDb title url: ", otDatum.imdbUrl);
      if(!trueUrl)
        return;
      else if(!trueUrl.startsWith('https://www.imdb.com/title/')) {
        alert('Not a valid IMDb title url. it should be "https://www.imdb.com/title/IMDB_ID" format!');
        return;
      }
      trueUrl = trueUrl.trim().replace(/\/\?.*$/, '');

      //change flow
      fy.observer.disconnect();
      fy.search([fyItem], null, null, trueUrl);
    }
  }


  //utils (private...)
  async fetchAll(urls, headers = {}, delay = 0) {  //, order = false) {
    fy.isFetching = true;
    const results = [];

    //if(!order) {  //faster
    //https://lavrton.com/javascript-loops-how-to-handle-async-await-6252dd3c795/
    const promises = urls.map(async (url, i) => {
      results[i] = await fetchOne_(url, headers, delay);
    });
    await Promise.all(promises);
    /*
    }
    else {
      //https://medium.com/dailyjs/the-pitfalls-of-async-await-in-array-loops-cf9cf713bfeb
      for(const [url, i] of urls.entries())
        results[i] = await fetchOne_(url, headers, delay);
    }
    */
    fy.isFetching = false;
    return results;


    async function fetchOne_(url, headers, delay) {
      if(delay > 0)
        await sleep(delay);

      return new Promise((resolve, reject) => {
        if(!url)
          resolve(null);
        else {
          fy.XHR = GM_xmlhttpRequest({
            method: 'GET',
            headers: headers,
            url: url,
            onload: res => {
              resolve(res.responseText);
            },
            onerror: err => {
              reject(err);
            },
          });
        }
      });
    }
  }

}


//common util classes
function fadingAlert() {
  this.div = document.createElement('div');
  this.div.id = 'alertBoxDiv';
  document.body.appendChild(this.div);

  const s = this.div.style;
  s.position = 'fixed';
  s.top = '40%';
  s.left = '45%';
  s.textAlign = 'center';
  s.width = '300px';
  s.height = 'auto';
  s.padding = '2px';
  s.border = 0;
  s.color = 'Black';
  s.backgroundColor = 'LawnGreen';
  s.overflow = 'auto';
  s.zIndex = '2147483647';

  this.log = async (...txt) => {
    if(txt.length == 0) {
      await sleep(1);
      this.div.style.opacity = 0;
      this.div.style.transition = 'opacity 2s ease-in';
    }
    else {
      this.div.textContent = txt.join(' ');
      this.div.style.transition = '';
      this.div.style.opacity = 1;
      console.log(...txt);
    }
  };
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function elementReady(selector, baseEl) {
  return new Promise((resolve, reject) => {
    if(!baseEl)
      baseEl = document.documentElement;

    let els = [...baseEl.querySelectorAll(selector)];
    if(els.length > 0)
      resolve(els[els.length-1]);

    new MutationObserver(async (m, o) => {
      let els = [...baseEl.querySelectorAll(selector)];
      if(els.length > 0) {
        o.disconnect();
        resolve(els[els.length-1]);
      }
    })
    .observe(baseEl, {
      childList: true,
      subtree: true
    });
  });
}

function setGMCache(GMKey, array) {
  //캐시에 쓰기 전에 최신 캐시를 읽은 다음 거기에 추가된 애들만 덧붙인다.
  //다른 비동기 호출이 실행 도중일 수도 있으므로... really??

  //array to obj
  const obj = {};
  array.forEach((el, i) => {
    const title = el.query;
    if(title) {
      delete el.query;
      obj[title] = el;
    }

    delete el.tempYear;
    delete el.cat;
  });

  const targetObj = GM_getValue(GMKey);
  Object.assign(targetObj, obj);
  GM_setValue(GMKey, targetObj);
  console.debug(Object.keys(obj).length + ' items possibly updated on cache.');
}

function specialRoman2roman(s) {
  const map = {
    'Ⅰ': 'I', 'Ⅱ': 'II', 'Ⅲ': 'III', 'Ⅳ': 'IV', 'Ⅴ': 'V',
    'Ⅵ': 'VI', 'Ⅶ': 'VII', 'Ⅷ': 'VIII', 'Ⅸ': 'IX', 'Ⅹ': 'X'};
  return map[s];
};

  //others' small utils
function dateDiffInDays(a, b) {
  //https://stackoverflow.com/a/15289883/6153990
  // a and b are javascript Date objects

  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

function roman2arabic(s) {
  //https://stackoverflow.com/a/57521300/6153990
  const map = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000};
  return [...s].reduce((r,c,i,s) => map[s[i+1]] > map[c] ? r-map[c] : r+map[c], 0);
}


//singletons
const toast = new fadingAlert();
toast.log();


//global consts
const FY_UNIQ_STRING = 'fy-item';

const SMALL_ROMANS_AT_THE_END = /IX|IV|V?I{0,3}$/;

const RAPID_API_HOST = 'imdb-internet-movie-database-unofficial.p.rapidapi.com';
const RAPID_API_KEY = GM_getValue('RAPID_API_KEY');
const DEFAULT_MSG = '입력하세요';


//first init and run
unsafeWindow.fy = new FyGlobal();
fy.run();