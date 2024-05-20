// ==UserScript==
// @name         imdb on watcha_jw
// @namespace    http://tampermonkey.net/
// @version      0.7.19
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
// @require      https://anemochore.github.io/imdbOnWatcha/fixesJW.js
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
const toast = new FadingAlert();
toast.log();


//global consts
const GM_CACHE_KEY = 'OT_CACHE_WITH_IMDB_RATINGS';

const UPDATE_INTERVAL_DAYS_ORG_TITLES = 30;  //in days
const UPDATE_INTERVAL_DAYS_IMDB_VISITED = 7;  //in days
const YEAR_DIFFERENCE_THRESHOLD = 5;  //if year difference is larger than this const, discard it.

const OT_URL = `https://apis.justwatch.com/graphql`;

class FyGlobal {

  async run() {
    fy.site = document.location.host;

    //for this.edit(), etc
    unsafeWindow.GM_getValue = GM_getValue;
    unsafeWindow.GM_setValue = GM_setValue;

      //imdb 접속 시 캐시 업데이트
    if(fy.site == 'www.imdb.com') {
      fyImdbRun.imdbRun();
      return;
    }

    if(!SETTINGS[fy.site]) return;

    toast.log('fy script started.');

    //set locale
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
    if(fy.locale == fy.lang) fy.locale = fy.locale + '_' + fy.country;

    //load setting
    for(const [k, v] of Object.entries(SETTINGS[fy.site]))
      this[k] = v;

    this.search = this.searchByTitle;
    this.handler = this.handlers[fy.site] || this.defaultHandler;
    this.preUpdateDivs = this.preUpdateDivses[fy.site] || this.defaultBaseElementProc;
    this.largeDivUpdate = this.largeDivUpdates[fy.site];

    //numberToBaseEl 자동으로 지정
    if(isNaN(fy.numberToBaseEl)) {
      if(fy.selector) {
        let tSelector = fy.selector.split(',')[0]  //selector가 여러 개일 때까지는 지원하지 않음.
        .split(FY_UNIQ_STRING).pop();
        fy.numberToBaseEl = tSelector.match(/[^(]>/g)?.length || 1;  //fy-item 이후 > 개수
        console.debug('numberToBaseEl was auto calculated based on selector:', fy.numberToBaseEl);
      }
      else {
        fy.numberToBaseEl = 1;
        console.debug('numberToBaseEl was not specified. set to default:', fy.numberToBaseEl);
      }
    }

    //global vars & flags
    this.prevLocation = document.location;
    this.isFetching = false;
    this.isUpdatingLargeDiv = false;
    this.indexCaches = [];
    this.keyCaches = [];

    //캐시 없으면 생성
    const tempCache = await GM_getValue(GM_CACHE_KEY);
    if(!tempCache) {
      await GM_setValue(GM_CACHE_KEY, {});
    }
    /*
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
    */

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
    if(isExit || fy.isFetching) return;

    //entry point
    let selector = fy.selector || '';
    if(fy.selectorOnSinglePage) selector += ', ' + fy.selectorOnSinglePage;
    selector = selector.replace(/^, /, '');

    if(fy.preventMultipleUrlChanges) fy.isFetching = true;  //hack for kino

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
          toast.log('on excluding page, curLocation');
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
          toast.log('not in including page:', curLocation);
          result = true;
        }
      }

      return result;
    }
  }

  defaultHandler = async (m, o) => {
    fy.observer.disconnect();

    if(document.location.pathname.startsWith(fy.selectorsForSinglePage.determinePathnameBy)) {
      let largeDiv = fy.root.querySelector(fy.selectorOnSinglePage)
      || fy.root.querySelector(fy.selectorOnSinglePage.replace(`:not([${FY_UNIQ_STRING}])`, ''));
      if(largeDiv && largeDiv.closest(`[${FY_UNIQ_STRING}]`)) {
        //if already updated, no more update when scrolling, etc
        console.info('large-div already updated.');
        if(fy.singlePageWithoutListItems) {
          toast.log();
          fy.observer.observe(fy.root, fy.observerOption);
          return;
        }
      }
      else if(!fy.isUpdatingLargeDiv) {
        console.info('(possibly) waiting for large-div...');

        fy.isUpdatingLargeDiv = true;
        largeDiv = await elementReady(fy.selectorOnSinglePage, fy.root);
        let largeDivTargetEl = largeDiv;
        if(fy.selectorsForSinglePage.targetEl) {
          largeDivTargetEl = await elementReady(fy.selectorsForSinglePage.targetEl, fy.root);
        }
        await fy.largeDivUpdate(largeDivTargetEl);
        fy.observer.disconnect();  //observer was connected during largeDivUpdate()
      }
      //else is not happening
    }

    await fy.handlerWrapUp(fy.selectorsForListItems);
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
        let largeDiv = fy.root.querySelector(fy.selectorOnSinglePage);
        if(!largeDiv)
          largeDiv = await elementReady(fy.selectorOnSinglePage, fy.root);

        //wait for lazy loading
        await elementReady(fy.selectorForSinglePage.year, fy.root);

        //업데이트를 안 했을 때만 업데이트
        const selectors = fy.selectorForSinglePage;
        const baseEl = getParentsFrom_(largeDiv, fy.numberToBaseEl);
        await elementReady(selectors.title, baseEl);  //title이 img라 늦게 로딩됨
        await fy.largeDivUpdate(largeDiv);
      }
      else {
        await fy.handlerWrapUp(fy.selectorsForListItems);
      }
    },
  };

  handlerWrapUp = async (selectors) => {
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

      const wpId = getIdFromValidUrl_(document.location.href);
      const title = getTextFromNode_(getParentsFrom_(largeDiv, selectors.numberToBaseEl).querySelector(selectors.title));
      const type = getTypeFromDiv_(selectors, getParentsFrom_(largeDiv, selectors.numberToBaseEl));
      const wpUrl = 'https://pedia.watcha.com/en-US/contents/' + wpId;  //english page

      toast.log(`scraping wp for org. title, etc for ${title} (${wpId})...`);
      //연도를 얻어내서 jw 검색 정확도를 높이는 게 주목적이다. 무조건 스크레이핑하는 게 좀 걸리긴 하네...
      const otScrapeResults = await fetchAll([wpUrl], {
        headers: {'Accept-Language': 'en-US'},
      });

      const watchaLargeOtData = [{wpId, wpUrl, type}];
      await fyWP.parseWpScrapeResults_(otScrapeResults, watchaLargeOtData, type != 'Movie');
      const [orgTitle, year] = [watchaLargeOtData[0].orgTitle, watchaLargeOtData[0].year];
      console.log(`org. title scraping on wp done on single page: ${orgTitle} (${year}) type: ${watchaLargeOtData[0].type} `);

      //type이 스크레이핑 중 바뀌는 일은... 없겠지 아마...
      await fy.largeDivUpdateWrapUp(largeDiv, {selectors, wpId, wpUrl, orgTitle, year, type});
    },

    'm.kinolights.com': (largeDiv) => {
      //on single content page
      const selectors = fy.selectorsForSinglePage;

      const orgTitle = getTextFromNode_(largeDiv.querySelector(selectors.orgTitle)).replace(/ ·$/, '');
      const year = parseInt(getTextFromNode_(largeDiv.querySelector(selectors.year)));
      const imdbRating = getTextFromNode_(largeDiv.querySelector('.imdb-wrap>.score'))?.replace(/ ·$/, '');

      fy.largeDivUpdateWrapUp(largeDiv, {selectors, orgTitle, year, imdbRating});
    },

    'www.netflix.com': (largeDiv) => {
      //on large div (=single content) page
      const selectors = fy.selectorForSinglePage;
      const baseEl = getParentsFrom_(largeDiv, fy.numberToBaseEl);

      const year = parseInt(getTextFromNode_(baseEl.querySelector(selectors.year)));

      fy.largeDivUpdateWrapUp(largeDiv, {selectors, year});
    },

    'www.wavve.com': async (largeDiv) => {
      //on large div (=single content) page
      const selectors = fy.selectorsForSinglePage;

      //이미 업데이트된 상태에서 url이 바뀌었다면 fy-item을 제거
      const fyItem = document.querySelector('.'+FY_UNIQ_STRING);
      if(fyItem) fyItem.parentNode.removeChild(fyItem);

      //lazy loading이 극심해서 제목을 여기서 처리-_-
      const titleEl = await elementReady(selectors.title, largeDiv); //, {notCountEmpty: true});
      const title = getTextFromNode_(titleEl);

      const year = [...largeDiv.querySelectorAll('dd')].filter(el => el.innerText.startsWith('개봉연도:'))[0]?.innerText.split(':').pop().trim() ||  //my
      document.querySelector('table.detail-info-table>tr>th+td')?.innerText.split(',').pop().split('~')[0].trim();  //large-div

      await fy.largeDivUpdateWrapUp(largeDiv, {selectors, title, year});
    },

    'www.disneyplus.com': (largeDiv) => {
      //제목, 타입 등 여기서 처리하는 게 더 편해서...
      const title = document.head.querySelector('title').textContent.replace(' | 디즈니+', '');
      const metaSelector = 'script[type="application/ld+json"]';
      const metaEl = document.head.querySelector(metaSelector);
      const meta = JSON.parse(metaEl.textContent);

      let type = meta['@type'];
      if(type == 'WebSite')  //왜 website???
        type =  'TV Series';

      const year = null;  //todo

      fy.largeDivUpdateWrapUp(largeDiv, {selectors, title, type, year});
    }
  };

  largeDivUpdateWrapUp = async (largeDiv, trueData) => {
    const baseEl = getParentsFrom_(largeDiv, trueData.selectors.numberToBaseEl || fy.numberToBaseEl);
    if(!trueData.type)  //watcha는 이미 가져온 상태라 패스
      trueData.type = getTypeFromDiv_(trueData.selectors, baseEl);

    let sEl = baseEl.querySelector(`.${FY_UNIQ_STRING}`);
    let otFlag, imdbFlag, forceUpdate = true;
    if(sEl) {
      //already updated (maybe)
      otFlag = sEl.querySelector('.fy-external-site')?.getAttribute('flag');
      imdbFlag = sEl.querySelector('.fy-imdb-rating')?.getAttribute('flag');
    }
    else {
      //not yet updated (first loading). watcha
      if(trueData.wpId) {
        const cache = await fy.getObjFromWpId_(trueData.wpId);
        otFlag = cache.otFlag;
        imdbFlag = cache.imdbFlag;

        if(otFlag == '' && imdbFlag == '') {
          forceUpdate = false;  //캐시가 건강하다면(수동 수정되었을 수도 있고) 강제 업데이트는 안 함
        }
      }
    }

    //ot 플래그가 ?/??이거나 imdb 플래그가 ?/??면 다시 검색. 혹은 아직 업데이트가 안 됐더라도.
    if(otFlag != '' || imdbFlag != '' || !sEl) {
      toast.log(`large div on single-page update triggered. forceUpdate: ${forceUpdate}`);
      trueData.forceUpdate = forceUpdate;
      await fy.search([largeDiv], trueData);
    }
    else {
      console.debug('nothing to do on large-div update.');
      toast.log();
    }
  };

  defaultBaseElementProc = (itemDivs, numberToBaseEl) => {
    itemDivs.forEach((item, i) => {
      const baseEl = getParentsFrom_(item, numberToBaseEl);

      //console.debug('preupdate: item, baseEl, numberToBaseEl', item, baseEl, numberToBaseEl, baseEl.getAttribute(FY_UNIQ_STRING));
      if(baseEl.getAttribute(FY_UNIQ_STRING) == null) {
        baseEl.setAttribute(FY_UNIQ_STRING, '');
        if(!fy.noAppendDiv) {
          const infoEl = document.createElement('div');
          infoEl.classList.add(FY_UNIQ_STRING);
          infoEl.classList.add(fy.site.replace(/\./g, '_'));
          baseEl.insertBefore(infoEl, baseEl.firstChild);
        }
      }
    });
  };

  preUpdateDivses = {
  };

  async searchByTitle(itemDivs, trueData = {}) {
    const otCache = await GM_getValue(GM_CACHE_KEY);

    let otData = [];
    let allTitles = Array(itemDivs.length).fill(null);  //all titles
    let titles = Array(itemDivs.length).fill(null);     //titles to search

    fy.preUpdateDivs(itemDivs, trueData.selectors.numberToBaseEl || fy.numberToBaseElWhenUpdating || fy.numberToBaseEl);

    //get titles, etc
    itemDivs.forEach((item, i) => {
      const baseEl = item.closest(`[${FY_UNIQ_STRING}]`);
      //const baseEl = getParentsFrom_(item, fy.numberToBaseEl);

      let title = trueData.title;
      if(!title && baseEl)
        title = getTextFromNode_(querySelectorFiFo_(baseEl, trueData.selectors.title));
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

      //year 구할 수 있으면 구한다(일단은 왓챠 /search)
      if(!trueData.year && trueData.selectors.year) {
        let year = querySelectorFiFo_(baseEl, trueData.selectors.year);
        if(year) {
          year = year.innerText
          .replace(/^.+ · /, '');  //for watcha /search page
          if(!isNaN(parseInt(year))) 
            otData[i].year = year;
        }
      }

      //타입 얻기. 왓챠 보관함과 /search
      let type = getTypeFromDiv_(trueData.selectors, baseEl);
      if(type && !type.startsWith('not ')) {
        //캐시에 타입이 없거나, 캐시가 의심스러우면 목록의 타입(not으로 안 시작하는) 사용
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
    if(trueData.wpId) {  //watcha
      otData[0].wpId = trueData.wpId;
      otData[0].wpUrl = getWpUrlFromId_(trueData.wpId);
    }
    if(trueData.jwUrl) {  //edit
      otData[0].jwUrl = trueData.jwUrl;
    }

    //imdb manual update (edit)
    if(trueData.imdbId) {
      otData[0].imdbId = trueData.imdbId;
      otData[0].imdbUrl = trueData.imdbUrl;
    }

    //kino update
    if(trueData.orgTitle && trueData.imdbRating) {
      //첫 검색이 실패했을 때 목록 데이터가 있다면 쓴다(and 조건이라 키노만 해당할 듯).
      if(!otData[0].orgTitle)   otData[0].orgTitle = trueData.orgTitle;
      if(!otData[0].imdbRating) otData[0].imdbRating = trueData.imdbRating;
    }

    //찾을 제목에 대해 내부 캐시 적용.
    let searchLength = fy.setInternalCache_(titles, otData);

    if(searchLength == 0) {
      console.log(`nothing to search or scrape on jw.`);
    }
    else {  //if(!trueData.id) {
      //업데이트
      toast.log(`getting infos from jw... length: ${searchLength}`);

      const qTitles = titles.map(title => title ? fy.getCleanTitle(title) : null);
      const urls = qTitles.map(title => title ? OT_URL: null)
      const otSearchResults = await fetchAll(urls, {}, qTitles);

      await fyJW.parseJwSearchResults_(otSearchResults, otData, trueData, titles);
      searchLength = otSearchResults.filter(el => el).length;
      if(searchLength == 0) {
        console.log('jw searching result is empty.');
      }
      else {
        console.log(`jw searching done (or passed): ${searchLength}`);
      }
    }

    await fy.searchWrapUp_(itemDivs, otData, trueData);
  }

  async searchWrapUp_(itemDivs, otData, trueData) {
    //내부 캐시 사용했다면 적용
    fy.getInternalCache_(otData);

    //change flow: update divs
    await fy.updateDivs(itemDivs, otData, trueData.selectors);
  }

  async updateDivs(itemDivs, otData, selectors = {}) {
    for(const [i, item] of itemDivs.entries()) {
      await updateDiv_(item, otData[i], itemDivs.length, selectors);
    }
    toast.log(itemDivs.length + ' divs updated!');

    //캐시 반영
    await setGMCache_(GM_CACHE_KEY, otData);

    //wrap up
    if(fy.isUpdatingLargeDiv && itemDivs.length == 1) fy.isUpdatingLargeDiv = false;
    toast.log();
    if(!fy.preventMultipleUrlChanges) fy.observer.observe(fy.root, fy.observerOption);

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

    async function updateDiv_(fyItemToUpdate, otDatum = {}, totalNumber, selectors) {
      const baseEl = fyItemToUpdate.closest(`[${FY_UNIQ_STRING}]`);
      let div = baseEl.querySelector(`.${FY_UNIQ_STRING}`);
      if(fy.numberToBaseElWhenUpdating) div = getParentsFrom_(baseEl, numberToParent);

      //hack for kino
      if(fy.noAppendDiv) div = baseEl.querySelector(fy.selectorsForSinglePage?.targetEl);

      /*
      let numberToParent = fy.numberToBaseElWhenUpdating || (fy.numberToBaseEl + 1);
      if(selectors.determineSinglePageBy || selectors.determinePathnameBy)
        numberToParent = selectors.numberToBaseEl || numberToParent;

      let baseEl = getParentsFrom_(fyItemToUpdate, numberToParent);
      let divs = baseEl.querySelectorAll('div.'+FY_UNIQ_STRING);
      */

      /*
      if(!divs && selectors.async) {
        divs = await elementReady('div.'+FY_UNIQ_STRING);
      }
      */

      /*
      //ul>li 같은 경우 방지... 일단은 watcha용(search 페이지)
      if(divs?.length > 1 && baseEl.tagName == 'UL') {
        baseEl = getParentsFrom_(fyItemToUpdate, numberToParent - 1);
        divs = baseEl.querySelectorAll('div.'+FY_UNIQ_STRING);
      }
      */

      /*
      let div = divs ? divs[0] : null;
      if(!div) {
        if(totalNumber > 1) div = baseEl.querySelector(fy.selectorsForListItems?.targetEl);
        else                div = baseEl.querySelector(fy.selectorsForSinglePage?.targetEl);
      }
      */

      if(!div) {
        console.warn('no (fy-item) sub-div found for ', fyItemToUpdate);
        console.debug('baseEl', baseEl);
        return;
      }
      else if(otDatum.otFlag == '???') {
        return;
      }

      let flag = otDatum.otFlag || '';
      let year = otDatum.year || '';
      let targetInnerHtml = '';

      if(otDatum.jwUrl) targetInnerHtml += `<a href="${otDatum.jwUrl}" target="_blank">`;

      targetInnerHtml += `<span class="fy-external-site" year="${year}" flag="${flag}">[JW]${flag}</span>`;

      if(otDatum.jwUrl) targetInnerHtml += `</a>`;

      targetInnerHtml += `<a href="javascript:void(0);" onClick="fy.edit(event, 'ot')" class="fy-edit">edit</a> `;

      let label = 'n/a';
      if(otDatum.imdbRatingFetchedDate) {
        let yourDate = new Date(otDatum.imdbRatingFetchedDate);

        const offset = yourDate.getTimezoneOffset();
        yourDate = new Date(yourDate.getTime() - (offset*60*1000));
        label = yourDate.toISOString().split('T')[0];  //Date to yyyy-mm-dd
      }

      let rating = 'n/a', ratingCss = 'na';
      if(otDatum.imdbRating == '??') {
        rating = '??';  //possibly not yet updated
        otDatum.imdbFlag = '';  //???? -> ??
      }
      else if(otDatum.imdbRating == 'visit') {
        rating = 'visit';
      }
      else if(isValidRating_(otDatum.imdbRating)) {
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
      if(otDatum.imdbUrl) targetInnerHtml += `<a href="${otDatum.imdbUrl}" target="_blank" title=${label}>`;

      targetInnerHtml += `<span class="fy-external-site">[</span><span class="fy-imdb-rating over-${ratingCss}" flag="${flag}">${rating}${flag}</span><span class="fy-external-site">]</span>`;

      if(otDatum.imdbUrl) targetInnerHtml += `</a>`;

      targetInnerHtml += `<a href="javascript:void(0);" onClick="fy.edit(event, 'imdb')" class="fy-edit">edit</a> `;

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
    if(cache.orgTitle) {
      //단, 캐시가 오래되었다면 다시 페칭.
      if(dateDiffInDays(new Date(), new Date(cache.imdbRatingFetchedDate)) > UPDATE_INTERVAL_DAYS_ORG_TITLES) {
        console.debug(`cache for ${value} is over than ${UPDATE_INTERVAL_DAYS_ORG_TITLES} days. so updating now...`);
        return value;
      }
      else if((cache.otFlag + cache.imdbFlag).length > 1) {
        //ot flag와 imdb flag 합쳐서 ??보다 많으면 페칭
        return value;
      }
      else {
        console.debug(`cache for ${value} will be used. org-title: ${cache.orgTitle} (${cache.year})`);
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


  ////other publics
  async edit(event, onSite) {
    //event.preventDefault();  //not working
    const el = event.target;
    const otCache = await GM_getValue(GM_CACHE_KEY);  //exported earlier

    const baseEl = el.closest(`[${FY_UNIQ_STRING}]`);
    const selectors = fy.selectorsForListItems || fy.selectorsForSinglePage;  //latter is for kino only

    let targetEl = baseEl;
    //hack for kino
    //if(fy.noAppendDiv) targetEl = baseEl.querySelector(fy.selectorsForSinglePage?.targetEl);
    console.debug('baseEl, targetEl on edit', baseEl, targetEl);

    //search title, etc
    const type = getTypeFromDiv_(selectors, baseEl);
    let url, title, otDatum;

    //캐시에 있다면 사용.
    const titleEl = querySelectorFiFo_(baseEl, selectors.title);
    title = getTextFromNode_(titleEl);
    if(!otDatum) otDatum = otCache[title] || {};

    //get input
    let imdbId, imdbUrl, jwUrl;
    if(onSite == 'ot') {
      url = prompt("Enter proper JustWatch url: ", otDatum.jwUrl);
      if(!url) {
        console.debug('no input.');
        return;
      }
      else if(!url.startsWith('https://www.justwatch.com/')) {
        alert('Not a valid jw url!');
        return;
      }
      url = url.trim().replace(/\/\?.*$/, '').replace(/\/$/, '');

      if(url == otDatum.jwUrl || decodeURIComponent(url) == otDatum.jwUrl) {
        if(otDatum.otFlag != '') {
          toast.log('JW flag was reset (JW url is confirmed).');
          otDatum.otFlag = '';
        }
        else {
          console.debug('input was the same as the cache.');
          return;
        }
      }
      jwUrl = url;
    }
    else if(onSite == 'imdb') {
      imdbUrl = prompt("First make sure that JW info is correct. If so, enter proper IMDb title url: ", otDatum.imdbUrl);
      if(!imdbUrl)
        return;
      else if(!imdbUrl.startsWith('https://www.imdb.com/title/')) {
        alert('Not a valid IMDb title url. it should be "https://www.imdb.com/title/IMDB_ID" format!');
        return;
      }
      imdbUrl = imdbUrl.trim().replace(/\/\?.*$/, '').replace(/\/$/, '');
      imdbId = getIdFromValidUrl_(imdbUrl);

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
    fy.search([targetEl], {title, jwUrl, type, imdbId, imdbUrl, forceUpdate: true, selectors});
  }

  xhrAbort() {
    fy.XHR.abort();
    fy.isFetching = false;
  }


  //utils used for watcha
  async getObjFromWpId_(id) {
    const otCache = await GM_getValue(GM_CACHE_KEY);
    const cacheTitles = Object.keys(otCache);
    const cacheIds = Object.values(otCache).map(el => el.wpUrl ? getIdFromValidUrl_(el.wpUrl) : null);

    const idIndex = cacheIds.indexOf(id);
    if(idIndex > -1) {
      const title = cacheTitles[idIndex];
      //return {[title]: otCache[title]};
      return otCache[title];
    }
    else
      return {};
  }
}


//first init and run
unsafeWindow.fy = new FyGlobal();
unsafeWindow.fyWP = new ParseWP();
unsafeWindow.fyJW = new ParseJW();
unsafeWindow.fyImdbRun = new ImdbRun();
fy.run();
