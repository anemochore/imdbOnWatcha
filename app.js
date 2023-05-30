// ==UserScript==
// @name         imdb on watcha
// @namespace    http://tampermonkey.net/
// @version      0.4.85
// @updateURL    https://anemochore.github.io/imdbOnWatcha/app.js
// @downloadURL  https://anemochore.github.io/imdbOnWatcha/app.js
// @description  try to take over the world!
// @author       fallensky@naver.com
// @match        https://watcha.com/*
// @match        https://www.netflix.com/*
// @match        https://m.kinolights.com/*
// @match        https://www.wavve.com/*
// @match        https://www.disneyplus.com/ko-kr/*
// @match        https://www.imdb.com/title/*
// @resource     CSS https://anemochore.github.io/imdbOnWatcha/fy_css.css
// @require      https://anemochore.github.io/imdbOnWatcha/settings.js
// @require      https://anemochore.github.io/imdbOnWatcha/fixes.js
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @connect      pedia.watcha.com
// @connect      moviesdatabase.p.rapidapi.com

// ==/UserScript==


//singletons
const toast = new fadingAlert();
toast.log();


//global consts
const RAPID_API_HOST = 'moviesdatabase.p.rapidapi.com';

const RAPID_API_KEY = await GM_getValue('RAPID_API_KEY');
const DEFAULT_MSG = '입력하세요';

const GM_CACHE_KEY = 'OT_CACHE_WITH_IMDB_RATINGS';

const UPDATE_INTERVAL_DAYS_ORG_TITLES = 30;  //in days
const UPDATE_INTERVAL_DAYS_IMDB_VISITED = 7;  //in days


class FyGlobal {

  async run() {
    fy.site = document.location.host;

    //imdb 접속 시 캐시 업데이트
    if(fy.site == 'www.imdb.com') {
      fy.imdbRun();
      return;
    }

    if(!SETTINGS[fy.site])
      return;

    toast.log('fy script started.');
    //this.started = true;

    for(const [k, v] of Object.entries(SETTINGS[fy.site]))
      this[k] = v;

    this.handler = this.handlers[fy.site] || this.defaultHandler;
    this.preUpdateDivs = this.preUpdateDivses[fy.site] || this.defaultBaseElementProc;
    this.largeDivUpdate = this.largeDivUpdates[fy.site];
    this.search = this.searches[fy.site];

    //global vars & flags
    this.prevLocation = document.location;
    this.isFetching = false;
    this.indexCaches = [];
    this.keyCaches = [];

    //for this.edit()
    unsafeWindow.GM_getValue = GM_getValue;

    //캐시 없으면 생성
    const tempCache = await GM_getValue(GM_CACHE_KEY);
    if(!tempCache) {
      await GM_setValue(GM_CACHE_KEY, {});
    }
    else {
      //dirty fix
      let count = 0;
      for(const [k, v] of Object.entries(tempCache)) {
        if(typeof v.year == 'string') {
          tempCache[k].year = parseInt(v.year) || 'n/a';
          count++;
        }
      }
      if(count > 0) {
        await GM_setValue(GM_CACHE_KEY, tempCache);
        toast.log('cache fixed (string year to number year): ' + count);
      }
    }

    //to get the previous url. https://stackoverflow.com/a/52809105
    window.addEventListener('locationchange', e => {
      fy.entry(e);
    });

    history.pushState = (f => function pushState() {
      fy.prevLocation = document.location;
      var ret = f.apply(this, arguments);
      window.dispatchEvent(new Event('pushstate'));
      window.dispatchEvent(new Event('locationchange'));
      return ret;
    })(history.pushState);

    history.replaceState = (f => function replaceState() {
      fy.prevLocation = document.location;
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
      await GM_setValue('RAPID_API_KEY', DEFAULT_MSG);
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
    fy.observer.disconnect();
    console.debug('observer disconncted on entry()!');

    fy.root = document.querySelector(fy.rootSelector);
    const curLocation = document.location;

    //ignoring # or ?mappingSource... at the end
    if(fy.isFetching && (
      (fy.largeDivSamePathName && fy.prevLocation.href != curLocation.href) ||
      (!fy.largeDivSamePathName && fy.prevLocation.origin+fy.prevLocation.pathname != curLocation.origin+curLocation.pathname))) {
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
      let selector = fy.selector || '';
      if(fy.selectorOnLargeDiv)
        selector += ', ' + fy.selectorOnLargeDiv;
      if(fy.selectorOnSinglePage)
        selector += ', ' + fy.selectorOnSinglePage;
      selector = selector.replace(/^, /, '');

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

  defaultHandler = async (m, o) => {
    fy.observer.disconnect();

    if(fy.selectorsForSinglePage.determinePathnameBy && document.location.pathname.startsWith(fy.selectorsForSinglePage.determinePathnameBy)) {
      let largeDiv = fy.root.querySelector('['+FY_UNIQ_STRING+']');
      if(largeDiv) {
        //if already updated, no more update when scrolling, etc
        console.info('large-div already updated.');
        toast.log();
        fy.observer.observe(fy.root, fy.observerOption);
        return;
      }

      largeDiv = fy.root.querySelector(fy.selectorsForSinglePage.targetEl);
      if(!largeDiv) {
        console.info('waiting for large-div...');
        largeDiv = await elementReady(fy.selectorsForSinglePage.targetEl, fy.root);
      }

      fy.largeDivUpdate(largeDiv);
    }
    else {
      fy.handlerWrapUp(fy.selectorsForListItems);
    }
  };

  handlers = {
    'm.kinolights.com': async () => {
      //fy.observer.disconnect();
      fy.isFetching = false;  //hack for kino

      const largeDiv = document.querySelector(fy.selectorOnSinglePage);
      if(largeDiv)
        fy.largeDivUpdate(largeDiv);
    },

    'www.netflix.com': async (m, o) => {
      fy.observer.disconnect();

      let largeDiv = fy.root.querySelector(fy.selectorsForLargeDiv.year);
      if(largeDiv) {
        //이미 페이지는 로딩된 상태. single-page는 대부분 이 경우일 것 같은데??
        largeDiv = fy.root.querySelector(fy.selectorOnLargeDiv);
        if(largeDiv) {
          //업데이트를 안 했을 때만 업데이트
          const selectors = fy.selectorsForLargeDiv;
          const baseEl = fy.getParentsFrom_(largeDiv, fy.numberToBaseEl);
          await elementReady(selectors.title, baseEl);  //title이 img라 늦게 로딩됨
        }
      }
      /*
      else if(document.location.pathname.startsWith('/title/')) {
        //single-page에서 로딩이 안 됐다고?? 이 경우는 안 일어나는 것 같다...
        await elementReady(fy.selectorsForLargeDiv.year, fy.root);
        largeDiv = fy.root.querySelector(fy.selectorOnLargeDiv);
        console.debug('largeDiv after wait1', largeDiv);
      }
      */
      else if(m) {
        //large-div on list-items
        if(m.filter(el => el.addedNodes).map(el => [...el.addedNodes]).flat().map(el => el.className).includes('match-score-wrapper')) {
          const largeDiv2 = fy.root.querySelector(fy.selectorOnLargeDiv);  //assuming it exists
          if(fy.observer2) {
            fy.observer2.disconnect();
            fy.observer2 = null;
          }
          console.debug('an additional observer added.');
          fy.observer2 = new MutationObserver(fy.handler);
          fy.observer2.observe(largeDiv2, {attributes: true});
        }
        else if(m.map(el => el.attributeName).includes('style')) {
          fy.observer2.disconnect();
          fy.observer2 = null;
          largeDiv = await elementReady(fy.selectorOnLargeDiv, fy.root);
          console.debug('the additional observer disconnecteded and large-div loaded');
        }
      }

      if(largeDiv)
        fy.largeDivUpdate(largeDiv);
      else
        fy.handlerWrapUp(fy.selectorsForListItems);
    },
  };

  handlerWrapUp = (selectors) => {
    const itemDivs = [...fy.root.querySelectorAll(fy.selector)];
    const itemNum = itemDivs.length;
    if(itemNum > 0) {
      fy.search(itemDivs, {selectors});
    }
    else {
      //nothing to do
      toast.log();
      fy.observer.observe(fy.root, fy.observerOption);
    }
  };

  largeDivUpdates = {
    'watcha.com': (largeDiv) => {
      //on single content (=large div) page
      const selectors = fy.selectorsForSinglePage;

      const id = fy.getIdFromValidUrl_((fy.getParentsFrom_(largeDiv, fy.selectorsForSinglePage.numberToBaseEl).querySelector(fy.selectorsForSinglePage.id) || document.location).href);
      console.debug('id on largeDivUpdates', id);
      const url = fy.getUrlFromId_(id);

      fy.largeDivUpdateWrapUp(largeDiv, {selectors, id, url});
    },

    'm.kinolights.com': (largeDiv) => {
      //on single content page
      const selectors = fy.selectorsForSinglePage;

      const orgTitle = fy.getTextFromNode_(largeDiv.querySelector(selectors.orgTitle)).replace(/ ·$/, '');
      const year = parseInt(fy.getTextFromNode_(largeDiv.querySelector(selectors.year)));

      fy.largeDivUpdateWrapUp(largeDiv, {selectors, orgTitle, year});
    },

    'www.netflix.com': (largeDiv) => {
      //on large div (=single content) page
      const selectors = fy.selectorsForLargeDiv;
      const baseEl = fy.getParentsFrom_(largeDiv, fy.numberToBaseEl);

      const year = parseInt(fy.getTextFromNode_(baseEl.querySelector(selectors.year)));

      fy.largeDivUpdateWrapUp(largeDiv, {selectors, year});
    },

    'www.wavve.com': async (largeDiv) => {
      //on large div (=single content) page
      const selectors = fy.selectorsForSinglePage;
      const baseEl = fy.getParentsFrom_(largeDiv, fy.numberToBaseEl);

      //제목이 lazy loading인데 귀찮으니 메타에서 가져온다.
      const titleSelector = 'meta[data-vue-meta="ssr"][property="og:title"]';
      const title = (await elementReady(titleSelector, document.head)).content.replace(/^\[wavve\]/, '');

      fy.largeDivUpdateWrapUp(largeDiv, {selectors, title});
    },

    'www.disneyplus.com': (largeDiv) => {
      //todo+++
    }
  };

  largeDivUpdateWrapUp = async (largeDiv, trueData) => {
    const baseEl = fy.getParentsFrom_(largeDiv, trueData.selectors.numberToBaseEl || fy.numberToBaseEl);
    const type = fy.getTypeFromDiv_(trueData.selectors, baseEl);
    trueData.type = type;

    let sEl = baseEl.querySelector('div.'+FY_UNIQ_STRING);
    let otFlag, imdbFlag;
    if(sEl) {
      //already updated (maybe)
      otFlag = sEl.querySelector('.fy-external-site')?.getAttribute('flag');
      imdbFlag = sEl.querySelector('.fy-imdb-rating')?.getAttribute('flag');
    }
    else {
      //not yet updated (first loading)
      if(trueData.id) {
        const cache = await fy.getObjFromWpId_(trueData.id);
        otFlag = cache.otFlag;
        imdbFlag = cache.imdbFlag;
      }
    }

    //ot 플래그가 ?/??이거나 imdb 플래그가 ?/??면 다시 검색. 혹은 아직 업데이트가 안 됐더라도.
    if(otFlag != '' || imdbFlag != '' || !sEl) {
      toast.log('large div on single-page update triggered...');
      await fy.search([largeDiv], trueData);
    }
    else {
      console.debug('nothing to do on large-div update.');
      toast.log();
    }
  };

  defaultBaseElementProc = (itemDivs, numberToBaseEl) => {
    itemDivs.forEach((item, i) => {
      const baseEl = fy.getParentsFrom_(item, numberToBaseEl);

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
      const baseEl = fy.getParentsFrom_(itemDivs[0], fy.numberToBaseEl);
      const el = baseEl.querySelector(fy.selectorsForSinglePage.targetEl);
      el.setAttribute(FY_UNIQ_STRING, '');
      el.classList.add(FY_UNIQ_STRING);  //this is not wokring!
    },
  };

  async searchById(itemDivs, trueData = {year: null, type: null, id: null, url: null, imdbId: null, imdbUrl: null, orgTitle: null, title: null, type: null, forceUpdate: false, selectors: {}}) {
    const otCache = await GM_getValue(GM_CACHE_KEY);

    let otData = [];
    let allTitles = Array(itemDivs.length).fill(null);  //all titles. 왓챠에선 wp 검색에 쓰이지는 않는다.
    let ids = Array(itemDivs.length).fill(null);        //titles to scrape

    fy.preUpdateDivs(itemDivs, fy.numberToBaseEl);

    const selectors = trueData.selectors;
    itemDivs.forEach((item, i) => {
      const baseEl = fy.getParentsFrom_(item, trueData.selectors.numberToBaseEl || fy.numberToBaseEl);

      let title;
      if(trueData.title)
        title = trueData.title;
      else 
        title = fy.getTextFromNode_(baseEl.querySelector(selectors.title));
      allTitles[i] = title;

      //일단 캐시에 제목이 있다면 그게 뭐든 div 업데이트에는 사용한다.
      otData[i] = otCache[title] || {};

      console.log('trueData.id:', trueData.id);
      let id;
      if(trueData.forceUpdate || trueData.id) {
        //수동 업데이트 또는 large-div 등 true type을 알 때
        id = trueData.id;
        console.debug('got id (1):', id, baseEl, selectors.id);
      }
      else if(otData[i].id) {
        //그 밖의 경우는 캐시를 우선시. 시즌 1로 id가 변경되었을 수 있으니까.
        //또 tv 물의 경우 2화 링크(이어보기)가 떠 있을 수도 있으니까.
        id = fy.useCacheIfAvailable_(otData[i].id, otData[i]);  //캐시에 있으면 null이고 페칭하지 않음.
      }

      if(id) {
        ids[i] = id;
        otData[i].id = id;
        otData[i].otUrl = fy.getUrlFromId_(id);
      }

      if(trueData.type && !otData[i].type) {
        //true type이 있는데 캐시에 type 정보가 없다면 저장한다. large-div 업데이트 시에.
        otData[i].type = trueData.type;
        console.debug('type (large):', trueData.type);
      }
      else {
        //리스트에도 type이 있으면 이용한다.
        let type = fy.getTypeFromDiv_(trueData.selectors, item);
        console.debug('type (list):', type);
        if(type)
          otData[i].type = type;
      }

      otData[i].query = title;

      otData[i].otFlag = '';
      if(trueData.imdbId) {  //imdb id가 url보다 우선함(url은 id에서 파생되므로)
        otData[i].imdbId = trueData.imdbId;
        otData[i].imdbUrl = trueData.imdbUrl;
        otData[i].imdbFlag = '';
      }
    });

    //start searching
    //찾을 제목에 대해 내부 캐시 적용.
    console.log(ids);
    let searchLength = fy.setInternalCache_(ids, otData);

    if(searchLength == 0) {
      console.log(`nothing to search or scrape on wp.`);
      fy.searchImdbAndWrapUp_(itemDivs, otData, trueData, allTitles);
      return;
    }

    if(!trueData.imdbId && !trueData.orgTitle) {
      toast.log('scraping org. titles for ' + searchLength + ' items...');  //no search needed
      const otScrapeResults = await fy.fetchAll(ids.map((id, i) => id ? otData[i].otUrl : null), {
        headers: {'Accept-Language': 'en-KR'},
      });
      searchLength = otScrapeResults.filter(el => el).length;

      if(searchLength == 0) {
        console.log(`org. titles scraping result is empty.`);
        fy.searchImdbAndWrapUp_(itemDivs, otData, trueData, allTitles);
        return;
      }

      await fy.parseWpScrapeResults_(otScrapeResults, otData, allTitles, true);
      console.log(`org. titles scraping done: ${searchLength}`);
    }
    fy.searchImdbAndWrapUp_(itemDivs, otData, trueData, allTitles);
  }

  async searchByTitle(itemDivs, trueData = {year: null, type: null, id: null, url: null, imdbId: null, imdbUrl: null, orgTitle: null, title: null, type: null, forceUpdate: false, selectors: {}}) {
    const otCache = await GM_getValue(GM_CACHE_KEY);

    let otData = [];
    let allTitles = Array(itemDivs.length).fill(null);  //all titles
    let titles = Array(itemDivs.length).fill(null);     //titles to search

    fy.preUpdateDivs(itemDivs, trueData.selectors.numberToBaseEl || fy.numberToBaseEl);

    //get titles
    itemDivs.forEach((item, i) => {
      const baseEl = fy.getParentsFrom_(item, fy.numberToBaseEl);

      let title = trueData.title;
      if(!title && baseEl)
        title = fy.getTextFromNode_(baseEl.querySelector(trueData.selectors.title));
      if(!title) {
        console.warn('no title found on', item);
        console.debug('title selector:', trueData.selectors.title);
        return;
      }

      /*
      //아직 지원하는 사이트 없음. 웨이브 /my 루트에 표시되긴 하는데 귀찮다.
      let type = fy.getTypeFromDiv_(trueData.selectors, baseEl);
      console.debug('type (by title)', type);
      if(type)
        otData[i].type = type;
      */

      allTitles[i] = title;

      //일단 캐시에 있다면 그 정보가 뭐든 div 업데이트에는 사용한다.
      otData[i] = otCache[title] || {};  //referenced-cloning is okay.

      if(!trueData.forceUpdate)
        titles[i] = fy.useCacheIfAvailable_(title, otData[i], trueData);
      else 
        titles[i] = title;

      otData[i].query = title;
    });


    //large div update
    if(trueData.year && trueData.type != 'TV Series' && trueData.type != 'TV Mini Series') {
      //TV물이면 연도를 수정하지 않음
      if(otData[0].otFlag != '' || !otData[0].year)
        otData[0].year = trueData.year;
    }

    //large div update or wp manual update
    if(trueData.id) {
      otData[0].id = trueData.id;
      otData[0].otUrl = trueData.url;
      otData[0].otFlag = '';
    }

    //imdb manual update (edit)
    if(trueData.imdbId) {
      otData[0].imdbUrl = trueData.imdbUrl;
      otData[0].imdbFlag = '';
      trueData.id = fy.getIdFromValidUrl_(otData[0].otUrl);  //when edit imdb url, don't search wp (assuming it's the right one)
    }

    //kino update
    if(trueData.orgTitle) {
      otData[0].orgTitle = trueData.orgTitle;
    }

    //찾을 제목에 대해 내부 캐시 적용.
    let searchLength = fy.setInternalCache_(titles, otData);

    if(searchLength == 0) {
      console.log(`nothing to search or scrape on wp.`);
      fy.searchImdbAndWrapUp_(itemDivs, otData, trueData, allTitles);
      return;
    }
    else if(!trueData.id) {
      //목록 업데이트
      const PREFIX = 'https://pedia.watcha.com/ko-KR/search?query=';
      //왓챠피디아는 .을 없애야 함... 왜죠? 예: 0.0MHz
      const otSearchResults = await fy.fetchAll(titles.map(title => title ? PREFIX + encodeURIComponent(title.replace(/\./g, '')) : null), {
        headers: {'Accept-Language': 'ko-KR'},
      });
      await fy.parseWpSearchResults_(otSearchResults, otData, trueData, titles);
      searchLength = otSearchResults.filter(el => el).length;
      if(searchLength == 0) {
        console.log(`org. titles searching result is empty.`);
        fy.searchImdbAndWrapUp_(itemDivs, otData, trueData, allTitles);
        return;
      }
      else {
        console.log(`org. titles searching done (or passed): ${searchLength}`);
      }
    }

    //수동 업데이트 시에는 무조건 스크레이핑
    if((!trueData.id && !trueData.orgTitle) || trueData.forceUpdate) {
      toast.log('scraping org. titles...');
      const otScrapeResults = await fy.fetchAll(titles.map((title, i) => {
        //bug of ~v0.4.68
        if(title) {
          if(otData[i]?.otUrl?.endsWith('pedia.watcha.comnull')) {
            console.debug('cleared wrong wp url. :(');
            otData[i].otUrl = null;
            return null;
          }

          if(otData[i].otUrl)
            return otData[i].otUrl;
        }
        return null;
      }),
      {
        headers: {'Accept-Language': 'en-KR'},
      });
      searchLength = otScrapeResults.filter(el => el).length;

      if(searchLength == 0) {
        console.log(`org. titles scraping result is empty.`);
        fy.searchImdbAndWrapUp_(itemDivs, otData, trueData, allTitles);
        return;
      }

      console.log(`org. titles scraping done: ${searchLength}`);
      await fy.parseWpScrapeResults_(otScrapeResults, otData, allTitles);
    }

    fy.searchImdbAndWrapUp_(itemDivs, otData, trueData, allTitles);
  }

  searches = {
    'm.kinolights.com': this.searchByTitle,
    'www.netflix.com': this.searchByTitle,
    'www.wavve.com': this.searchByTitle,
    'www.disneyplus.com': this.searchByTitle,

    'watcha.com': this.searchById,
  };

  //utils used in editing
  async getObjFromWpId_(id) {
    const otCache = await GM_getValue(GM_CACHE_KEY);
    const cacheTitles = Object.keys(otCache);
    const cacheIds = Object.values(otCache).map(el => el.otUrl ? fy.getIdFromValidUrl_(el.otUrl) : null);

    const idIndex = cacheIds.indexOf(id);
    if(idIndex > -1) {
      const title = cacheTitles[idIndex];
      //return {[title]: otCache[title]};
      return otCache[title];
    }
    else
      return {};
  }

  //other utils...
  useCacheIfAvailable_(value, cache, trueData = {}) {
    //캐시에 원제가 있다면 캐시 사용 대상. wp 검색에만 쓰인다. 캐시를 쓴다면 null 반환.
    if(cache?.orgTitle) {  // && cache?.imdbRating) {
      //단, 캐시가 오래되었다면 다시 페칭.
      if(dateDiffInDays(new Date(), new Date(cache.imdbRatingFetchedDate)) > UPDATE_INTERVAL_DAYS_ORG_TITLES) {
        console.debug(`cache for ${value} is over than ${UPDATE_INTERVAL_DAYS_ORG_TITLES} days. so updating now...`);
        return value;
      }
      else if(cache.otFlag != '' && trueData.year) {
        //ot flag가 있고 large-div 업데이트라면 페칭해본다. title 검색 시에만 해당
        return value;
      }
      else {
        console.debug(`cache for ${value} will be used: ${cache.orgTitle} (${cache.year})`);
        return null;
      }
    }
    else {
      //캐시에 없다면 당연히 페칭
      return value;
    }
  }

  setInternalCache_(arr, otData) {
    //똑같은 검색어가 여러 개라면 내부 캐싱(앞에 똑같은 검색어가 있다면 뒤에 나오는 애는 캐싱)
    //otData를 직접 수정
    arr.slice(1).forEach((title, i) => {
      if(title) {
        const prevIdx = arr.slice(0, 1+i).indexOf(title);
        if(prevIdx > -1) {
          fy.indexCaches[1+i] = String(prevIdx);  //to use with filter
          fy.keyCaches[1+i] = otData[1+i].query;
          arr[1+i] = null;
          otData[1+i] = {};
        }
      }
    });

    return arr.filter(el => el).length;
  }

  getInternalCache_(otData) {
    //내부 캐시 반영
    //otData를 직접 수정
    if(fy.indexCaches.filter(el => el).length == 0)
      return;

    console.debug('internal cache used for ' + fy.indexCaches.filter(el => el).length + ' titles');
    fy.indexCaches.forEach((cacheIndex, i) => {
      if(cacheIndex) {
        otData[i] = {...otData[cacheIndex]};
        otData[i].query = fy.keyCaches[i];
      }
    });
  }


  //parsing and scraping funcs
  async parseWpSearchResults_(results, otData, trueData, titles, needsEngSearch = false) {
    for await(const [i, result] of results.entries()) {
      const title = titles[i];
      if(!result) {
        if(title) {
          console.warn('search for',title,'on wp failed! no result at all!');
          otData[i].otFlag = '??';
        }
        continue;  //continue
      }

      let movieString = '영화', tvString = 'TV 프로그램';
      const targetDoc = new DOMParser().parseFromString(result, 'text/html');
      if(targetDoc.documentElement.lang != 'ko-KR') {
        console.debug('wp loaded in not Korean (ko-KR). so exact match is not possible for',title);
        otData[i].otFlag = '?';
        movieString = 'Movies', tvString = 'TV Shows';
      }

      //to update cache
      otData[i].query = title;

      //to make selecting easier
      [...targetDoc.querySelectorAll('style[data-emotion-css]')].forEach(el => {
        el.remove();
      });

      const selector = 'div[class*="StyledTabContentContainer"] section>section ';
      let sDivs = [...targetDoc.querySelectorAll(selector)];

      //최상위 섹션, 영화, TV 프로그램만 처리
      let sUrls = [], sTitles = [], sYears = [], sTypes = [];
      sDivs.forEach((sDiv, j) => {
        const header = sDiv.querySelector('header>h2');
        //첫 번째(최상위) 섹션은 헤더가 없음
        let info;
        if(!header && j == 0) {
          info = [...sDiv.querySelectorAll('ul>li>a>div:last-child')];
          sUrls.push(...info.map(el => el.parentNode.getAttribute("href")));  //no .href
          sTypes.push(...info.map(el => el.lastChild.innerText).map(el => getType_(el)));
        }
        else if(header.innerText == movieString || header.innerText == tvString) {
          info = [...sDiv.querySelectorAll('ul>li>a>div:last-child>div[class]')];
          sUrls.push(...info.map(el => el.parentNode.parentNode.getAttribute("href")));  //no .href
          sTypes.push(...Array(info.length).fill(header.innerText).map(el => getType_(el)));
        }

        function getType_(str) {
          if(str == movieString)   return 'Movie';
          else if(str == tvString) return 'TV Series';
          else                    return null;
        }

        if(info) {
          info = info.map(el => [...el.childNodes]);
          sTitles.push(...info.map(el => el[0].innerText));
          sYears.push(...info.map(el => el[1].innerText.split(' ・ ')[0]));
          if(!sTypes[sYears.length-1]) {
            sTypes.push(...info.map(el => {
              const typeText = el[2]?.innerText;
              if(typeText)
                return getType_(typeText);
            }));
          }
        }
      });

      //영화나 TV 프로그램이 아니면 제외. 중복 항목(url이 프라이머리 키)도 제외
      for(let j=0; j < sUrls.length; j++)
        if((sTypes[j] != 'Movie' && sTypes[j] != 'TV Series') || sUrls.slice(0, j).includes(sUrls[j]))
          sUrls[j] = sTitles[j] = null;

      if(sUrls.length == 0) {
        console.warn(title, 'seems not found on wp!');
        //console.debug(targetDoc.documentElement.outerHTML);
        console.debug('check this url: https://pedia.watcha.com' + targetDoc.head.querySelector('link[href^="/ko-KR/search?query="]').getAttribute('href'));  //no .href
        otData[i].otFlag = '??';
        continue;  //continue
      }
      sUrls = sUrls.map(el => el ? 'https://pedia.watcha.com' + el : null);

      let idx = -1, firstNotNullIdx = -1, exactMatchCount = 0, idxForSeason1, possibleIdx;
      sTitles.forEach((sTitle, j) => {
        if(sTitle) {
          let found = false;
          if((!trueData.type || (trueData.type == 'TV Series' && sTypes[j] == 'TV Series')) && !title.startsWith('극장판 ')) {
            //TV물이면(혹은 type을 아예 모르면) 제목이 일치하거나 '시즌 1' 등 붙인 거랑 일치해야 함(연도 무관!).
            if(sTitle == title || sTitle == title + ' 시즌 1' || sTitle == title + ' Season 1' || sTitle == title + ' 1기' || (trueData.type == 'TV Series' && sTitle == title + ' 1')) {
              found = true;
            }
            else if(sTitle.endsWith(' 시즌 1') || sTitle.endsWith('Season 1') || sTitle.endsWith(' 1기'))
              if(!idxForSeason1)
                idxForSeason1 = j;
          }
          else {
            if(sTitle == title) {
              //TV물이 아니면 제목이 일치해야 함. trueYear가 있다면 아이템의 연도와도 일치해야 함.
              found = true;
              if(trueData.year && trueData.year != sYears[j])
                found = false;
            }
            else if(trueData.year == sYears[j]) {
              //제목이 일치하는 게 없으면 연도 일치하는 거라도 건지자... 첫 번째만.
              if(!possibleIdx)
                possibleIdx = j;
            }
          }

          if(found) {
            if(idx == -1) {
              idx = j;
              otData[i].otFlag = '';
            }
            exactMatchCount++;
          }
        }
      });
      const titleForWarning = `${title} (trueYear: ${trueData.year}, trueType: "${trueData.type}")`;
      if(exactMatchCount > 1) {
        needsEngSearch = false;
        console.warn(`${exactMatchCount} multiple exact matches for ${titleForWarning} found on wp. so taking the first result: ${sTitles[idx]}`);
        otData[i].otFlag = '?';
      }
      else if(idx == -1) {
        if(!isNaN(parseInt(idxForSeason1))) {
          needsEngSearch = false;
          idx = idxForSeason1;
          if(!trueData.type) {
            idx = 0;
            console.warn(`${titleForWarning} is maybe TV series. so taking the first result with 'season 1': ${sTitles[idx]}`);
            otData[i].otFlag = '?';
          }
        }
        else {
          if(needsEngSearch) {
            //영어 페이지 검색해도 결과 없음(영어 페이지에도 제목은 한국어로 나오므로 정확한 비교는 불가능)
            needsEngSearch = false;

            if(possibleIdx) {
              idx = possibleIdx;
              console.warn(`${titleForWarning} seems not found on wp among many (or one). so just taking the first result with the same date: ${sTitles[idx]}`);
              otData[i].otFlag = '?';
            }
            else {
              idx = 0;
              console.warn(`${titleForWarning} seems not found on wp among many (or one) and Eng-page-searching yields no match either. so just taking the first result: ${sTitles[idx]}`);
              if(sTitles.filter(el => el).length == 1) otData[i].otFlag = '?';
              else otData[i].otFlag = '??';
            }
          }
          else {
            //검색 결과 없음. 아직 영어 페이지 검색은 안 했지만...
            if(!trueData.orgTitle) {
              //원제가 없다면 영어 페이지 검색도 불가능
              idx = 0;
              console.warn(`${titleForWarning} seems not found on wp among many (or one) and Eng-page-searching is not possible (no org title). so just taking the first result: ${sTitles[idx]}`);
              if(sTitles.filter(el => el).length == 1) otData[i].otFlag = '?';
              else otData[i].otFlag = '??';
            }
            else {
              //원제가 있다면(키노) 원제로 영어 페이지 재검색
              console.warn(`${titleForWarning} seems not found on wp among many (or one). so re-searching Eng-page with org title: ${trueData.orgTitle}...`);

              const titlesforEngSearch = [];
              titlesforEngSearch[i] = trueData.orgTitle;

              const ENG_SEARCH_PREFIX = 'https://pedia.watcha.com/en-KR/search?query=';
              const engOtSearchResults = await fy.fetchAll(titlesforEngSearch.map(title => title ? ENG_SEARCH_PREFIX + encodeURIComponent(title.replace(/\./g, '')) : null), {
                headers: {'Accept-Language': 'en-KR'},  //헤더가 안 먹히는지 한국어로 나오므로 원제 비교는 불가능...
              });
              needsEngSearch = true;
              await fy.parseWpSearchResults_(engOtSearchResults, otData, trueData, titlesforEngSearch, needsEngSearch);
            }
          }
        }
      }
      else {
        //검색 결과 있음
        needsEngSearch = false;
      }

      if(!needsEngSearch) {
        const id = fy.getIdFromValidUrl_(sUrls[idx]);
        otData[i].id = id;
        otData[i].otUrl = fy.getUrlFromId_(id);
        otData[i].type = sTypes[idx];
      }
    }
  }

  async parseWpScrapeResults_(results, otData, allTitles, needToGetSeason1 = false) {
    let toReSearch = [], localResults = results.slice();

    const END_COUNT = 33;  //The Simpsons (as of 2022-4-29)
    let count = 1;
    while(count < END_COUNT) {
      count++;

      localResults.forEach((result, i) => {
        if(!result)  //아예 찾을 필요가 없는 애들
          return;  //continue

        let targetDoc = new DOMParser().parseFromString(result, 'text/html');

        let [orgTitle, tempYear] = targetDoc.title
        .replace(/ - Watcha Pedia$/, '').replace(/ - 왓챠피디아$/, '').replace(/\)$/, '').split(' (');
        const oldTitle = orgTitle;

        let loadedInEnglish = true;
        if(targetDoc.documentElement.lang != 'en-KR') {
          console.debug('wp loaded in not English (en-KR). exact match may not possible if the org. title is non-English:', orgTitle);
          loadedInEnglish = false;
        }

        //wp는 원제를 따로 표시한다. 근데 imdb 가이드에 따르면 제목은 iso-8859-1만 쓴다.
        //출처: https://help.imdb.com/article/contribution/titles/title-formatting/G56U5ERK7YY47CQB#
        const possibleRealOrgTitle = targetDoc.querySelector('div[class*="-Summary"]')?.firstChild.textContent;  //innerText 아님
        if(possibleRealOrgTitle && orgTitle != possibleRealOrgTitle) {
          if(isAllLatinChars(possibleRealOrgTitle) || !loadedInEnglish)
            orgTitle = possibleRealOrgTitle;

          function isAllLatinChars(str) {
            //https://stackoverflow.com/a/32851131/6153990
            return !/[^\u0000-\u00ff]/g.test(str);
          }
        }

        const seriesH2 = [...targetDoc.querySelectorAll('header>h2')].filter(el => el.innerText == 'Series');
        if(seriesH2.length > 0)
          otData[i].type = 'TV Series';

        let found = false;
        if(needToGetSeason1) {
          //wp id search
          let newId, newUrl;
          if(otData[i].type == 'TV Series') {
            let possibleSeason = oldTitle.match(/ Season ([0-9]+)$/);
            if((!possibleSeason && seriesH2.length == 0) || (possibleSeason && parseInt(possibleSeason[1]) == 1)) {
              //'시즌 2' 식으로 안 끝나고 하단에 다른 시리즈 정보도 없다면, 혹은 시즌 1이라면.
              toReSearch[i] = null;
              found = true;
            }

            if(!found) {
              const seriesSection = seriesH2[0].parentNode.parentNode.parentNode.parentNode;
              const season1div = [...seriesSection.querySelectorAll('ul>li div[class*="StyledText"]')].filter(el => el.innerText.endsWith(' Season 1'));
              if(season1div.length > 0) {
                newId = fy.getIdFromValidUrl_(season1div[0].parentNode.parentNode.parentNode.href);
                newUrl = fy.getUrlFromId_(newId);
                console.log(`found season 1 url for ${orgTitle}: ${newId}. will be re-scraped...`); 

                found = true;
                otData[i].id = newId;
                otData[i].otUrl = newUrl;
                toReSearch[i] = newUrl;
              }
            }

            if(!found) {
              console.warn('cannot find season 1 when scraping on', newUrl ? newUrl + ' on ' + otData[i].otUrl : otData[i].otUrl);
              console.debug(targetDoc.documentElement.outerHTML);
              otData[i].otFlag = '?';
            }
          }
        }

        if(orgTitle == '' || !tempYear) {
          console.debug('scraping failed on', otData[i].otUrl);
          otData[i].otFlag = '???';  //왓챠 '이어보기' 항목
          toReSearch[i] = null;

          return;  //continue
        }

        otData[i].orgTitle = orgTitle;  //여기선 원제 뒤에 시즌 1 붙은 걸 굳이 바꾸지 않음. 뒤에서 바꿈.
        otData[i].year = parseInt(tempYear);
      });

      if(toReSearch.filter(el => el).length == 0)
        break;  //for while

      localResults = await fy.fetchAll(toReSearch), {
        headers: {'Accept-Language': 'en-KR'},
      };
    }  //of while
  }

  async searchImdbAndWrapUp_(itemDivs, otData, trueData, allTitles) {
    const HEADERS = {
      'x-rapidapi-key': RAPID_API_KEY,
      'x-rapidapi-host': RAPID_API_HOST,
    };
    const FETCH_INTERVAL = 0;  //dev. seems ok.

    //원제 찾을 때 내부 캐시 사용했으면 일단 여기서 캐시 사용 해제.
    fy.getInternalCache_(otData);

    //imdb id나 평점이 없으면 imdb 찾음.
    //혹은 trueYear/trueId/trueImdbId이 있어도 이 배열에 넣고 실제로 찾지는 않음.
    const otDataFiltered = otData.map(el => (!el.imdbId || !el.imdbRating || trueData.year || trueData.id || trueData.imdbId) ? el : {});
    const orgTitles = otDataFiltered.map(el => el.orgTitle);
    const years = otDataFiltered.map(el => el.year);
    const types = otDataFiltered.map(el => el.type);

    let imdbData = [], newImdbData = [];
    let imdbResults = [], searchLength;

    //검색 전 제목 정리
    orgTitles.forEach((title, i) => {
      if(title) {
        const oldTitle = title;

        //드라마의 경우, 시즌 텍스트 치환
        const strsToReplace = [
          [/ Season (\d+)$/, ''],
        ];
        strsToReplace.forEach(str => {
          const t = title.match(str[0]);
          if(t) {
            orgTitles[i] = title.replace(str[0], str[1]);
          }
        });

        if(oldTitle != orgTitles[i]) {
          otData[i].orgTitle = orgTitles[i];
        }
      }
    });

    let imdbPrefix = 'https://' + RAPID_API_HOST + '/titles/search/title/';
    let imdbSuffix = '?info=base_info';

    //물론, 원제가 있는 애들만 찾는다. 없으면 못 찾지.
    //wp는 movie와 video를 구분하지 않고, tv 시리즈와 tv 미니 시리즈도 못 구분하니 타입은 패스...
    let filtered = orgTitles.map((orgTitle, i) => 
      orgTitle ? imdbPrefix + encodeURIComponent(orgTitles[i]) + imdbSuffix + '&year=' + years[i] + '&exact=true' + fy.getTypeString_(types[i])
      : null);
    searchLength = filtered.filter(el => el).length;

    if(searchLength == 0) {
      console.log(`nothing to search on imdb.`);
      searchLength = -1;
    }
    else if(!trueData.imdbId) {
      //여기서도 내부 캐시 적용. rating만 구할 때도 쓰고 싶은데 그건 코드가 꼬여서 안 되겠다...
      searchLength = fy.setInternalCache_(filtered, otData);

      toast.log('now searching infos and/or ratings on imdb for',searchLength,'items...');
      imdbResults = await fy.fetchAll(filtered, HEADERS, FETCH_INTERVAL);
      searchLength = imdbResults.filter(el => el).length;
    }

    if(searchLength == 0) {
      console.log(`imdb searching result is empty.`);
    }
    else if(searchLength > 0) {
      if(!trueData.imdbId) {
        console.log(`imdb searching possibly done: ${searchLength}`);
        imdbData = await parseImdbResults_('search', imdbResults, imdbData);

        filtered = await searchAgainIfNeeded_(imdbResults, imdbData, filtered);
      }
      else {
        imdbPrefix = 'https://' + RAPID_API_HOST + '/titles/';  //왓챠 large-div라면 바로 ratings 엔드포인트 사용
        filtered = [imdbPrefix + trueData.imdbId + '/ratings'];
        otData[0].imdbId = trueData.imdbId;
        imdbData = [otData[0]];
      }

      searchLength = filtered.filter(el => el).length;
      if(searchLength == 0) {
        console.log(`nothing to scrape ratings on imdb.`);
      }
      else {
        toast.log('not all ratings scraped during searching. trying to get imdb ratings for',searchLength,'items...');

        imdbPrefix = 'https://' + RAPID_API_HOST + '/titles/';
        filtered = imdbData.map(el => (el.imdbId && el.imdbId != 'n/a') ? imdbPrefix + el.imdbId + '/ratings' : null);

        imdbResults = await fy.fetchAll(filtered, HEADERS, FETCH_INTERVAL);
        imdbResults = imdbResults.map((el, i) => filtered[i] ? el : null);
        searchLength = imdbResults.filter(el => el).length;
        if(searchLength == 0) {
          console.log(`imdb scraping result is empty.`);
        }
        else {
          console.log(`getting imdb ratings done: ${filtered.filter(el => el).length}`);
          newImdbData = await parseImdbResults_('rating', imdbResults, imdbData);
        }
      }

      imdbData.forEach((oldEl, i) => {
        const newImdbDatum = newImdbData[i];
        if(newImdbDatum && newImdbDatum.imdbRating) {
          otData[i].imdbFlag = newImdbDatum.imdbFlag || '';
          otData[i].imdbId = newImdbDatum.imdbId;
          otData[i].imdbUrl = newImdbDatum.imdbUrl;
          otData[i].year = newImdbDatum.year;
          otData[i].type = newImdbDatum.type;

          otData[i].imdbRatingFetchedDate = newImdbDatum.imdbRatingFetchedDate;
          if(fy.isValidRating_(otData[i].imdbRating) && otData[i].imdbVisitedDate && otData[i].imdbRating != newImdbDatum.imdbRating && dateDiffInDays(new Date(otData[i].imdbVisitedDate), new Date()) < UPDATE_INTERVAL_DAYS_IMDB_VISITED)
            console.debug(`api rating of ${newImdbDatum.orgTitle} differs from imdb rating, but imdb visited less than ${UPDATE_INTERVAL_DAYS_IMDB_VISITED} days ago. so no update.`);
          else
            otData[i].imdbRating = newImdbDatum.imdbRating;

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
    fy.getInternalCache_(otData);

    //change flow: update divs
    fy.updateDivs(itemDivs, otData, trueData.selectors);


    async function searchAgainIfNeeded_(imdbResults, imdbData, filtered) {
      let reSearchLength, toReSearch;
      let sImdbData = [], localResults;

      const END_COUNT = 4;  //title fix, aka search, failed
      let count = 1;
      while(count < END_COUNT) {
        count++;

        //determines re-searching
        toReSearch = imdbData.map((imdbDatum, j) => {
          if(!imdbDatum.needsReSearch || imdbDatum.needsReSearch == 'failed')
            return null;
          else if(imdbDatum.needsReSearch == 'title fix')
            return imdbPrefix + encodeURIComponent(imdbDatum.orgTitle) + imdbSuffix + '&year=' + years[j] + '&exact=true' + fy.getTypeString_(types[j]);
          else if(imdbDatum.needsReSearch == 'try aka search') {
            //year도 틀렸을 가능성이 높으니 연도를 넓게
            const yearString = `&startYear=${(years[j]-1)}&endYear=${(years[j]+1)}`;
            return 'https://' + RAPID_API_HOST + '/titles/search/akas/' + encodeURIComponent(imdbDatum.orgTitle) + imdbSuffix + yearString + fy.getTypeString_(types[j]);
          }
          //else
          //  this won't happens
        });

        reSearchLength = toReSearch.filter(el => el).length;
        if(reSearchLength == 0)
          break;  //for while

        toast.log(`now re-searching infos and ratings on imdb for ${reSearchLength} items...`);
        localResults = await fy.fetchAll(toReSearch, HEADERS, FETCH_INTERVAL);

        sImdbData = await parseImdbResults_('search', localResults, imdbData);
        sImdbData = sImdbData.map((el, i) => localResults[i] && el.imdbId ? el : null);
        reSearchLength = sImdbData.filter(el => el).length;
        if(reSearchLength > 0) {
          console.log(`imdb re-searching successfully done: ${reSearchLength}`);
        }
        else {
          console.log(`re-searching failed for ${toReSearch.filter(el => el).length} items.`);
        }

        toReSearch.forEach((el, i) => {
          if(!el)
            return;  //continue

          if(sImdbData[i]?.imdbUrl) {  //검색이 실패했어도 url은 넣기 위해
            imdbData[i].imdbUrl = sImdbData[i].imdbUrl;
            delete imdbData[i].needsReSearch;
          }
        });
      }

      //검색 결과에서 바로 평점도 가져올 수 있는 경우(새 api의 base_info)
      let searchAndScraped = 0;
      filtered.forEach((el, i) => {
        let imdbRes, targetDatum;
        if(localResults) {
          targetDatum = sImdbData[i];
          imdbRes = localResults[i];
        }
        else {
          targetDatum = imdbData[i];
          imdbRes = imdbResults[i];
        }
        if(!imdbRes)
          return;  //continue

        const tempRating = imdbRes?.ratingsSummary?.aggregateRating;
        if(el && fy.isValidRating_(tempRating) && !imdbRes?.titleType.text.includes('Episode')) {
          //단 타입에 '에피소드'가 들어가 있다면 검색이 잘못되었을 확률이 높으므로 패스
          imdbData[i] = targetDatum;
          imdbData[i].imdbRating = tempRating;
          imdbData[i].imdbRatingFetchedDate = new Date().toISOString();
          newImdbData[i] = imdbData[i];

          filtered[i] = null;
          //console.debug('scraping passed:', targetDatum.orgTitle);
          searchAndScraped++;
        }
      });
      if(searchAndScraped > 0)
        console.log(`${searchAndScraped} ratings are scraped (or passed) during searching (no need to scrape).`);

      return filtered;
    }

    async function parseImdbResults_(parseType, imdbResults, imdbData) {
      let res, imdbDatum;
      let resTitle, resYear, resType;
      for(const [i, r] of imdbResults.entries()) {  //to use async in for loop

        const otDatum = otData[i];
        if(imdbData[i]) {
          //second run or re-search
          imdbDatum = imdbData[i];
        }
        else {
          imdbData[i] = {};
          imdbDatum = {};
        }

        let orgTitle = imdbDatum.orgTitle || orgTitles[i];
        const year = years[i];

        if(!r || !orgTitle)
          continue;

        if(typeof r == 'string') {
          try {
            res = JSON.parse(r);
          }
          catch(e) {
            console.warn('parsing error: ', r);
          }
        }
        else {  //if(typeof r = 'object')
          res = r;
        }

        if(!res || !res.results || res.results.length == 0 ||  //결과가 없을 때
        (res.results && res.results[0]?.searchAgain)) {  //또는 있어도 재검색을 지시한 결과일 때
          //결과가 없으면 경고 출력
          if(res && !res.results) {
            console.warn(`parsing "${parseType}" (with re-search: "${imdbDatum.needsReSearch}") result of ${orgTitle} (${year}, type: ${otDatum.type}) via API failed or no results on imdb!`);
            console.debug('res:', res);
          }

          if(otDatum.otFlag == '' && otDatum.imdbFlag == '' && (otDatum.imdbId && otDatum.imdbId != 'n/a') && (otDatum.imdbRating && otDatum.imdbRating != 'n/a') && (otDatum.year && otDatum.year != 'n/a') && !trueData.forceUpdate) {
            console.debug('imdb data on cache is healthy, so let it be for: '+orgTitle);
          }
          else if(parseType == 'search') {
            if(!imdbDatum.needsReSearch) {
              //fetch again with WP_TO_IMDB_FIX_DICT
              const sourceWords = [...WP_TO_IMDB_FIX_DICT.keys()];
              const targetWords = [...WP_TO_IMDB_FIX_DICT.values()];
              let fixedOrgTitle = orgTitle;
              sourceWords.forEach((sourceWord, j) => {
                if((typeof sourceWord == 'string' && orgTitle.includes(sourceWord)) || 
                  (typeof sourceWord == 'object' && orgTitle.match(sourceWord)))
                  fixedOrgTitle = fixedOrgTitle.replace(sourceWord, targetWords[j]);
              });

              if(fixedOrgTitle != orgTitle) {
                console.debug(`"${orgTitle}" is fixed to "${fixedOrgTitle}". re-searching queued.`);
                imdbData[i] = {};
                imdbData[i].orgTitle = fixedOrgTitle;
                imdbData[i].needsReSearch = 'title fix';
              }
              else {
                //if no WP_TO_IMDB_FIX_DICT can be applied, try aka search
                console.debug(`${orgTitle} re-searching (aka search) queued.`);
                imdbData[i] = {};
                imdbData[i].orgTitle = orgTitle;
                imdbData[i].needsReSearch = 'try aka search';
              }
            }
            else if(imdbDatum.needsReSearch == 'title fix') {
              //if WP_TO_IMDB_FIX_DICT applied and failed, try aka search again
              console.debug(`${orgTitle} title fixed but still no result. another re-searching (aka search) queued.`);
              imdbData[i].needsReSearch = 'try aka search';
            }
            else if(imdbDatum.needsReSearch == 'try aka search') {
              //finally, aka search failed too
              imdbData[i].imdbFlag = '??';
              if(!imdbData[i].imdbUrl)
                imdbData[i].imdbUrl = 'https://www.imdb.com/find?s=tt&q=' + encodeURIComponent(orgTitle+' '+year);
              imdbData[i].needsReSearch = 'failed';
            }
            //else
            //  this won't happens
          }
          else {
            //rating scraping failed (가령 키노에서 실행 시 엉뚱한 영화가 검색돼서 평점이 없으면 다시 검색)
            //case: 클럽하우스 on 왓챠
            console.log(`trying alternative searching for ${orgTitle}...`);

            const againImdbRes = Array(imdbResults.length).fill(null);
            againImdbRes.results = [{searchAgain: true}];
            const againImdbData = await parseImdbResults_('search', againImdbRes, imdbData);

            const againFiltered = await searchAgainIfNeeded_(againImdbRes, imdbData, filtered);
            if(againImdbData[i].imdbFlag && againImdbData[i].imdbFlag != '??') {
              filtered = againFiltered;  //referenced-cloning is ok
              res.results = [againImdbRes.results[0]];  //referenced-cloning is ok
              delete res.results[0].searchAgain;
              imdbDatum = againImdbData[i];  //referenced-cloning is ok
              console.log(`alternative searching during scraping is successfully done: ${otData[i].orgTitle} -> ${imdbDatum.orgTitle}`);

              searchWrapUp_(imdbDatum, i, 0);
            }
            else {
              //결국 실패
              delete imdbData[i].searchAgain;
              imdbData[i].imdbFlag = '??';
              if(!imdbData[i].imdbUrl)
                imdbData[i].imdbUrl = 'https://www.imdb.com/find?s=tt&q=' + encodeURIComponent(orgTitle+' '+year);
              console.log(`alternative searching during scraping failed for: ${orgTitle}`);
            }
          }
        }
        else {
          if(parseType == 'search') {
            const titles = res.results.map(el => el.titleText.text);
            const years = res.results.map(el => el.releaseYear.year);
            const ids = res.results.map(el => el.id);
            const types = res.results.map(el => el.titleType.text);
            const lengths = res.results.map(el => el?.runtime?.seconds);

            //movie, video, tv series, and longer ones are prefered
            const indexes = Array.from(Array(res.results.length).keys());
            const weights = Array(res.results.length).fill(0);

            let idx = -1, exactMatchCount = 0;
            titles.forEach((sTitle, j) => {
              const type = types[j];

              const possibleType = otDatum.type || trueData.type || null;
              const possibleYear = otDatum.year || trueData.year || null;

              let found = false;
              //exact match(TV물이면 type까지 '느슨하게' 일치)
              if(possibleType == 'not TV Series' && !type.includes('Series') && !type.includes('Episode') && possibleYear && possibleYear == years[j]) {
                //type이 있으면 type(느슨하게)과 year 일치. wp 결과가 정확하지 않으면...? 어쩔 수 없다... 넘어가자...
                found = true;
              }
              else if(sTitle == orgTitle && (
                (!possibleType || !possibleType.includes('Series')) ||
                (possibleType.includes('Series') && type.includes('Series')))) {

                found = true;
                if(!possibleType) {
                  found = false;
                  //type이 없으면 영화 우선
                  if(type == 'Movie')
                    weights[j] = 4;
                  else if(type == 'Video')
                    weights[j] = 3;
                  else if(type == 'TV Series')
                    weights[j] = 2;
                  else if(type == 'TV Mini Series')
                    weights[j] = 1;

                  if(weights[j] > 0) 
                    found = true;
                }
              }

              if(found) {
                if(idx == -1) {
                  idx = j;
                  imdbDatum.imdbFlag = '';
                }
                exactMatchCount++;
              }
            });

            if(exactMatchCount > 1) {
              indexes.sort((a, b) => {
                let result = weights[b] - weights[a];
                if(result == 0)
                  result = lengths[b] - lengths[a];
                return result;
              });
              idx = indexes[0];

              if(otDatum.imdbFlag == '' && (otDatum.imdbRating && otDatum.imdbRating != 'n/a') && (otDatum.year && otDatum.year != 'n/a') && !trueData.forceUpdate) {
                console.debug(`${exactMatchCount} multiple exact matches for ${orgTitle} (${otDatum.year}, type: ${otDatum.type}) found on imdb, but imdb data on cache is healthy. so just let it be.`);
                imdbDatum = otDatum;
              }
              else {
                console.warn(`${exactMatchCount} multiple exact matches for ${orgTitle} (${otDatum.year}, type: ${otDatum.type}) found on imdb. so just taking the first exact match (movie, video, tv series, and longer ones are prefered).`);
                idx = indexes[0];
                imdbDatum.imdbFlag = '?';
              }
            }
            else if(idx == -1) {
              idx = 0;
              if(imdbDatum.needsReSearch == 'try aka search') {
                console.warn(`taking just the first aka search result: ${titles[idx]} for ${orgTitle}`);
                imdbDatum = res.results[idx];
                imdbDatum.imdbFlag = '?';
              }
              else {
                if(types[idx].includes('Episode')) {
                  console.warn(`${orgTitle} (id: ${ids[idx]}) type is tv episode, which doesn't make sense. so taking its series title: ${res.results[idx].titleText.text} (id: ${res.results[idx].id})`);
                  res.results[idx] = res.results[idx].series.series;
                  ids[idx] = res.results[idx].id;
                  titles[idx] = res.results[idx].titleText.text;
                  if(res.results[idx].titleType.text == 'tvSeries')
                    types[idx] = 'TV Series';
                  else if(res.results[idx].titleType.text == 'tvMiniSeries')
                    types[idx] = 'TV Mini Series';
                  imdbDatum.imdbFlag = '?';
                }
                else {
                  if(res.results[0]?.searchAgain) {
                    console.warn(`${orgTitle} (${otDatum.year}, type: ${otDatum.type}) seems not found on imdb after aleternative searching. so taking the first result: ${titles[idx]} (id: ${ids[idx]}, type: ${otDatum.type})`);
                    imdbDatum.imdbFlag = '??';
                    delete res.results[0].searchAgain;
                    delete imdbDatum.searchAgain
                  }
                  else {
                    //case: KILL LIST (2011), 박쥐 (2009) on 왓챠
                    console.log(`${orgTitle} (${otDatum.year}, type: ${otDatum.type}) seems not found on imdb. so queued alternative searching.`);
                    imdbDatum.needsReSearch = 'try aka search';
                  }
                }
              }
            }
            searchWrapUp_(imdbDatum, i, idx);
          }
          else if(parseType == 'rating') {
            let tempImdbRating = res.results?.averageRating;
            if(!fy.isValidRating_(tempImdbRating)) {
              const otDatum = otData[i];
              if(otDatum.imdbFlag == '' && (otDatum.imdbRating && otDatum.imdbRating != 'n/a') && (otDatum.year && otDatum.year != 'n/a') && !trueData.forceUpdate) {
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
          }

          //for edit
          if(!imdbDatum.imdbId || imdbDatum.imdbId == 'n/a')
            imdbDatum.imdbId = fy.getIdFromValidUrl_(otData[i].imdbUrl);

          //wrap-up for both searching and scraping
          imdbData[i] = imdbDatum;
        }
      }  //of for

      return imdbData;


      function searchWrapUp_(imdbDatum, i, idx) {
        imdbResults[i] = res.results[idx];  //mutate results to get ratings too (via base_info)
        imdbDatum.imdbId = imdbResults[i].id;

        resTitle = imdbResults[i]?.titleText?.text;  //may be null?
        resYear = imdbResults[i]?.releaseYear?.year;  //may be null?
        resType = imdbResults[i]?.titleType?.text;  //may be null?

        if(imdbDatum.imdbId) {
          imdbDatum.imdbUrl = fy.getUrlFromId_(imdbDatum.imdbId, 'www.imdb.com');
          imdbDatum.year = resYear || otDatum.year;
          imdbDatum.orgTitle = resTitle || orgTitle;
          imdbDatum.type = resType;
        }
      }
    }
  }


  //common(?) publics
  updateDivs(itemDivs, otData, selectors = {}) {
    //toast.log('updating divs...');
    itemDivs.forEach((item, i) => {
      updateDiv_(item, otData[i], itemDivs.length, selectors);
    });
    toast.log(itemDivs.length + ' divs updated!');

    //캐시 반영
    setGMCache_(GM_CACHE_KEY, otData);

    //wrap up
    toast.log();
    if(!fy.preventMultipleUrlChanges)
      fy.observer.observe(fy.root, fy.observerOption);

    //end of flow


    async function setGMCache_(GMKey, array) {
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
      });

      const targetObj = await GM_getValue(GMKey);
      Object.assign(targetObj, obj);
      await GM_setValue(GMKey, targetObj);
      if(Object.keys(obj).length > 0)
        console.debug(Object.keys(obj).length + ' items possibly updated on cache.');
    }

    function updateDiv_(fyItemToUpdate, otDatum = {}, totalNumber, selectors) {
      let numberToParent = fy.numberToBaseEl;
      if(!isNaN(numberToParent) && selectors.determineSinglePageBy)
        numberToParent++;

      const baseEl = fy.getParentsFrom_(fyItemToUpdate, numberToParent)
      let div = baseEl.querySelector('div.'+FY_UNIQ_STRING) || baseEl.querySelector('div['+FY_UNIQ_STRING+']');  //the latter is for kino

      if(!div) {
        console.warn('no (fy-item) sub-div found for ', fyItemToUpdate);
        return;
      }
      else if(otDatum.otFlag == '???') {
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

      targetInnerHtml += `<a href="javascript:void(0);" onClick="fy.edit(this, 'ot')" class="fy-edit">edit</a> `;

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
      if(fy.isValidRating_(otDatum.imdbRating)) {
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

      targetInnerHtml += `<span class="fy-external-site">[</span><span class="fy-imdb-rating over-${ratingCss}" flag="${flag}">${rating}${flag}</span><span class="fy-external-site">]</span>`;

      if(otDatum.imdbUrl)
        targetInnerHtml += `</a>`;

      targetInnerHtml += `<a href="javascript:void(0);" onClick="fy.edit(this, 'imdb')" class="fy-edit">edit</a> `;

      //let users know it's changed
      if(div.innerText != '' && div.innerText != targetInnerHtml && totalNumber == 1) {
        letItBlink(div);
        //console.debug(div, 're-updated!');

        function letItBlink(styleEl) {
          styleEl.style.background = 'green';
          styleEl.style.transitionDuration = '2s';
          styleEl.addEventListener('transitioncancel', onFinished);
          styleEl.addEventListener('transitionend', onFinished);
        }

        function onFinished(e) {
          e.target.style.transitionDuration = '0s';
          e.target.style.background = '';
          try {
            e.target.removeEventListener('transitioncancel', onFinished);
            e.target.removeEventListener('transitionend', onFinished);
            console.debug('removing listeners succeeded.');
          }
          catch(e) {
            console.debug('removing listeners failed:', e);
          }
        }
      }

      div.innerHTML = targetInnerHtml;
    }
  }


  //small utils
  getTypeFromDiv_(selectors, baseEl) {
    let nestedSelector = selectors.isTVSeries || selectors.types;  //either not and/or
    if(nestedSelector) {
      let els;
      if(nestedSelector.numberToBaseEl) {
        const div = fy.getParentsFrom_(baseEl, nestedSelector.numberToBaseEl);
        els = [...div.querySelectorAll(nestedSelector.selector)];
      }
      else {
        els = [...baseEl.querySelectorAll(nestedSelector.selector)];
      }
      console.debug('els', els, baseEl);  //dev+++

      if(selectors.isTVSeries) {
        if(els.filter(el => el.innerText.match(nestedSelector?.contains)).length > 0)
          return 'TV Series';  //tv mini series는 어떡하냐 -_- 아오
        else
          return 'not TV Series';  //not tv series. should not be null
      }
      else if(selectors.types) {
        const key = els[0]?.innerText;
        return nestedSelector?.mapping[key];
      }
    }
    return null;
  }

  getTypeString_(typeString) {
    //wp는 tv 시리즈와 tv 미니 시리즈도 못 구분하니 타입은 패스...
    /*
    if(typeString == 'TV Series')
      return '&titleType=tvSeries';
    else if(typeString == 'TV Mini Series')
      return '&titleType=tvMiniSeries';
    else
      */
      return '';
  }

  getParentsFrom_(div, numberOrRoot) {
    if(isNaN(numberOrRoot))
      div = document.documentElement;
    else
      for(let i = 0; i < numberOrRoot; i++)
        div = div.parentNode;

    return div;
  }

  getTextFromNode_(el = null) {
    let result = null;

    if(el)
      result = el.innerText || el.alt || el.getAttribute('aria-label') || el.querySelector('img').alt;

    console.debug('text (title):', result);
    return result;
  }

  getIdFromValidUrl_(validUrl = null) {
    return validUrl ? validUrl.split('/').pop().split('?')[0] : null;
  }

  getUrlFromId_(id = null, targetSite = 'watcha.com') {
    let url = null;

    if(id) {
      if(targetSite == 'watcha.com')
        url = 'https://pedia.watcha.com/en-KR/contents/' + id;  //english page
      else if(targetSite == 'www.imdb.com')
        url = 'https://www.imdb.com/title/' + id;
    }
    return url;  
  }

  isValidRating_(rating = 'n/a') {
    return rating != 'n/a' && !isNaN(parseFloat(rating))
  }


  ////other publics
  async imdbRun() {
    const otCache = await GM_getValue(GM_CACHE_KEY);

    const path = document.location.pathname.replace(/\/$/, '');
    if(!path.startsWith('/title/') || path.endsWith('/episodes') || path.split('/').length > 3) {
      toast.log();
      return;
    }

    const imdbId = path.split('/')[2];

    const json = document.querySelector('script#__NEXT_DATA__')?.text;
    let imdbData;
    if(json)
      imdbData = JSON.parse(document.querySelector('script#__NEXT_DATA__').text).props.pageProps.aboveTheFoldData;

    let imdbRating = imdbData.ratingsSummary.aggregateRating;
    if(!fy.isValidRating_(imdbRating))
      imdbRating = 'n/a';

    const trueOrgTitle = imdbData.originalTitleText.text;
    const trueYear = imdbData.releaseYear.year;
    const trueType = imdbData.titleType.text;
    console.info('trueOrgTitle, trueYear, trueType', trueOrgTitle, trueYear, trueType);

    /*
    let imdbRating = document.querySelector('div[data-testid$="aggregate-rating__score"]>span[class]');
    if(imdbRating)
      imdbRating = parseFloat(imdbRating.innerText);
    else
      imdbRating = 'n/a';

    let trueOrgTitle = document.title.replace(/ - IMDb$/, '');
    trueOrgTitle = trueOrgTitle.replace(/ \(TV Episode( (\d{4})\)|\))$/, '');

    //ex: \"The Kill Count\" Saw 3D (2010) (TV Episode 2018)
    //ex: \"Review It\" Spider-Man 2 (2004) (TV Episode)
    let trueYear;
    [trueOrgTitle, trueYear] = trueOrgTitle.split(' (');

    //ex1: \"We Eat Films\" Saw 3D (TV Episode 2010)
    //ex2: Majutsushi Orphen Mubouhen (TV Series 1998–1999) -> take the first year
    //ex3: Sorcerous Stabber Orphen (TV Series 2020– )
    //ex4: The Promised Neverland (TV Series)
    if(!trueYear || isNaN(parseInt(trueYear.slice(0, 4)))) {
      const tempTitle = document.title.replace(/ - IMDb$/, '');
      trueYear = tempTitle.match(/(\d{4})–(\d{4})\)$/);  //ex2
      if(trueYear)
        trueYear = trueYear[1];
      else {
        trueYear = document.title.replace(/ - IMDb$/, '').match(/(\d{4})(– |)\)$/);  //ex1 and ex3
        if(trueYear)
          trueYear = trueYear[1];
      }
    }
    else
      trueYear = trueYear.slice(0, 4);
    */

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
      idx = orgTitles.indexOf(trueOrgTitle);

      //console.log(orgTitles[idx], years[idx]);
      if(!(idx > -1 && years[idx] == trueYear))  //if not exact match
        idx = -1;
    }

    if(idx > -1) {
      let cache = otCache[keys[idx]];
      let cacheFlag = cache.imdbFlag;

      if(cache.imdbFlag != '') {
        if(fy.isValidRating_(cache.imdbRating) && !fy.isValidRating_(imdbRating)) {
          toast.log('warning: cache rating is valid but imdb rating is n/a. so deleting the cache which is probably wrong!');

          cache.imdbId = 'n/a';  //다시 업데이트하지 못하게 막음
          cache.imdbRating = 'n/a';
          cache.imdbUrl = 'https://www.imdb.com/find?s=tt&q=' + encodeURIComponent(orgTitles[idx]);
        }
        else if(Math.abs(parseInt(cache.year) - trueYear) > 1) {
          toast.log('year on imdb is ' + trueYear + ', which quite differs from ' + cache.year + '. so deleting the cache which is probably wrong!');

          cache.imdbId = 'n/a';  //다시 업데이트하지 못하게 막음
          cache.imdbRating = 'n/a';
          cache.imdbUrl = 'https://www.imdb.com/find?s=tt&q=' + encodeURIComponent(orgTitles[idx]);
        }
        else {
          if(cache.imdbUrl.startsWith('https://www.imdb.com/find?') || cache.imdbFlag == '??') {
            toast.log('updated the whole imdb data on cache (id was not set or flag is ??) for '+trueOrgTitle+' ('+trueYear+').');

            cache.imdbId = imdbId;
            cache.imdbUrl = fy.getUrlFromId_(imdbId, 'www.imdb.com');
            cache.year = trueYear;
          }
          else
            toast.log('rating (only) for '+trueOrgTitle+' ('+cache.year+') was successfully updated and/or flag was unset on the cache.');

          cache.imdbRating = imdbRating;
        }
        cache.imdbFlag = '';
      }
      else if(imdbRating != cache.imdbRating) {
        if(cache.imdbRating == 'n/a') {
          toast.log('updated the whole imdb data on cache (flag was not set) for '+trueOrgTitle+' ('+trueYear+').');

          cache.imdbId = imdbId;
          cache.imdbUrl = fy.getUrlFromId_(imdbId, 'www.imdb.com');
          cache.year = trueYear;

          cache.imdbRating = imdbRating;
        }
        else if(imdbRating != 'n/a') {
          toast.log('imdb rating differs from the cache, so updating the cache rating (only) for '+trueOrgTitle+' ('+cache.year+').');

          cache.imdbRating = imdbRating;
        }
      }
      else if(parseInt(cache.year) != trueYear && Math.abs(parseInt(cache.year) - trueYear) < 5) {
        toast.log('rating is the same, but the year on imdb is ' + trueYear + ', which slightly differs from ' + cache.year + ' on cache. other cache data looks healthy, so updating the year only.');

        cache.year = trueYear;
      }
      else {
        toast.log('imdb flag is not set and imdb rating is the same as cache, so no update.');
      }

      //구 버전과의 호환성을 위해
      if(cache?.type != trueType)
        cache.type = trueType;
        
      if(cache.imdbFlag == '' && cache.orgTitle != trueOrgTitle) {  //flag가 없는데 제목이 다르다면
        console.log(`title fixed: ${cache.orgTitle} -> ${trueOrgTitle}`);
        cache.orgTitle = trueOrgTitle;
      }

      //wrap-up
      cache.imdbRatingFetchedDate = new Date().toISOString();
      cache.imdbVisitedDate = new Date().toISOString();
      otCache[keys[idx]] = cache;
      await GM_setValue(GM_CACHE_KEY, otCache);
    }
    else {
      toast.log('this title is not yet stored on the cache.');
    }

    toast.log();
  }

  async edit(el, onSite) {
    const otCache = await GM_getValue(GM_CACHE_KEY);  //exported earlier

    const baseEl = fy.getParentsFrom_(el, fy.numberToBaseEl+1);

    //determine single-page
    const rule = fy.selectorsForSinglePage || fy.selectorsForLargeDiv;  //either not and/or

    let isSinglePage = false;
    if((fy.selectorsForSinglePage.determinePathnameBy && document.location.pathname.startsWith(fy.selectorsForSinglePage.determinePathnameBy)) ||
      (rule?.determineSinglePageBy == true || baseEl.querySelector(rule?.determineSinglePageBy) == el.parentNode))
      isSinglePage = true;
    console.debug('isSinglePage:', isSinglePage);

    let selectors = rule;
    if(!isSinglePage)
      selectors = fy.selectorsForListItems;

    const type = fy.getTypeFromDiv_(selectors, baseEl);
    console.debug('type:', type);

    //search id and title
    let id, url, title, otDatum;
    id = fy.getIdFromValidUrl_(baseEl.querySelector(selectors.id)?.href);

    //캐시에 있다면 사용.
    if(id)
      otDatum = await fy.getObjFromWpId_(id);

    const titleEl = baseEl.querySelector(selectors.title);
    title = fy.getTextFromNode_(titleEl);
    console.debug('title:', title);
    if(!otDatum)
      otDatum = otCache[title] || {};

    //search target el (fyItem. the last element)
    const targetEl = baseEl.querySelector(selectors.targetEl) || baseEl;

    //get input
    let imdbId, imdbUrl;
    if(onSite == 'ot') {
      url = prompt("Enter proper Watcha Pedia url: ", otDatum.otUrl);
      if(!url)
        return;
      else if(!url.startsWith('https://pedia.watcha.com/')) {
        alert('Not a valid Watcha Pedia url. it should be "https://pedia.watcha.com/en-KR/contents/WP_CODE" format!');
        return;
      }
      url = url.trim().replace('/ko-KR/', '/en-KR/').replace(/\/\?.*$/, '').replace(/\/$/, '');
      id = fy.getIdFromValidUrl_(url);

      if(url == otDatum.otUrl) {
        if(otDatum.otFlag != '') {
          toast.log('WP flag was reset (WP url is confirmed).');
          otDatum.otFlag = '';
        }
        else
          return;
      }
    }
    else if(onSite == 'imdb') {
      imdbUrl = prompt("First make sure that Watcha Pedia info is correct. If so, enter proper IMDb title url: ", otDatum.imdbUrl);
      if(!imdbUrl)
        return;
      else if(!imdbUrl.startsWith('https://www.imdb.com/title/')) {
        alert('Not a valid IMDb title url. it should be "https://www.imdb.com/title/IMDB_ID" format!');
        return;
      }
      imdbUrl = imdbUrl.trim().replace(/\/\?.*$/, '').replace(/\/$/, '');
      imdbId = fy.getIdFromValidUrl_(imdbUrl);

      if(imdbUrl == otDatum.imdbUrl) {
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
    fy.search([targetEl], {title, id, url, type, imdbId, imdbUrl, forceUpdate: true, selectors});
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
          //console.debug('fetching', url);  //dev+++
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
