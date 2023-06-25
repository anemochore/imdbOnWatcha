// ==UserScript==
// @name         imdb on watcha_jw
// @namespace    http://tampermonkey.net/
// @version      0.6.7
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
// @require      https://anemochore.github.io/imdbOnWatcha/parseJW.js
// @require      https://anemochore.github.io/imdbOnWatcha/parseWP.js
// @require      https://anemochore.github.io/imdbOnWatcha/imdbRun.js
// @require      https://anemochore.github.io/imdbOnWatcha/utils.js
// @require      https://anemochore.github.io/imdbOnWatcha/settings.js
// @require      https://anemochore.github.io/imdbOnWatcha/fixes.js
// @require      https://cdn.jsdelivr.net/npm/fuzzysort@2.0.4/fuzzysort.min.js
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @connect      apis.justwatch.com
// @connect      pedia.watcha.com

// ==/UserScript==


//singletons
const toast = new fadingAlert();
toast.log();


//global consts
const GM_CACHE_KEY = 'OT_CACHE_WITH_IMDB_RATINGS';

const UPDATE_INTERVAL_DAYS_ORG_TITLES = 30;  //in days
const UPDATE_INTERVAL_DAYS_IMDB_VISITED = 7;  //in days
const YEAR_DIFFERENCE_THRESHOLD = 5;  //if year difference is larger than this const, discard it.

class FyGlobal {

  async run() {
    fy.site = document.location.host;

    fy.locale = navigator.language.replace('-', '_');
    [fy.lang, fy.country] = fy.locale.split('_');
    if(!fy.country) {
      //대~충!
      switch(fy.lang) {
        case 'ko':
          fy.country = 'KR';
          break;
        case 'ja':
          fy.country = 'JP';
          break;
        default:
          fy.country = 'US';
      }
    }
    if(fy.locale == fy.lang)
      fy.locale = fy.locale + '_' + fy.country;


    //for this.edit(), etc
    unsafeWindow.GM_getValue = GM_getValue;
    unsafeWindow.GM_setValue = GM_setValue;

      //imdb 접속 시 캐시 업데이트
    if(fy.site == 'www.imdb.com') {
      fyImdbRun.imdbRun();
      return;
    }

    if(!SETTINGS[fy.site])
      return;

    toast.log('fy script started.');

    //load setting
    for(const [k, v] of Object.entries(SETTINGS[fy.site]))
      this[k] = v;

    this.search = this.searchByTitle;
    this.handler = this.handlers[fy.site] || this.defaultHandler;
    this.preUpdateDivs = this.preUpdateDivses[fy.site] || this.defaultBaseElementProc;
    this.largeDivUpdate = this.largeDivUpdates[fy.site];

    //numberToBaseEl 자동으로 지정
    if(!fy.numberToBaseEl) {
      let tSelector = fy.selector.split(',')[0]  //selector가 여러 개일 때까지는 지원하지 않음.
      .split(FY_UNIQ_STRING).pop();
      fy.numberToBaseEl = tSelector.match(/[^(]>/g)?.length || 1;  //fy-item 이후 > 개수
      console.debug('numberToBaseEl was auto calculated based on selector:', fy.numberToBaseEl);
    }

    //global vars & flags
    this.prevLocation = document.location;
    this.isFetching = false;
    this.indexCaches = [];
    this.keyCaches = [];

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
    //this is not working on wavve.com
    window.addEventListener('locationchange', e => {
      fy.entry(e);
    });

    history.pushState = (f => function pushState() {
      //console.debug(`location on pushState: ${fy.prevLocation.href} -> ${document.location.href}`);
      fy.prevLocation = document.location;
      var ret = f.apply(this, arguments);
      window.dispatchEvent(new Event('pushstate'));
      window.dispatchEvent(new Event('locationchange'));
      return ret;
    })(history.pushState);

    history.replaceState = (f => function replaceState() {
      //console.debug(`location on replaceState: ${fy.prevLocation.href} -> ${document.location.href}`);
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
    /*
    if(!RAPID_API_KEY || RAPID_API_KEY == DEFAULT_MSG) {
      await GM_setValue('RAPID_API_KEY', DEFAULT_MSG);
      alert("set RAPID_API_KEY in Tampermonkey's setting first.");
      toast.log();
      return;
    }
    */

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
    //console.debug(`location on entry: ${fy.prevLocation.href} -> ${curLocation.href}`);
    let urlChanged = false;
    if(fy.isFetching && 
      ((fy.largeDivSamePathName && fy.prevLocation.href != curLocation.href) ||
      (!fy.largeDivSamePathName && fy.prevLocation.origin+fy.prevLocation.pathname != curLocation.origin+curLocation.pathname))) {
      toast.log('url changed. so aborting current possible fetching...');
      fy.xhrAbort();
      urlChanged = true;
    }

    if(urlChanged || fy.forceLargeDivUpdateOnUrlChange) {
      //reset fy-item attributs
      const itemDivs = [...fy.root.querySelectorAll('['+FY_UNIQ_STRING+']')];
      itemDivs.forEach((item, i) => {
        item.removeAttribute(FY_UNIQ_STRING);
      });
    }

    //init
    toast.log();

    const isExit = determineExit_();
    if(isExit || fy.isFetching)
      return;

    //entry point
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
      const largeDiv = fy.root.querySelector('['+FY_UNIQ_STRING+']');
      if(largeDiv) {
        //if already updated, no more update when scrolling, etc
        console.info('large-div already updated.');
        toast.log();
        fy.observer.observe(fy.root, fy.observerOption);
        return;
      }

      const largeDivTargetEl = fy.root.querySelector(fy.selectorsForSinglePage.targetEl);
      if(!largeDivTargetEl) {
        console.info('waiting for large-div...');
        largeDivTargetEl = await elementReady(fy.selectorsForSinglePage.targetEl, fy.root);
      }

      await fy.largeDivUpdate(largeDivTargetEl);
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
        await fy.largeDivUpdate(largeDiv);
    },

    'www.netflix.com': async (m, o) => {
      //fy.observer.disconnect();

      if(location.search.includes('?jbv=') || location.pathname.startsWith('/title/')) {
        //large-div or single-page
        let largeDiv = fy.root.querySelector(fy.selectorOnLargeDiv);
        if(!largeDiv)
          largeDiv = await elementReady(fy.selectorOnLargeDiv, fy.root);

        //wait for lazy loading
        await elementReady(fy.selectorsForLargeDiv.year, fy.root);

        //업데이트를 안 했을 때만 업데이트
        const selectors = fy.selectorsForLargeDiv;
        const baseEl = fy.getParentsFrom_(largeDiv, fy.numberToBaseEl);
        await elementReady(selectors.title, baseEl);  //title이 img라 늦게 로딩됨
        await fy.largeDivUpdate(largeDiv);
      }
      else {
        fy.handlerWrapUp(fy.selectorsForListItems);
      }
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
    'watcha.com': async (largeDiv) => {
      //on single content (=large div) page
      const selectors = fy.selectorsForSinglePage;

      const id = fy.getIdFromValidUrl_((fy.getParentsFrom_(largeDiv, selectors.numberToBaseEl).querySelector(selectors.id) || document.location).href);
      const title = fy.getTextFromNode_(fy.getParentsFrom_(largeDiv, selectors.numberToBaseEl).querySelector(selectors.title));
      const type = fy.getTypeFromDiv_(selectors, fy.getParentsFrom_(largeDiv, selectors.numberToBaseEl));
      //console.debug('id, title, type on largeDivUpdates', id, title, type);

      const url = 'https://pedia.watcha.com/en-US/contents/' + id;  //english page

      toast.log(`scraping wp for org. title, etc for ${title} (${id})...`);
      //연도를 얻어내서 jw 검색 정확도를 높이는 게 주목적이다. 무조건 스크레이핑하는 게 좀 걸리긴 하네...
      const otScrapeResults = await fy.fetchAll([url], {
        headers: {'Accept-Language': 'en-US'},
      });

      const watchaLargeOtData = [{
        id: id,
        otUrl: url,
        type: type,
      }];
      await fyWP.parseWpScrapeResults_(otScrapeResults, watchaLargeOtData, [title], type != 'Movie');
      const [orgTitle, year] = [watchaLargeOtData[0].orgTitle, watchaLargeOtData[0].year];
      console.log(`org. title scraping on wp done on single page: ${orgTitle} (${year}) type: ${watchaLargeOtData[0].type} `);

      //type이 스크레이핑 중 바뀌는 일은... 없겠지 아마...
      fy.largeDivUpdateWrapUp(largeDiv, {selectors, orgTitle, year, type});
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

      //이미 업데이트된 상태에서 url이 바뀌었다면 fy-item을 제거
      const fyItem = document.querySelector('.'+FY_UNIQ_STRING);
      if(fyItem)
        fyItem.parentNode.removeChild(fyItem);

      //lazy loading이 극심해서 제목을 여기서 처리-_-
      const titleEl = await elementReady(selectors.title, largeDiv, false);
      const title = fy.getTextFromNode_(titleEl);

      const year = [...largeDiv.querySelectorAll('dd')].filter(el => el.innerText.startsWith('개봉연도:'))[0].innerText.split(':').pop().trim();

      fy.largeDivUpdateWrapUp(largeDiv, {selectors, title, year});
    },

    'www.disneyplus.com': (largeDiv) => {
      //todo+++
    }
  };

  largeDivUpdateWrapUp = async (largeDiv, trueData) => {
    const baseEl = fy.getParentsFrom_(largeDiv, trueData.selectors.numberToBaseEl || fy.numberToBaseEl);
    const type = fy.getTypeFromDiv_(trueData.selectors, baseEl);
    //console.debug('trueData.selectors, baseEl', trueData.selectors, baseEl)
    trueData.type = type;

    let sEl = baseEl.querySelector('.'+FY_UNIQ_STRING);
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

      //console.debug('preupdate: item, baseEl, numberToBaseEl', item, baseEl, numberToBaseEl, baseEl.getAttribute(FY_UNIQ_STRING));
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
        return;
      }

      if(title.includes(':') && title.match(/ \(에피소드 [0-9]+\)$/)) {  //디플의 스타워즈 클래식 같은 경우
        title = title.replace(/ \(에피소드 [0-9]+\)$/, '');
        console.info('(에피소드 x) was stripped.', title);
      }

      allTitles[i] = title;

      //일단 캐시에 있다면 그 정보가 뭐든 div 업데이트에는 사용한다.
      otData[i] = otCache[title] || {};  //referenced-cloning is okay.

      //타입 얻기. 왓챠 보관함이나 웨이브 /my 루트 정도?
      let type = fy.getTypeFromDiv_(trueData.selectors, baseEl);
      if(type) {
        //캐시에 타입이 없거나, 캐시가 의심스러우면 목록의 타입 사용
        if(!otData[i].type || otData[i].otFlag != '')
          otData[i].type = type;
      }

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
      console.log(`nothing to search or scrape on jw.`);
      fy.searchWrapUp_(itemDivs, otData, trueData);
      return;
    }
    else if(!trueData.id) {
      //업데이트
      toast.log('getting infos from jw...');

      const URL = `https://apis.justwatch.com/content/titles/${fy.locale}/popular`;
      const qTitles = titles.map(title => title ? fy.getCleanTitle(title) : null);
      const urls = qTitles.map(title => title ? URL: null)
      const otSearchResults = await fy.fetchAll(urls, {}, qTitles, {
        fields: ['id','full_path','title','object_type','original_release_year','scoring','external_ids','original_title'],
        page_size: 10,  //hard limit
      });

      fyJW.parseJwSearchResults_(otSearchResults, otData, trueData, titles);
      searchLength = otSearchResults.filter(el => el).length;
      if(searchLength == 0) {
        console.log('jw searching result is empty.');
        fy.searchWrapUp_(itemDivs, otData, trueData);
        return;
      }
      else {
        console.log(`jw searching done (or passed): ${searchLength}`);
      }
    }

    fy.searchWrapUp_(itemDivs, otData, trueData);
  }

  searchWrapUp_(itemDivs, otData, trueData) {
    //내부 캐시 사용했다면 적용
    fy.getInternalCache_(otData);

    //change flow: update divs
    fy.updateDivs(itemDivs, otData, trueData.selectors);
  }

  updateDivs(itemDivs, otData, selectors = {}) {
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
      let numberToParent = fy.numberToBaseElWhenUpdating || (fy.numberToBaseEl + 1);
      if(selectors.determineSinglePageBy || selectors.determinePathnameBy)
        numberToParent = selectors.numberToBaseEl || numberToParent;

      const baseEl = fy.getParentsFrom_(fyItemToUpdate, numberToParent);
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

      targetInnerHtml += `<span class="fy-external-site" year="${year}" flag="${flag}">[JW]${flag}</span>`;

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
      if(otDatum.imdbRating == '??') {
        rating = '??';  //possibly not yet updated
        otDatum.imdbFlag = '';  //???? -> ??
      }
      else if(fy.isValidRating_(otDatum.imdbRating)) {
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
            console.debug('removing blink listeners succeeded.');
          }
          catch(e) {
            console.debug('removing blink listeners failed:', e);
          }
        }
      }

      div.innerHTML = targetInnerHtml;
    }
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

  //common(?) publics
  getCleanTitle(title) {
    const seasonString = 
    title.match(/ 시즌( |)[0-9]+( |$)/) || 
    title.match(/ [0-9]+기( |$)/) || 
    title.match(/ Season( |)[0-9]+( |$)/);  //todo: 일본어에서 1기는??
    if(seasonString)
      return title.replace(seasonString[0], '');
    else
      return title;
  }

  getCleanTokens(title) {
    return title.replace(/[:-]/g, '').split(' ').filter(el => el);
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
      for(let i = 0; i < numberOrRoot; i++) {
        if(!div) {
          console.warn(`did not reched the number of numberOrRoot: ${i}/${numberOrRoot}!`);
          break;
        }
        div = div.parentNode;
      }

    return div;
  }

  getTextFromNode_(el = null) {
    let result = null;

    if(el)
      result = el.innerText || el?.alt || el?.getAttribute('aria-label') || el.querySelector('img')?.alt;

    //console.debug('on getTextFromNode_(), title, el:', result, el);
    return result;
  }

  getIdFromValidUrl_(validUrl = null) {
    return validUrl ? validUrl.split('/').pop().split('?')[0] : null;
  }

  getImdbUrlFromId_(id, title) {
    let url = null;
    if(id && id != 'n/a')
      url = 'https://www.imdb.com/title/' + id;
    else
      url = 'https://www.imdb.com/find?s=tt&q=' + encodeURIComponent(title);

    return url;
  }

  isValidRating_(rating = 'n/a') {
    return rating != 'n/a' && !isNaN(parseFloat(rating))
  }


  ////other publics
  async edit(el, onSite) {
    const otCache = await GM_getValue(GM_CACHE_KEY);  //exported earlier

    const baseEl = fy.getParentsFrom_(el, fy.numberToBaseEl+1);

    //determine single-page
    const rule = fy.selectorsForSinglePage || fy.selectorsForLargeDiv;  //either not and/or

    //console.debug('el, baseEl:', el, baseEl);
    let isSinglePage = false;
    if((rule.determinePathnameBy && document.location.pathname.startsWith(rule.determinePathnameBy)) ||
      (rule?.determineSinglePageBy == true) ||
      (!rule.determinePathnameBy && baseEl.querySelector(rule?.determineSinglePageBy) == el.parentNode))
      isSinglePage = true;
    //console.debug('isSinglePage:', isSinglePage);

    let selectors = rule;
    if(!isSinglePage)
      selectors = fy.selectorsForListItems;

    const type = fy.getTypeFromDiv_(selectors, baseEl);

    //search title, etc
    let url, title, otDatum;

    //캐시에 있다면 사용.
    const titleEl = baseEl.querySelector(selectors.title);
    title = fy.getTextFromNode_(titleEl);
    //console.debug('title, type, otDatum on edit():', title, type, otDatum);
    if(!otDatum)
      otDatum = otCache[title] || {};

    //search target el (fyItem. the last element)
    //console.debug('selectors.targetEl, baseEl', selectors.targetEl, baseEl);
    const targetEl = baseEl.querySelector(selectors.targetEl) || baseEl;
    //console.debug('selectors.targetEl, baseEl, targetEl', selectors.targetEl, baseEl, targetEl);

    //get input
    let imdbId, imdbUrl;
    if(onSite == 'ot') {
      url = prompt("Enter proper JustWatch url: ", otDatum.otUrl);
      if(!url)
        return;
      else if(!url.startsWith('https://www.justwatch.com/')) {
        alert('Not a valid Watcha Pedia url. it should be "https://pedia.watcha.com/en-KR/contents/WP_CODE" format!');
        return;
      }
      url = url.trim().replace(/\/\?.*$/, '').replace(/\/$/, '');

      if(url == otDatum.otUrl) {
        if(otDatum.otFlag != '') {
          toast.log('JW flag was reset (JW url is confirmed).');
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
        //if(otDatum.imdbFlag != '') {
          toast.log('imdb flag was reset (imdb url is confirmed).');
          otDatum.imdbFlag = '';
        //}
        //else
          //return;
      }
    }

    //change flow
    fy.observer.disconnect();
    fy.search([targetEl], {title, url, type, imdbId, imdbUrl, forceUpdate: true, selectors});
  }

  xhrAbort() {
    fy.XHR.abort();
    fy.isFetching = false;
  }


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


  //more common utils
  async fetchAll(urls, headers = {}, querys = [], constQuery = {}) {
    fy.isFetching = true;

    const results = [];
    const promises = urls.map(async (url, i) => {
      results[i] = await fetchOne_(url, headers, querys[i], constQuery);
    });
    await Promise.all(promises);

    fy.isFetching = false;
    return results;


    async function fetchOne_(url, headers, query, constQuery) {
      //쿼리가 있으면 POST + json
      return new Promise((resolve, reject) => {
        if(!url)
          resolve(null);
        else {
          //console.debug('fetching', url);  //dev+++

          //detail object. see https://wiki.greasespot.net/GM.xmlHttpRequest
          let payload = {
            method: 'GET',
            headers: headers,
            url: url,
            onload: res => {
              resolve(res.responseText);
            },
            onerror: err => {
              reject(err);
            },
          };

          if(query) {
            payload.method = 'POST';  //헤더에 json 생략해도 작동하는 거 확인
            payload.responseType = 'json';
            payload.onload = res => {
              resolve(JSON.parse(res.responseText));
            };

            const params = constQuery;
            params.query = query;
            //console.debug('query', query);  //dev+++
            payload.data = JSON.stringify(params);
          }

          fy.XHR = GM_xmlhttpRequest(payload);
        }
      });
    }
  }

}


//first init and run
unsafeWindow.fy = new FyGlobal();
unsafeWindow.fyWP = new ParseWP();
unsafeWindow.fyJW = new ParseJW();
unsafeWindow.fyImdbRun = new ImdbRun();
fy.run();
