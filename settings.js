const FY_UNIQ_STRING = 'fy-item';

const SETTINGS = {};

SETTINGS['watcha.com'] = {
  includingPaths: ['/browse', '/explore', '/watched', '/library', '/watchings', '/search', '/ratings', '/arrivals', '/staffmades', '/contents', '/people'],
  rootSelector: 'main',
  selector: 'section:not([class$="BrowseSection"]) ul>li>div[class*="-Cell"]:not(['+FY_UNIQ_STRING+'])>a[class]:not([href^="/browse/tag"]):not([href^="/people/"])>div:not(:has(>figure))',  //list item
  selectorOnSinglePage: 'header>div>section:not(['+FY_UNIQ_STRING+'])>div>h1',  //single-page
  //large-div is removed at 2022 1Q

  //numberToBaseEl: 2,  //when edit, this number + 1 is used

  selectorsForListItems: {
    id: 'a[href^="/contents/"], a[href^="/watch/"]',  //the latter is for /watchings page
    title: 'div[aria-hidden]>p',
    targetEl: 'a[class]>div',  //targetEl is for edit()
    types: {  //either use types or isTVSeries
      selector: 'div+p+p',
      mapping: {'영화': 'Movie', 'TV 프로그램': 'Tv Series'},  //미니 시리즈는 어쩔...
    },
  },

  //more selectors are hard-coded. below are mainly for edit() on single-page
  selectorsForSinglePage: {
    determinePathnameBy: '/contents/',  //exceptionally, this is for updating large_div
    determineSinglePageBy: 'section>div',  //if edit link is the child of this el (ie. fy-item), it is single-page
    title: 'h1',
    isTVSeries: {
      numberToBaseEl: 1,
      selector: 'h1+p>span',
      contains: /시즌 \d+개/,
    },
    targetEl: 'section>div>h1',  //this should not be omitted.
    numberToBaseEl: 3,  //this is not used when edit
    //if id is not provided, use document url instead
    //id: 'a[href^="/watch/"]',  //this is not used when edit
  },
};


SETTINGS['m.kinolights.com'] = {
  includingPaths: ['/title'],
  rootSelector: 'html',
  selectorOnSinglePage: 'div.movie-title-wrap',  //'selector' is not used for kino
  preventMultipleUrlChanges: true,  //hack for kino

  numberToBaseEl: 'html',

  selectorsForSinglePage: {
    determineSinglePageBy: true,  //force single-page
    title: 'h3.title-kr',
    isTVSeries: {
      selector: 'span.tv-label',
      contains: 'TV',
    },
    orgTitle: 'p.metadata>span:first-child',
    year: 'p.metadata>span:last-child',
    targetEl: '.imdb-wrap>div.score',
  },
};


SETTINGS['www.netflix.com'] = {
  includingPaths: ['/browse', '/latest', '/my-list', '/search', '/title'],
  rootSelector: 'body',

  //'the last element'(fyItem) selection.
  selector: 'div.title-card-container:not(['+FY_UNIQ_STRING+'])>div[id]>div.ptrack-content',
  //In above case,
  //div.title... will be set FY_UNIQ_STRING, so it should be 'the base element' and 
  //div.ptrack... will be 'the last element'.
  //After updating, 'the base element' will have 'the info element'(.fy-item) child.
  //Where to put FY_UNIQ_STRING? It depends on clickability and aesthetics.

  largeDivSamePathName: true,  //hack for netflix

  //numberToBaseEl: 2,  //in this case, 'the base element' is the 2nd parent of 'the last element'.

  selectorsForListItems: {
    title: 'a[href^="/watch/"]:not([class*="playLink"])',  //this should be the child of 'the last element'.
    targetEl: 'div[id]>div.ptrack-content',
  },

  //large-div works like a single-page. don't use both.
  selectorOnLargeDiv: 'div.previewModal--container:not(['+FY_UNIQ_STRING+'])>div.previewModal--player_container>div.videoMerchPlayer--boxart-wrapper',

  //more selectors are hard-coded. below are mainly for edit()
  selectorsForLargeDiv: {
    determineSinglePageBy: 'div.previewModal--container>div',
    title: 'h3>strong',
    year: 'div.videoMetadata--second-line>div.year',
    isTVSeries: {
      selector: 'div.videoMetadata--second-line>span.duration',
      contains: /시즌 \d+개/,
    },
    targetEl: 'div.previewModal--player_container>div.videoMerchPlayer--boxart-wrapper',
  },
};


SETTINGS['www.wavve.com'] = {
  includingPaths: ['/player', '/my'], 
  rootSelector: 'div#app',

  //'the last element'(fyItem) selection.
  selector: 'div.wrap>ul>li>div.portrait:not(['+FY_UNIQ_STRING+'])>a.con-text-wrap, ' + //my/like_movie
  'div.swiper-wrapper>div:not(['+FY_UNIQ_STRING+'])>div.portrait',  //my/
  //numberToBaseEl: 1,  //in this case, 'the base element' is the 1st parent of 'the last element'.

  selectorsForListItems: {
    title: 'strong.con-tit, span.title1',  //this should be the child of 'the last element'.
    targetEl: 'a.con-text-wrap, div.portrait',  //'the last element'
  },

  //large-div works like a single-page. don't use both.
  selectorOnSinglePage: 'section.player-contents>div.video-wrap:not(['+FY_UNIQ_STRING+'])',

  //more selectors are hard-coded. below are mainly for edit()
  selectorsForSinglePage: {
    determinePathnameBy: '/player/',  //exceptionally, this is for updating large_div
    determineSinglePageBy: 'div',
    title: 'h1>em',
    isTVSeries: {
      numberToBaseEl: 2,
      selector: 'div.player-nav>ul>li',
      contains: '에피소드',
    },
    targetEl: 'section.player-contents>div.video-wrap>div',  //class of last div varies.
  },
};


SETTINGS['www.disneyplus.com'] = {
  preventMultipleUrlChanges: true,  //hack 

  //no '/ko-kr/search' page
  includingPaths: ['/ko-kr/watchlist', '/ko-kr/character', '/ko-kr/character', '/ko-kr/originals', '/ko-kr/movies', '/ko-kr/home'],  //todo: '/ko-kr/series',
  rootSelector: 'div#webAppRoot',

  //'the last element'(fyItem) selection.
  selector: 'div.gv2-asset:not(['+FY_UNIQ_STRING+'])>a',
  //numberToBaseEl: 1,

  selectorsForListItems: {
    title: 'div[aria-label]',  //this should be the child of 'the last element'.
    //when targetEl is omitted, baseEl will be used.
  },

  //large-div works like a single-page. don't use both.
  selectorOnSinglePage: 'section.vod-player:not(['+FY_UNIQ_STRING+'])',  //wip

  //more selectors are hard-coded. below are mainly for edit()
  selectorsForSinglePage: {
    determinePathnameBy: '/player/',  //exceptionally, this is for updating large_div
    determineSinglePageBy: 'div.video-wrap',  //if edit link is the child of this el, it is single-page
    title: 'h1>span',
    isTVSeries: {
      numberToBaseEl: 1,
      selector: 'div.player-nav>ul>li',
      contains: '에피소드',
    },
    targetEl: 'section.vod-player',
  },
  
};