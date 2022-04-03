// ==UserScript==
// @name         imdb on watcha
// @namespace    http://tampermonkey.net/
// @version      0.4.3
// @updateURL    https://raw.githubusercontent.com/anemochore/imdbOnWatcha/master/app.js
// @downloadURL  https://raw.githubusercontent.com/anemochore/imdbOnWatcha/master/app.js
// @description  try to take over the world!
// @author       fallensky@naver.com
// @include      https://www.imdb.com/title/*
// @include      https://watcha.com/*
// @include      https://m.kinolights.com/*
// @include      https://www.netflix.com/*
// @resource     CSS https://raw.githubusercontent.com/anemochore/imdbOnWatcha/master/fy_css.css
// @require      https://raw.githubusercontent.com/anemochore/imdbOnWatcha/master/settings.js
// @require      https://raw.githubusercontent.com/anemochore/imdbOnWatcha/master/fixes.js
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @connect      pedia.watcha.com
// @connect      data-imdb1.p.rapidapi.com

// ==/UserScript==


//singletons
const toast = new fadingAlert();
toast.log();


//global consts
const RAPID_API_HOST = 'data-imdb1.p.rapidapi.com';

const RAPID_API_KEY = GM_getValue('RAPID_API_KEY');
const DEFAULT_MSG = '입력하세요';


class FyGlobal {

  run() {
    const settings = SETTINGS, site = document.location.host;

    //imdb 접속 시 캐시 업데이트
    if(site == 'www.imdb.com') {
      fy.imdbRun();
      return;
    }

    if(!settings[site])
      return;

    toast.log('fy script started.');
    //this.started = true;

    for(const [k, v] of Object.entries(settings[site]))
      this[k] = v;

    //weird behavior... -_-
    this.selectRuleOnPreUpdateDiv = {...this.selectRuleOnUpdateDiv} || {};
    this.selectRuleOnPreUpdateDiv.selector = null;

    this.handler = this.handlers[site];
    this.largeDivUpdate = this.largeDivUpdates[site];
    this.preUpdateDivs = this.preUpdateDivses[site];
    this.search = this.searches[site];

    //global vars & flags
    this.prevLocationOriginPathname = document.location.origin+document.location.pathname;
    this.isFetching = false;

    //for this.edit()
    unsafeWindow.GM_getValue = GM_getValue;

    //캐시 없으면 생성
    if(!GM_getValue('OT_CACHE_WITH_IMDB_RATINGS'))
      GM_setValue('OT_CACHE_WITH_IMDB_RATINGS', {});

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
    fy.site = document.location.host;
    fy.observer = new MutationObserver(fy.handler);
    fy.observerOption = {childList: true, subtree: true};

    //real entry point
    fy.entry();
  }

  async entry(e = null) {
    //entry point
    fy.observer.disconnect();
    console.debug('observer disconncted on entry()!');

    fy.root = document.querySelector(fy.rootSelector);
    const curLocation = document.location;

    //ignoring # or ?mappingSource... at the end
    if(fy.prevLocationOriginPathname != curLocation.origin+curLocation.pathname && fy.isFetching) {
      toast.log('url changed. so aborting current fetching...');
      fy.xhrAbort();

      //reset fy-item attributs
      const itemDivs = [...fy.root.querySelectorAll('['+FY_UNIQ_STRING+']')];
      itemDivs.forEach((item, i) => {
        item.removeAttribute(FY_UNIQ_STRING);
      });
    }

    //init
    toast.log();

    const isExit = determineExit_();
    if(!isExit && !fy.isFetching) {
      //toast.log('fy script initiating...');
      const selector = fy.selector || fy.largeDivSelector;

      if(fy.preventMultipleUrlChanges)
        fy.isFetching = true;  //hack for kino

      toast.log('waiting for page loading (or changing)...');
      await elementReady(selector, fy.root);
      fy.handler();  //force first run
    }
    
    function determineExit_() {
      let result = false;

      //check if the page is included in excludingPath
      let isExcludingPath = false;
      if(Array.isArray(fy.excludingPaths)) {
        fy.excludingPaths.some(path => {
          if(curLocation.pathname.startsWith(path)) {
            isExcludingPath = true;
            return true;  //break
          }
        });
        if(isExcludingPath) {
          toast.log('on excluding page');
          result = true;
        }
      }

      //check if the page is included in includingPath
      let isIncludingPath = false;
      if(Array.isArray(fy.includingPaths)) {
        fy.includingPaths.some(path => {
          if(curLocation.pathname.startsWith(path)) {
            isIncludingPath = true;
            return true;  //break
          }
        });
        if(!isIncludingPath) {
          toast.log('not in including page');
          result = true;
        }
      }

      return result;
    }
  }

  handlers = {
    'm.kinolights.com': async () => {
      fy.isFetching = false;  //hack for kino

      const largeDiv = document.querySelector(fy.largeDivSelector+':not(['+FY_UNIQ_STRING+'])');
      if(largeDiv)
        fy.largeDivUpdate(largeDiv);
    },

    'watcha.com': async (m, o) => {
      fy.observer.disconnect();

      if(document.location.pathname.startsWith('/contents/')) {
        let fyItem = fy.root.querySelector('['+FY_UNIQ_STRING+']');
        if(fyItem) {
          //if already updated, no more update when scrolling, etc
          toast.log();
          fy.observer.observe(fy.root, fy.observerOption);
          return;
        }

        let largeDiv = fy.root.querySelector('h1');
        if(!largeDiv)
          largeDiv = await elementReady('h1', fy.root);

        fy.largeDivUpdate(largeDiv);
        return;
      }

      const itemDivs = [...fy.root.querySelectorAll(fy.selector)];
      const itemNum = itemDivs.length;
      if(itemNum > 0) {
        //toast.log('searching on wp or cache for', itemNum, 'items...');
        fy.search(itemDivs);
      }
      else {
        //nothing to do
        toast.log();
        fy.observer.observe(fy.root, fy.observerOption);
      }
    },

    'www.netflix.com': async (m, o) => {
      fy.observer.disconnect();

      const itemDivs = [...fy.root.querySelectorAll(fy.selector)];
      const itemNum = itemDivs.length;
      if(itemNum > 0) {
        //toast.log('searching on wp or cache for', itemNum, 'items...');
        fy.search(itemDivs);
      }
      else {
        //nothing to do
        toast.log();
        fy.observer.observe(fy.root, fy.observerOption);
      }
    },
  };

  largeDivUpdates = {
    'm.kinolights.com': async (largeDiv) => {
      //no error-check
      let imdbRating = largeDiv.querySelector(fy.selectRuleOnUpdateDiv.selector).textContent.trim().replace(' ·', '');
      if(isNaN(imdbRating))
        imdbRating = null;

      toast.log('forcing update...');

      const trueOrgTitle = largeDiv.querySelector('h4.title-en').textContent;
      const trueYear = largeDiv.querySelector('p.metadata>span:last-child').textContent;
      fy.search([largeDiv], {year: trueYear, orgTitle: trueOrgTitle});
    },

    'watcha.com': async (largeDiv) => {
      //on single content page

      const trueId = document.head.querySelector('meta[property="og:url"]').content.split('/').pop();
      const trueUrl = 'https://pedia.watcha.com/en-KR/contents/' + trueId;  //english page
      const trueTitle = largeDiv.textContent;  //h1. of course, it's on meta too.

      let sEl = fy.root.querySelector('.'+FY_UNIQ_STRING);
      let otFlag, imdbFlag;
      if(sEl) {
        //already updated
        otFlag = sEl.querySelector('.fy-external-site').getAttribute('flag');
        imdbFlag = sEl.querySelector('.fy-imdb-rating').getAttribute('flag');
      }
      else {
        //not yet updated (first loading)
        const cache = fy.getObjFromWpId_(trueId);
        otFlag = cache.otFlag;
        imdbFlag = cache.imdbFlag;
      }

       //ot 플래그가 ?/??이거나 imdb 플래그가 ?/??면 다시 검색. 아직 로딩이 안 됐더라도.
      if(otFlag != '' || imdbFlag != '' || !sEl) {
        toast.log('large div on single-page update triggered...');
        fy.search([largeDiv], {id: trueId, url: trueUrl, title: trueTitle});
      }
      else {
        toast.log('nothing to do');
        toast.log();
        return;
      }
    },
  };

  baseElementSelect = itemDivs => {
    itemDivs.forEach((item, i) => {
      const baseEl = fy.applySelectRuleIfAny(item, fy.selectRuleOnPreUpdateDiv);

      if(baseEl.getAttribute(FY_UNIQ_STRING) == null) {
        baseEl.setAttribute(FY_UNIQ_STRING, '');
        const infoEl = document.createElement('div');
        infoEl.classList.add(FY_UNIQ_STRING);
        infoEl.classList.add(fy.site.replace(/\./g, '_'));
        baseEl.insertBefore(infoEl, baseEl.firstChild);
      }
    });
  };

  preUpdateDivses = {
    'm.kinolights.com': itemDivs => {
      const el = itemDivs[0].querySelector(fy.selectRuleOnUpdateDiv.selector);
      el.setAttribute(FY_UNIQ_STRING, '');
      el.classList.add(FY_UNIQ_STRING);
    },

    'watcha.com': this.baseElementSelect,
    'www.netflix.com': this.baseElementSelect,
  };

  async searchById(itemDivs, trueData = {year: null, id: null, url: null, imdbId: null, imdbUrl: null, orgTitle: null, title: null}) {
    let otData = [];
    let allTitles = Array(itemDivs.length).fill(null);  //all titles
    let allIds = Array(itemDivs.length).fill(null);     //all ids
    let ids = Array(itemDivs.length).fill(null);        //titles to scrape

    fy.preUpdateDivs(itemDivs);
    itemDivs.forEach((item, i) => {
      let id;
      if(trueData.id)
        id = trueData.id;
      else
        id = fy.applySelectRuleIfAny(item, fy.selectRuleOnGetIdForListItems)?.href.split('/').pop();

      if(!id) return;

      allIds[i] = id;
      let title, tempDatum;
      if(trueData.title)
        title = trueData.title;
      else 
        title = fy.applySelectRuleIfAny(item, fy.selectRuleOnGetTitleForListItems).textContent;

      allTitles[i] = title;

      //일단 캐시에 있다면 그 정보가 뭐든 div 업데이트에는 사용한다.
      otData[i] = GM_getValue('OT_CACHE_WITH_IMDB_RATINGS')[title] || {};

      ids[i] = fy.useCacheIfAvailable_(id, otData[i]);
      otData[i].query = title;

      otData[i].otUrl = trueData.url || 'https://pedia.watcha.com/en-KR/contents/' + id;
      otData[i].otFlag = '';
      if(trueData.imdbId) {  //id가 url보다 우선함(url은 id에서 파생되므로)
        otData[i].imdbId = trueData.imdbId;
        otData[i].imdbUrl = trueData.imdbUrl;
        otData[i].imdbFlag = '';
      }
    });

    //start searching
    //찾을 제목에 대해 내부 캐시 적용.
    let indexCaches = [];
    let searchLength = fy.setInternalCache_(ids, indexCaches, otData);

    if(searchLength == 0) {
      console.log('nothing to search or scrape on wp.');
      fy.searchImdbAndWrapUp_(itemDivs, otData, trueData, indexCaches, allTitles);
      return;
    }

    if(!trueData.imdbId && !trueData.orgTitle) {
      toast.log('scraping org. titles...');
      const otScrapeResults = await fy.fetchAll(ids.map((id, i) => id ? otData[i].otUrl : null), {
        headers: {
          'Accept-Language': 'en-KR',
        },
      });
      searchLength = otScrapeResults.filter(el => el).length;

      if(searchLength == 0) {
        console.log('org. titles scraping result is empty.');
        fy.searchImdbAndWrapUp_(itemDivs, otData, trueData, indexCaches, allTitles);
        return;
      }

      console.log('org. titles scraping done:', searchLength);
      fy.parseWpScrapeResults_(otScrapeResults, otData, allTitles);
    }
    fy.searchImdbAndWrapUp_(itemDivs, otData, trueData, indexCaches, allTitles);
  }

  async searchByTitle(itemDivs, trueData = {year: null, id: null, url: null, imdbId: null, imdbUrl: null, orgTitle: null, title: null}) {
    const otCache = GM_getValue('OT_CACHE_WITH_IMDB_RATINGS');

    let otData = [];
    let allTitles = Array(itemDivs.length).fill(null);  //all titles
    let titles = Array(itemDivs.length).fill(null);     //titles to search

    fy.preUpdateDivs(itemDivs);
    itemDivs.forEach((item, i) => {
      let title = trueData.title;
      if(!title)
        title = item.querySelector(fy.titleSelector)?.textContent || item.querySelector(fy.titleSelector)?.alt || item.querySelector(fy.titleSelector)?.getAttribute('aria-label');
      if(!title) return;

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

      titles[i] = fy.useCacheIfAvailable_(title, otData[i]);
      otData[i].query = title;
    });


    //start searching
    //large div update
    if(trueData.year) {
      //imdb 연도를 우선함
      if(otData[0].otFlag != '' || !otData[0].year)
        otData[0].year = trueData.year;
    }

    //large div update or wp manual update
    if(trueData.id) {
      console.log(otData, trueData);
      otData[0].otUrl = trueData.url;
      otData[0].otFlag = '';
    }

    //imdb manual update
    if(trueData.imdbId) {
      otData[0].imdbUrl = trueData.imdbUrl;
      otData[0].imdbFlag = '';
    }

    //kino update
    if(trueData.orgTitle) {
      otData[0].orgTitle = trueData.orgTitle;
    }

    //찾을 제목에 대해 내부 캐시 적용.
    let indexCaches = [];
    let searchLength = fy.setInternalCache_(titles, indexCaches, otData);

    if(searchLength == 0) {
      console.log('nothing to search or scrape on wp.');
      fy.searchImdbAndWrapUp_(itemDivs, otData, trueData, indexCaches, allTitles);
      return;
    }
    else if(!trueData.id) {
      //목록 업데이트
      let PREFIX = 'https://pedia.watcha.com/ko-KR/search?query=';
      //왓챠피디아는 .을 없애야 함...
      const otSearchResults = await fy.fetchAll(titles.map(title => title ? PREFIX + encodeURIComponent(title.replace(/\./g, '')) : null), {
        headers: {
          'Accept-Language': 'ko-KR',
        },
      });
      fy.parseWpSearchResults_(otSearchResults, otData, trueData, titles);
      searchLength = otSearchResults.filter(el => el).length;
      if(searchLength == 0) {
        console.log('org. titles searching result is empty.');
        fy.searchImdbAndWrapUp_(itemDivs, otData, trueData, indexCaches, allTitles);
        return;
      }
      else {
        console.log('org. titles searching done:', searchLength);
      }
    }

    if(!trueData.imdbUrl && !trueData.orgTitle) {
      toast.log('scraping org. titles...');
      const otScrapeResults = await fy.fetchAll(titles.map((title, i) => title ? otData[i].otUrl : null), {
        headers: {
          'Accept-Language': 'en-KR',
        },
      });
      searchLength = otScrapeResults.filter(el => el).length;

      if(searchLength == 0) {
        console.log('org. titles scraping result is empty.');
        fy.searchImdbAndWrapUp_(itemDivs, otData, trueData, indexCaches, allTitles);
        return;
      }

      console.log('org. titles scraping done:', searchLength);
      fy.parseWpScrapeResults_(otScrapeResults, otData, allTitles);
    }
    fy.searchImdbAndWrapUp_(itemDivs, otData, trueData, indexCaches, allTitles);
  }

  searches = {
    'm.kinolights.com': this.searchByTitle,
    'www.netflix.com': this.searchByTitle,
    'watcha.com': this.searchById,
  };

  //utils used in editing
  getObjFromWpId_(id) {
    const otCache = GM_getValue('OT_CACHE_WITH_IMDB_RATINGS');
    const cacheTitles = Object.keys(otCache);
    const cacheIds = Object.values(otCache).map(el => el.otUrl ? el.otUrl.split('/').pop() : null);

    const idIndex = cacheIds.indexOf(id);
    if(idIndex > -1) {
      const title = cacheTitles[idIndex];
      //return {[title]: otCache[title]};
      return otCache[title];
    }
    else
      return {};
  }

  useCacheIfAvailable_(value, cache) {
    //캐시에 원제가 있다면 캐시 사용 대상
    let result = null;
    if(cache?.orgTitle) {  // && cache?.imdbRating) {
      //단, 캐시가 오래되었다면 다시 페칭.
      const UPDATE_INTERVAL_DAYS = 30;  //in days
      if(dateDiffInDays(new Date(), new Date(cache.imdbRatingFetchedDate)) > UPDATE_INTERVAL_DAYS) {
        console.debug(`cache for ${value} is over than ${UPDATE_INTERVAL_DAYS} days. so updating now...`);  //dev (verbose)
        result = value;
      }
      else {
        console.debug(`cache for ${value} will be used: ${cache.orgTitle} (${cache.year})`);
      }
    }
    else {
      //캐시에 없다면 당연히 페칭
      result = value;
    }

    return result;
  }

  setInternalCache_(arr, cachedIndexes, otData) {
    //똑같은 검색어가 여러 개라면 내부 캐싱(앞에 똑같은 검색어가 있다면 뒤에 나오는 애는 캐싱)
    //otData를 직접 수정
    if(!cachedIndexes)
      cachedIndexes = [];

    arr.slice(1).forEach((title, i) => {
      if(title) {
        const prevIdx = arr.slice(0, 1+i).indexOf(title);
        if(prevIdx > -1) {
          cachedIndexes[1+i] = String(prevIdx);  //to use with filter
          arr[1+i] = null;
          otData[1+i] = {};
        }
      }
    });

    return arr.filter(el => el).length;
  }

  getInternalCache_(cachedIndexes, otData) {
    //내부 캐시 반영
    //otData를 직접 수정
    if(cachedIndexes.filter(el => el).length == 0)
      return;

    console.debug('internal cache used for ' + cachedIndexes.filter(el => el).length + ' titles');
    cachedIndexes.forEach((cache, i) => {
      if(cache)
        otData[i] = otData[cache];  //referenced-cloning is okay.
    });
  }


  //parsing and scraping funcs
  parseWpSearchResults_(results, otData, trueData, titles) {
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

      const selector = 'div[class*="StyledTabContentContainer"] section>section ';
      let sDivs = [...targetDoc.querySelectorAll(selector)];

      //최상위 섹션, 영화, TV 프로그램만 처리
      const sUrls = [], sTitles = [], sYears = [];
      sDivs.forEach((sDiv, j) => {
        const header = sDiv.querySelector('header>h2');
        //첫 번째(최상위) 섹션은 헤더가 없음
        if(!header && j == 0) {
          const info = [...sDiv.querySelectorAll('ul>li>a>div:last-child')];
          sUrls  .push(...info.map(el => el.parentNode.href));
          sTitles.push(...info.map(el => el.children[0].textContent));
          sYears .push(...info.map(el => el.children[1].textContent.split(' ・ ')[0]));
        }
        else if(header.textContent == '영화' || header.textContent == 'TV 프로그램') {
          const info = [...sDiv.querySelectorAll('ul>li>a>div:last-child>div[class]')];
          sUrls  .push(...info.map(el => el.parentNode.parentNode.href));
          sTitles.push(...info.map(el => el.children[0].textContent));
          sYears .push(...info.map(el => el.children[1].textContent.split(' ・ ')[0]));
        }
      });

      if(sUrls.length == 0) {
        console.warn(title, 'seems not found on wp!');
        console.debug(targetDoc.documentElement.outerHTML);
        otData[i].otFlag = '??';
        return;  //continue
      }

      //중복 항목은 제거(url이 프라이머리 키)
      for(let j=0; j < sUrls.length; j++)
        if(sUrls.slice(0, j).includes(sUrls[j]))
          sUrls[j] = sTitles[j] = sYears[j] = null;

      let idx = -1, firstNotNullIdx = -1, exactMatchCount = 0;
      sTitles.forEach((sTitle, j) => {
        if(sTitle) {
          if(sTitle == title
            && (!trueData.year || (trueData.year && trueData.year == sYears[j]))) {
            //exact match
            //trueYear가 있다면 아이템의 연도와도 일치해야 함.
            if(idx == -1) {
              idx = j;
              otData[i].otFlag = '';
            }
            exactMatchCount++;
          }
          else if(sTitle.replace(/ - /g, '').replace(/ /g, '') == title.replace(/ - /g, '').replace(/ /g, '')
            && (!trueData.year || (trueData.year && trueData.year == sYears[j]))
            ) {
            //exact match (ignoring - & spaces)
            //trueYear가 있다면 아이템과 일치해야 하고 exactMatchCount도 증가함.
            if(idx == -1) {
              idx = j;
              otData[i].otFlag = '';
            }
            if(trueData.year) {
              exactMatchCount++;
            }
          }
        }
      });
      if(exactMatchCount > 1) {
        console.warn(exactMatchCount + ' multiple exact matches for ' + title + (trueData.year ? ' ('+trueData.year+')' : '') + ' found on wp. so taking the first result.');
        otData[i].otFlag = '?';
      }
      else if(idx == -1) {
        idx = 0;
        console.warn(title + ' seems not found on wp among many. so just taking the first result: ' + sTitles[idx]);
        otData[i].otFlag = '??';
      }

      const id = sUrls[idx].split('/').pop();
      otData[i].otUrl = 'https://pedia.watcha.com/en-KR/contents/' + id;
    });
  }

  parseWpScrapeResults_(results, otData, allTitles) {
    results.forEach((result, i) => {
      if(!result)
        return;  //continue

      const targetDoc = new DOMParser().parseFromString(result, 'text/html');

      let [orgTitle, tempYear] = targetDoc.title
      .replace(/ - Watcha Pedia$/, '').replace(/\)$/, '').split(' (');

      //console.debug(document.title, orgTitle, tempYear);  //dev
      if(orgTitle == '' || !tempYear) {
        console.warn('scraping failed on', otData[i].otUrl);
        console.debug(targetDoc.documentElement.outerHTML);
        otData[i].otFlag = '??';

        return;  //continue
      }

      /*
      //year chack when large div updating
      if(trueYear) {
        const yearDiff = Math.abs(tempYear - trueYear);
        if(yearDiff == 1) {
          console.debug('very mild warning: year on wp is ' + tempYear + ', which differs 1 year from ' + trueYear + ' for ' + orgTitle + '. discarding wp year.');
          tempYear = trueYear;
        }
        else if(yearDiff > 1) {
          console.warn('year on wp is ' + tempYear + ', which quite differs from ' + trueYear + ' for ' + orgTitle + ". discarding it, but there's chance that wp data is totally wrong.");
          otData[i].otFlag = '?';
          tempYear = trueYear;
        }
      }
      */

      otData[i].orgTitle = orgTitle;
      otData[i].year = tempYear;
    });
  }

  async searchImdbAndWrapUp_(itemDivs, otData, trueData, indexCaches, allTitles) {
    const HEADERS = {
      'x-rapidapi-key': RAPID_API_KEY,
      'x-rapidapi-host': RAPID_API_HOST,
    };
    const FETCH_INTERVAL = 0;  //dev. seems ok.

    //원제 찾을 때 내부 캐시 사용했으면 일단 여기서 캐시 사용 해제.
    fy.getInternalCache_(indexCaches, otData);

    //id나 평점이 없으면 imdb 찾음.
    //혹은 trueYear/trueUrl/trueImdbUrl이 있어도 이 배열에 넣고 실제로 찾지는 않음.
    const otDataFiltered = otData.map(el => (!el.imdbId || !el.imdbRating || trueData.year || trueData.url || trueData.imdbUrl) ? el : {});
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
          [/ Season (\d+)$/, ''],
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

    let imdbPrefix = 'https://data-imdb1.p.rapidapi.com/titles/search/title/';
    let imdbSuffix = '?info=base_info&year=';

    //물론, 원제가 있는 애들만 찾는다. 없으면 못 찾지(예외는 수동 업데이트 시).
    let filtered = orgTitles.map((orgTitle, i) => orgTitle ? imdbPrefix + encodeURIComponent(orgTitles[i]) + imdbSuffix + years[i] + '&exact=true' : null);
    //console.log('filtered', filtered);
    searchLength = filtered.filter(el => el).length;

    if(searchLength == 0) {
      console.log('nothing to search on imdb.');
      searchLength = -1;
    }
    else if(!trueData.imdbId) {
      //여기서도 내부 캐시 적용
      searchLength = fy.setInternalCache_(filtered, indexCaches, otData);

      toast.log('now searching infos and ratings on imdb for',searchLength,'items...');
      imdbResults = await fy.fetchAll(filtered, HEADERS, FETCH_INTERVAL);
      searchLength = imdbResults.filter(el => el).length;
    }

    if(searchLength == 0) {
      console.log('imdb searching result is empty.');
    }
    else if(searchLength > 0) {
      if(!trueData.imdbId) {
        console.log('imdb searching possibly done:', searchLength);
        imdbData = parseImdbResults_('search');  //imdbResults, imdbData, etc are passed.

        let reSearchLength, toReSearch;
        while(true) {
          //determines re-searching
          toReSearch = imdbData.map((imdbDatum, j) => {
            if(!imdbDatum.needsReSearch)
              return null;
            else if(imdbDatum.needsReSearch == 'title fix')
              return imdbPrefix + encodeURIComponent(imdbDatum.orgTitle) + imdbSuffix + years[j] + '&exact=true';
            else //if(imdbDatum.needsReSearch == 'try aka search')
              return 'https://data-imdb1.p.rapidapi.com/titles/search/akas/' + encodeURIComponent(imdbDatum.orgTitle) + imdbSuffix + years[j];
          });

          reSearchLength = toReSearch.filter(el => el).length;
          if(reSearchLength == 0)
            break;

          toast.log('now re-searching infos and ratings on imdb for',reSearchLength,'items...');
          imdbResults = await fy.fetchAll(toReSearch, HEADERS, FETCH_INTERVAL);
          toReSearch = parseImdbResults_('search');  //imdbResults, imdbData, etc are passed.
          reSearchLength = toReSearch.filter(el => el.imdbId).length;
          if(reSearchLength > 0)
            console.log('imdb re-searching successfully done:', reSearchLength);
          else
            console.log('re-searching done unsuccessfully.');

          toReSearch.forEach((reImdbDatum, j) => {
            if(!reImdbDatum)
              return;  //continue

            //검색이 실패했어도 url을 넣기 위해
            if(reImdbDatum.imdbId || reImdbDatum.imdbUrl) {
              imdbData[j] = reImdbDatum;
              delete imdbData[j].needsReSearch;
            }
          });
        }

        //이제 ratings을 구한다. id가 있는 애들만 찾는다.
        imdbPrefix = 'https://data-imdb1.p.rapidapi.com/titles/';  //no need to use 'ratings' end-point
        filtered = imdbData.map(el => (el.imdbId && el.imdbId != 'n/a') ? imdbPrefix + el.imdbId + '?info=base_info' : null);
      }
      else {
        imdbPrefix = 'https://data-imdb1.p.rapidapi.com/titles/';  //no need to use 'ratings' end-point
        filtered = [imdbPrefix + trueData.imdbId + '?info=base_info'];
        imdbData = [otData[0]];
      }

      //검색 결과에서 바로 평점도 가져올 수 있는 경우(새 api의 base_info)
      let searchAndScraped = 0;
      filtered.forEach((el, i) => {
        const imdbRes = imdbResults[i];
        if(el && imdbRes && imdbRes.ratingsSummary) {
          const tempRating = imdbRes.ratingsSummary.aggregateRating;
          if(tempRating != 'n/a' && !isNaN(parseFloat(tempRating))) {
            if(imdbData[i].imdbFlag == 'pass') {
              imdbData[i].imdbFlag = '';
            }
            else {
              newImdbData[i] = imdbData[i];
              newImdbData[i].imdbRating = tempRating;
              newImdbData[i].imdbId = imdbData[i].imdbId;
              newImdbData[i].imdbUrl = 'https://www.imdb.com/title/' + imdbData[i].imdbId;
              newImdbData[i].imdbRatingFetchedDate = new Date().toISOString();
              newImdbData[i].imdbFlag = imdbData[i].imdbFlag;  //should be ''?
            }
            filtered[i] = null;
            searchAndScraped++;
          }
        }
      });
      if(searchAndScraped > 0)
        console.log(searchAndScraped+' ratings are scraped (or passed) during searching (no need to scrape).');

      searchLength = filtered.filter(el => el).length;
      if(searchLength == 0) {
        console.log('nothing to scrape ratings on imdb.');
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
        const newImdbDatum = newImdbData[i];
        if(newImdbDatum && newImdbDatum.imdbRating) {
          otData[i].imdbFlag = newImdbDatum.imdbFlag || '';
          otData[i].imdbId = newImdbDatum.imdbId;
          otData[i].imdbUrl = newImdbDatum.imdbUrl;
          otData[i].year = newImdbDatum.year;
          otData[i].imdbRating = newImdbDatum.imdbRating;
          otData[i].imdbRatingFetchedDate = newImdbDatum.imdbRatingFetchedDate;
          otData[i].orgTitle = newImdbDatum.orgTitle;
          otData[i].query = allTitles[i];  //to update cache
        }
        else if(oldEl && (oldEl.imdbId || oldEl.imdbUrl)) {
          otData[i].imdbFlag = oldEl.imdbFlag || '';
          if(oldEl.imdbId)
            otData[i].imdbId = oldEl.imdbId;
          otData[i].imdbUrl = oldEl.imdbUrl;  //검색 실패로 url만 건진 경우를 위해
          otData[i].orgTitle = oldEl.orgTitle;
          otData[i].query = allTitles[i];  //to update cache
        }
      });
    }

    //내부 캐시 사용했다면 적용
    fy.getInternalCache_(indexCaches, otData);

    //change flow: update divs
    fy.updateDivs(itemDivs, otData);


    function parseImdbResults_(type) {
      imdbResults.forEach((r, i) => {
        if(!r) return;  //continue

        let imdbDatum = {};
        if(imdbData[i])  //second run
          imdbDatum = imdbData[i];

        let orgTitle = imdbDatum.orgTitle || orgTitles[i];  //may be adjusted
        const year = years[i];

        let res;
        try {
          res = JSON.parse(r);
        }
        catch(e) {
          console.warn('parsing error: ', r);
        }

        if(!res || !res.results || (res.results && Object.keys(res.results).length == 0)) {
          console.warn(`searching or scraping ${orgTitle} (${year}) via API failed or no results on imdb!`);
          if(res.results) console.debug('res.results:', res.results);
          else if(res)    console.debug('res:', res);

          const otDatum = otData[i];
          if(otDatum.imdbFlag == '' && (otDatum.imdbId && otDatum.imdbId != 'n/a') && (otDatum.imdbRating && otDatum.imdbRating != 'n/a') && (otDatum.year && otDatum.year != 'n/a')) {
            console.debug('imdb data on cache is healthy, so let it be for: '+orgTitle);
          }
          else if(!imdbDatum.needsReSearch) {
            //fetch again with WP_TO_IMDB_FIX_DICT
            const sourceWords = [...WP_TO_IMDB_FIX_DICT.keys()];
            const targetWords = [...WP_TO_IMDB_FIX_DICT.values()];
            let fixedOrgTitle = orgTitle;
            sourceWords.forEach((sourceWord, j) => {
              if((typeof sourceWord == 'string' && orgTitle.includes(sourceWord)) || 
                (typeof sourceWord == 'object' && orgTitle.match(sourceWord)))
                fixedOrgTitle = orgTitle.replace(sourceWord, targetWords[j]);
            });

            if(fixedOrgTitle != orgTitle) {
              console.log(orgTitle, 'is fixed to', fixedOrgTitle+'. re-searching queued.');
              imdbData[i] = {};
              imdbData[i].orgTitle = fixedOrgTitle;
              imdbData[i].needsReSearch = 'title fix';
            }
            else {
              //if no WP_TO_IMDB_FIX_DICT can be applied, try aka search
              console.log(orgTitle, 're-searching (aka search) queued.');
              imdbData[i] = {};
              imdbData[i].orgTitle = orgTitle;
              imdbData[i].needsReSearch = 'try aka search';
            }
          }
          else if(imdbDatum.needsReSearch == 'title fix') {
            //if WP_TO_IMDB_FIX_DICT applied and failed, try aka search again
            console.log(orgTitle, 'title fixed but still no result. another re-searching (aka search) queued.');
            imdbData[i].needsReSearch = 'try aka search';
          }
          else {  //if(imdbDatum.needsReSearch == 'try aka search') {
            //finally, aka search failed too
            imdbData[i].imdbFlag = '??';
            imdbData[i].imdbUrl = 'https://www.imdb.com/find?s=tt&q=' + encodeURIComponent(orgTitle+' '+year);
          }
        }
        else {
          let resTitle, resYear;
          if(type == 'search') {
            const titles = res.results.map(el => el.titleText.text);
            const ids = res.results.map(el => el.id);
            const types = res.results.map(el => el.titleType.text);

            //movie, video, tv series are prefered
            const indexes = Array.from(Array(res.results.length).keys());
            const weights = Array(res.results.length).fill(0);  

            let idx = -1, exactMatchCount = 0;
            titles.forEach((sTitle, j) => {
              if(sTitle == orgTitle) {
                //exact match
                if(idx == -1) {
                  idx = j;
                  imdbDatum.imdbFlag = '';
                }
                exactMatchCount++;
                if(types[j] == 'Movie')
                  weights[j] = 3;
                else if(types[j] == 'Video')
                  weights[j] = 2;
                else if(types[j] == 'TV Series')
                  weights[j] = 1;
              }
            });

            if(exactMatchCount > 1) {
              const otDatum = otData[i];
              if(otDatum.imdbFlag == '' && (otDatum.imdbRating && otDatum.imdbRating != 'n/a') && (otDatum.year && otDatum.year != 'n/a')) {
                console.debug(`${exactMatchCount} multiple exact matches for ${orgTitle} (${otDatum.year}) found on imdb, but imdb data on cache is healthy. so just let it be.`);
                imdbDatum.imdbFlag = 'pass';
              }
              else {
                indexes.sort((a, b) => weights[b] - weights[a]);
                console.warn(`${exactMatchCount} multiple exact matches for ${orgTitle} (${otDatum.year}) found on imdb. so just taking the first exact match (movie, video, tv series are prefered).`);
                idx = indexes[0];
                imdbDatum.imdbFlag = '?';
              }
            }
            else if(idx == -1) {
              idx = 0;
              if(imdbDatum.needsReSearch == 'try aka search') {
                console.log('taking the first aka search result: ' + titles[idx]);
              }
              else {
                if(titles[idx]) {
                  console.warn(orgTitle + ' seems not found on imdb. so taking the first result: ' + titles[idx]);
                  imdbDatum.imdbFlag = '??';
                }
              }
            }

            imdbDatum.imdbId = ids[idx];
            imdbResults[i] = res.results[idx];  //mutate results to get ratings too (via base_info)
            if(imdbDatum.imdbId)
              imdbDatum.imdbUrl = 'https://www.imdb.com/title/' + imdbDatum.imdbId;

            resTitle = titles[idx];  //may be null?
            resYear = res.results[idx]?.releaseDate?.year;  //may be null?

            imdbDatum.orgTitle = resTitle;
            imdbDatum.year = resYear;
          }
          else if(type == 'rating') {
            let tempImdbRating = res.results?.ratingsSummary?.aggregateRating;
            if(!tempImdbRating || tempImdbRating == 'n/a' || isNaN(parseFloat(tempImdbRating))) {
              const otDatum = otData[i];
              if(otDatum.imdbFlag == '' && (otDatum.imdbRating && otDatum.imdbRating != 'n/a') && (otDatum.year && otDatum.year != 'n/a')) {
                console.debug('rating is not present and imdb data on cache is healthy, so let it be for: '+orgTitle);
              }
              else {
                console.warn(`imdb rating of ${orgTitle} (${year}) (id: ${otDatum.imdbId}) is not present or not a number: ${tempImdbRating}`);
                imdbDatum.imdbFlag = '??';
              }
            }
            else {
              imdbDatum.imdbRating = tempImdbRating;
            }
            imdbDatum.imdbRatingFetchedDate = new Date().toISOString();

            resTitle = res.results?.titleText?.text;
            resYear = res.results?.releaseDate?.year;
          }

          if(trueData.imdbId) {
            if(resYear != imdbDatum.year) {
              console.debug('year fixed:',imdbDatum.year,'->',resYear);
              imdbDatum.year = resYear;
            }

            if(resTitle != orgTitle) {
              console.debug('title fixed:',orgTitle,'->',resTitle);
              imdbDatum.orgTitle = resTitle;
            }
          }

          imdbData[i] = imdbDatum;
        }
      });

      return imdbData;
    }
  }


  //common(?) publics
  updateDivs(itemDivs, otData) {
    //toast.log('updating divs...');
    itemDivs.forEach((item, i) => {
      updateDiv_(item, otData[i], itemDivs.length);
    });
    toast.log('divs updated!');

    //캐시 반영
    setGMCache_('OT_CACHE_WITH_IMDB_RATINGS', otData);

    //wrap up
    toast.log();
    if(!fy.preventMultipleUrlChanges)
      fy.observer.observe(fy.root, fy.observerOption);

    //end of flow


    function setGMCache_(GMKey, array) {
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

        //delete el.needsReSearch;
      });

      const targetObj = GM_getValue(GMKey);
      Object.assign(targetObj, obj);
      GM_setValue(GMKey, targetObj);
      if(Object.keys(obj).length > 0)
        console.debug(Object.keys(obj).length + ' items possibly updated on cache.');
    }

    function updateDiv_(fyItemToUpdate, otDatum = {}, totalNumber) {
      const div = fy.applySelectRuleIfAny(fyItemToUpdate, fy.selectRuleOnUpdateDiv);

      if(!div) {
        console.warn('no (fy-item) sub div found for ', fyItemToUpdate);
        return;
      }

      let flag = otDatum.otFlag || '';
      let year = otDatum.year || '';
      let targetInnerHtml = '';

      if(otDatum.otUrl)
        targetInnerHtml += `<a href="${otDatum.otUrl}" target="_blank">`;

      targetInnerHtml += `<span class="fy-external-site" year="${year}" flag="${flag}">[WP]${flag}</span>`;

      if(otDatum.otUrl)
        targetInnerHtml += `</a>`;

      if(fy.site != 'watcha.com') {
        targetInnerHtml += `<a href="javascript:void(0);" onClick="fy.edit(this, 'ot')" class="fy-edit">edit</a> `;
      }
      else {
        targetInnerHtml += ' ';
      }

      let label = 'n/a';
      if(otDatum.imdbRatingFetchedDate) {
        let yourDate = new Date(otDatum.imdbRatingFetchedDate);
        if(isNaN(yourDate)) {
          otDatum.imdbRatingFetchedDate = 'n/a';  //fix invalid cache
          console.debug('fixed invalid fetched-date in cache for ' + otDatum.orgTitle);
        }
        else {
          const offset = yourDate.getTimezoneOffset();
          yourDate = new Date(yourDate.getTime() - (offset*60*1000));
          label = yourDate.toISOString().split('T')[0];  //Date to yyyy-mm-dd
        }
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
        targetInnerHtml += `<a href="${otDatum.imdbUrl}" target="_blank" title=${label}>`;

      targetInnerHtml += `[<span class="fy-imdb-rating over-${ratingCss}" flag="${flag}">${rating}${flag}</span>]`;

      if(otDatum.imdbUrl)
        targetInnerHtml += `</a>`;

      targetInnerHtml += `<a href="javascript:void(0);" onClick="fy.edit(this, 'imdb')" class="fy-edit">edit</a> `;

      //let users know it's changed (large div re-update only)
      if(div.innerText != '' && div.innerText != targetInnerHtml && totalNumber == 1) {
        letItBlink(div);
        //console.debug(div, 're-updated!');

        function letItBlink(styleEl) {
          styleEl.style.background = 'green';
          styleEl.style.transitionDuration = '2s';
          styleEl.addEventListener('transitioncancel', onFinished);
          styleEl.addEventListener('transitionend', onFinished);

          function onFinished(e) {
            e.target.style.transitionDuration = '0s';
            e.target.style.background = '';
            try {
              e.target.removeEventListener('transitioncancel');
              e.target.removeEventListener('transitionend');
            }
            catch(e) {
              console.debug('removing listeners failed on', e);
            }
          }
        }
      }

      div.innerHTML = targetInnerHtml;
    }
  }

  applySelectRuleIfAny(div, rule = null) {
    if(rule) {
      if(rule.numberToParent)
        for(let i = 0; i<rule.numberToParent; i++)
          div = div.parentNode;

      let root = div;
      if(rule.root)
        root = document.querySelector(rule.root);

      if(rule.selector)
        div = root.querySelector(rule.selector);
      else if(rule.root)
        div = root;
    }
    return div;
  }


  ////other publics
  imdbRun() {
    const otCache = GM_getValue('OT_CACHE_WITH_IMDB_RATINGS');

    let path = document.location.pathname;
    if(!path.startsWith('/title/') || path.endsWith('/episodes')) {
      toast.log();
      return;
    }

    const imdbId = path.split('/')[2];
    let imdbRating = document.querySelector('div[data-testid$="aggregate-rating__score"]>span[class]');
    if(imdbRating)
      imdbRating = parseFloat(imdbRating.textContent);
    else
      imdbRating = 'n/a';

    let orgTitle = document.title.replace(/ - IMDb$/, '');
    orgTitle = orgTitle.replace(/ \(TV Episode( (\d{4})\)|\))$/, '');

    //ex: \"The Kill Count\" Saw 3D (2010) (TV Episode 2018)
    //ex: \"Review It\" Spider-Man 2 (2004) (TV Episode)
    let trueYear;
    [orgTitle, trueYear] = orgTitle.split(' (');

    //ex1: \"We Eat Films\" Saw 3D (TV Episode 2010)
    //ex2: Majutsushi Orphen Mubouhen (TV Series 1998–1999)
    //ex3: Sorcerous Stabber Orphen (TV Series 2020– )
    //ex4: The Promised Neverland (TV Series)
    if(!trueYear || isNaN(parseInt(trueYear.slice(0, 4)))) {
      trueYear = document.title.replace(/ - IMDb$/, '').match(/(\d{4})(– |)\)$/)
      if(trueYear)
        trueYear = trueYear[1];
    }
    else
      trueYear = trueYear.slice(0, 4);

    const keys = Object.keys(otCache);
    const values = Object.values(otCache);
    const ids = values.map(el => el.imdbId);
    const orgTitles = values.map(el => el.orgTitle);
    const years = values.map(el => el.year);
    //const flags = values.map(el => el.imdbFlag);

    let idx = -1;
    if(imdbId && ids.includes(imdbId)) {
      idx = ids.indexOf(imdbId);
    }
    else {
      idx = orgTitles.indexOf(orgTitle);

      let newIdx = -1;
      if(idx > -1) {
        orgTitles.slice(idx).some((sTitle, i) => {
          if(sTitle == orgTitle && years[i] == trueYear) {
            //exact match
            newIdx = i;
            return true;  //break (take the first match)
          }
        });
      }
      else {
        orgTitles.some((sTitle, i) => {
          if(sTitle && sTitle.replace(/ - /g, '').replace(/ /g, '').toLowerCase() == orgTitle.replace(/ - /g, '').replace(/ /g, '').toLowerCase() && years[i] == trueYear) {
            //exact match (ignoring - & spaces and cases)
            newIdx = i;
            return true;  //break (take the first match)
          }
        });
      }

      if(newIdx == -1)
        idx = -1;
    }

    if(idx > -1) {
      let cache = otCache[keys[idx]];

      if(cache.imdbFlag != '') {
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
          if(cache.imdbUrl.startsWith('https://www.imdb.com/find?') || cache.imdbFlag == '??') {
            toast.log('updated the whole cache (id was not set or flag is ??) for '+orgTitle+' ('+trueYear+').');

            cache.imdbId = imdbId;
            if(path.endsWith('/'))
              path = path.slice(0, -1);
            cache.imdbUrl = 'https://www.imdb.com' + path;
            cache.year = trueYear;
          }
          else
            toast.log('rating (only) for '+orgTitle+' ('+cache.year+') was successfully updated and/or flag was unset on the cache.');

          cache.imdbRating = imdbRating;
        }
        cache.imdbFlag = '';

        cache.imdbRatingFetchedDate = new Date().toISOString();
        otCache[keys[idx]] = cache;
        GM_setValue('OT_CACHE_WITH_IMDB_RATINGS', otCache);
      }
      else if(imdbRating != cache.imdbRating) {
        if(cache.imdbRating == 'n/a') {
          toast.log('updated the whole cache (flag was not set) for '+orgTitle+' ('+trueYear+').');

          cache.imdbId = imdbId;
          if(path.endsWith('/'))
            path = path.slice(0, -1);
          cache.imdbUrl = 'https://www.imdb.com' + path;
          cache.year = trueYear;

          cache.imdbRating = imdbRating;
          cache.imdbRatingFetchedDate = new Date().toISOString();
          otCache[keys[idx]] = cache;
          GM_setValue('OT_CACHE_WITH_IMDB_RATINGS', otCache);
        }
        else if(imdbRating != 'n/a') {
          toast.log('imdb rating differs from the cache, so updating the cache rating (only) for '+orgTitle+' ('+cache.year+').');

          cache.imdbRating = imdbRating;
          cache.imdbRatingFetchedDate = new Date().toISOString();
          otCache[keys[idx]] = cache;
          GM_setValue('OT_CACHE_WITH_IMDB_RATINGS', otCache);
        }

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

  edit(el, type) {
    const otCache = GM_getValue('OT_CACHE_WITH_IMDB_RATINGS');  //exported earlier

    const rule = fy.selectRuleOnEdit;
    delete rule.selector;  //ignore 'selector'. should use 'idSelector' or 'titleSelector'.
    const probablyBaseEl = fy.applySelectRuleIfAny(el, rule);

    //determine single-page
    let needsSinglePageSeperateProcessing;
    if((rule?.determineSinglePageBy == true) || rule?.determineSinglePageBy == probablyBaseEl.tagName)
      needsSinglePageSeperateProcessing = true;

    const selectors = needsSinglePageSeperateProcessing ? rule.selectorsForSinglePage : rule.selectorsForListItems;

    //search id and title
    let trueId, trueUrl, trueTitle, otDatum;
    trueId = probablyBaseEl.querySelector(selectors.id)?.href.split('/').pop();
    if(trueId) {
      trueUrl = 'https://pedia.watcha.com/en-KR/contents/' + trueId;
      otDatum = fy.getObjFromWpId_(trueId);
    }

    const titleEl = probablyBaseEl.querySelector(selectors.title);
    trueTitle = titleEl?.textContent || titleEl?.alt || titleEl?.getAttribute('aria-label');
    if(!otDatum)
      otDatum = otCache[trueTitle] || {};

    //search target el (fyItem. the last element)
    const targetEl = probablyBaseEl.querySelector(selectors.targetEl);

    //get input
    let trueImdbId, trueImdbUrl;
    if(type == 'ot') {
      trueUrl = prompt("Enter proper Watcha Pedia url: ", otDatum.otUrl);
      if(!trueUrl)
        return;
      else if(!trueUrl.startsWith('https://pedia.watcha.com/')) {
        alert('Not a valid Watcha Pedia url. it should be "https://pedia.watcha.com/en-KR/contents/WP_CODE" format!');
        return;
      }
      trueUrl = trueUrl.trim().replace('/ko-KR/', '/en-KR/').replace(/\/\?.*$/, '').replace(/\/$/, '');
      if(!trueId)
        trueId = trueUrl.split('/').pop();

      if(trueUrl == otDatum.otUrl) {
        if(otDatum.otFlag != '') {
          toast.log('WP flag was reset (WP url is confirmed).');
          otDatum.otFlag = '';
        }
        else
          return;
      }
    }
    else if(type == 'imdb') {
      trueImdbUrl = prompt("First make sure that Watcha Pedia info is correct. If so, enter proper IMDb title url: ", otDatum.imdbUrl);
      if(!trueImdbUrl)
        return;
      else if(!trueImdbUrl.startsWith('https://www.imdb.com/title/')) {
        alert('Not a valid IMDb title url. it should be "https://www.imdb.com/title/IMDB_ID" format!');
        return;
      }
      trueImdbUrl = trueImdbUrl.trim().replace(/\/\?.*$/, '');
      trueImdbId = trueImdbUrl.replace('https://www.imdb.com/title/', '').replace('/', '');

      if(trueImdbUrl == otDatum.imdbUrl) {
        if(otDatum.imdbFlag != '') {
          toast.log('imdb flag was reset (imdb url is confirmed).');
          otDatum.imdbFlag = '';
        }
        else
          return;
      }
    }

    //change flow
    fy.observer.disconnect();
    fy.search([targetEl], {title: trueTitle, id: trueId, url: trueUrl, imdbId: trueImdbId, imdbUrl: trueImdbUrl});
  }

  xhrAbort() {
    fy.XHR.abort();
    fy.isFetching = false;
  }


  //more common utils
  async fetchAll(urls, headers = {}, delay = 0) {  //, order = false) {
    fy.isFetching = true;
    const results = [];

    //if(!order) {  //faster
    //https://lavrton.com/javascript-loops-how-to-handle-async-await-6252dd3c795/
    const promises = urls.map(async (url, i) => {
      results[i] = await fetchOne_(url, headers, delay);
    });
    await Promise.all(promises);

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


//common global util classes
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
  s.zIndex = '998';  //z-index on css is 999

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


//first init and run
unsafeWindow.fy = new FyGlobal();
fy.run();

/*
const fyTimerId = setInterval(() => {
  console.log('check')
  if(!fy.started) {
    console.log('done')
    unsafeWindow.fy = new FyGlobal();
    fy.run();
    clearInterval(fyTimerId);
  }
  else {
    console.log('done2')
    clearInterval(fyTimerId);
  }
}, 2000);
*/