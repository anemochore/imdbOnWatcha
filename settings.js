const FY_UNIQ_STRING = 'fy-item';
let FU = FY_UNIQ_STRING;

const SETTINGS = {};

//see the comments in detail on neflix

SETTINGS['watcha.com'] = {
  includingPaths: ['/', '/browse/video', '/tag', '/explore', '/watched', '/library', '/watchings', '/search', '/ratings', '/arrivals', '/staffmades', '/contents', '/people', '/content_decks'],
  rootSelector: 'main',
  selector: `section:not([class$="BrowseSection"]) ul>li>div[class*="-Cell"]:not([${FU}])>a[class][href^="/contents/"]>div:not(:has(>figure)), `  //list item
  + `section>ul>li:not([${FU}])>a[href^="/contents/"]>div, `  //search
  + `section ul>li>article:not([${FU}])>a[href^="/contents/"]>div`,   //list item on single-page

  //numberToBaseEl: 2,  //when edit, this number + 1 is used (old)

  selectorsForListItems: {
    title: 'div[aria-hidden]>p, a>div>div:first-of-type',  //the latter is for /search page
    year: 'a>div>div+div>div+div',  //for /search page only
    types: {  //either use types or isTVSeries
      selector: 'div+p+p, a>div>div+div>div+div',  //the latter is for /search page
      mapping: {'영화': 'Movie', 'TV 프로그램': 'TV Series'},  //미니 시리즈는 어쩔...
    },
  },

  //singlePageWithoutListItems: false,  //no need since 23-10-29

  //more selectors are hard-coded. below are mainly for edit() on single-page
  selectorOnSinglePage: `section:not([${FU}])>div>div h1`,  //for single-page
  selectorsForSinglePage: {
    determinePathnameBy: '/contents/',
    title: 'h1',
    isTVSeries: {
      numberToBaseEl: 1,
      selector: 'h1+p>span',
      contains: /시즌 \d+개/,
    },
    numberToBaseEl: 2,  //this is not used when edit()
    //if id is not provided, use document url instead
    //id: 'a[href^="/watch/"]',  //this is not used when edit
  },
};


SETTINGS['m.kinolights.com'] = {
  includingPaths: ['/title'],
  rootSelector: 'html',
  selectorOnSinglePage: 'div.movie-title-wrap',  //'selector' is not used for kino
  preventMultipleUrlChanges: true,  //hack for kino
  noAppendDiv: true,  //hack for kino

  numberToBaseElWhenUpdating: 0,
  numberToBaseElWhenEditing: 'html',
  selectorsForSinglePage: {
    determineSinglePageBy: true,  //force single-page
    title: 'h2.title-kr',
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
  selector: `div.title-card-container:not([${FU}])>div[id]>div.ptrack-content`,
  //In above case,
  //div.title... will be set FU, so it should be 'the base element' and 
  //div.ptrack... will be 'the last element'.
  //After updating, 'the base element' will have 'the info element'(.fy-item) child.
  //Where to put FU? It depends on clickability and aesthetics.

  largeDivSamePathName: true,  //hack for netflix

  singlePageWithoutListItems: true,  //todo (23-10-29)

  //numberToBaseEl: 2,  //in this case, 'the base element' is the 2nd parent of 'the last element'.

  selectorsForListItems: {
    title: 'a[href^="/watch/"]:not([class*="playLink"])',  //this should be the child of 'the last element'.
  },

  //large-div works like a single-page. don't use both.
  selectorOnSinglePage: `div.previewModal--container:not([${FU}])>div.previewModal--player_container>div.videoMerchPlayer--boxart-wrapper`,

  //more selectors are hard-coded. below are mainly for edit()
  selectorForSinglePage: {
    determineSinglePageBy: 'div.previewModal--container>div',  //if edit link is the child of this el (ie. fy-item), it is single-page
    title: 'h3>strong',
    year: 'div.videoMetadata--second-line>div.year',
    isTVSeries: {
      selector: 'div.videoMetadata--second-line>span.duration',
      contains: /(시즌 \d+개|에피소드 \d+개)/,
    },
  },
};


SETTINGS['www.wavve.com'] = {
  includingPaths: ['/player', '/my', '/supermultisection'], 
  rootSelector: 'div#app',

  //'the last element'(fyItem) selection.
  selector: `div.wrap>ul>li>div.portrait:not([${FU}])>a.con-text-wrap, `  //my/like_movie
  + `div.swiper-wrapper>div:not([${FU}])>div.landscape, `                 //my/ upper
  + `div.swiper-wrapper>div:not([${FU}])>div.portrait`,                   //my/ lower

  /*
  elementReadyOption: {
    notCountEmpty: true,
  },
  */

  largeDivSamePathName: true,
  forceLargeDivUpdateOnUrlChange: true,  //force large-div update when url changing even if not when fetching

  selectorsForListItems: {
    title: 'strong.con-tit, span.title1, span.alt-text',  //this should be the child of 'the last element'.
  },

  //large-div works like a single-page. don't use both.
  selectorOnSinglePage: `section.player-contents>div.video-wrap:not([${FU}])`,

  //more selectors are hard-coded. below are mainly for edit()
  selectorsForSinglePage: {
    determinePathnameBy: '/player/',
    title: 'h1>em',
    isTVSeries: {
      numberToBaseEl: 2,
      selector: 'div.player-nav>ul>li',
      contains: '에피소드',
    },
    targetEl: `section.player-contents>div.video-wrap>div:not(.${FU})`,  //class of last div varies.
  },
};


SETTINGS['www.disneyplus.com'] = {
  //preventMultipleUrlChanges: true,  //hack 

  //no '/ko-kr/search' page
  includingPaths: ['/ko-kr/browse', '/ko-kr/character', '/ko-kr/originals', '/ko-kr/movies', '/ko-kr/home', '/ko-kr/series', '/ko-kr/movies'],
  rootSelector: 'div#webAppRoot',

  //'the last element'(fyItem) selection.
  //selector: `div.gv2-asset:not([${FU}])>a[data-gv2elementkey]>div.image-container`,
  selector: `section>div>div>div[data-testid="set-shelf-item"]:not([${FU}])>a[aria-label], `      //home list
  //+ `div[id^="hero-carousel"]>div[data-testid][aria-hidden="false"]:not([${FU}])>a[aria-label], ` //home upper
  + `div[id]>section>div[data-testid]:not([${FU}])>div>a[aria-label], `               //browse lower
  + `section[id="explore-ui-main-content-container"]:not([${FU}])>div>div>img[alt], ` //browse upper
  + `div:not([id="episodes"])>div>section>div[data-testid]:not([${FU}])>div>a[aria-label]`,  //watchlist
  numberToBaseElWhenUpdating: 0,

  elementReadyOption: {
    checkIfAllChildrenAreAdded: true,
  },

  selectorsForListItems: {
    ignoreStrings: [' STAR Original', ' Disney+ Original', '이 콘텐츠에 대한 정보를 보려면 선택하세요.'],
    title: 'a[aria-label], img[alt]',  //this should be the child of 'the last element' or itself!.
  },

  //large-div is not implemented. no need for now. 
};


SETTINGS['www.tving.com'] = {
  includingPaths: ['/', '/contents', '/movie', '/series', '/paramount'],
  rootSelector: 'main',  //required

  selector: `section>article>article>div:not([${FU}])>div:has(h2), `  //contents main
  + `div.swiper-wrapper>div.swiper-slide:not([${FU}])>a:has(dt), `     //contents lower
  + `div.swiper-wrapper>div.swiper-slide>div:not([${FU}])>a[class]+a:has(p.atom-text-wrapper), ` //movie, etc main
  + `div.swiper-wrapper>div.swiper-slide:not([${FU}])>a:only-child:has(p.atom-text-wrapper):not(:has(div.special-button-item-wrapper)):not(:has(div.live-ranking-item-wrapper)):not(:has(div.content-item-wrapper)):not([href^="/contents/E"])`, //movie, etc lower

  selectorsForListItems: {
    title: 'dt, p.atom-text-wrapper, p.item__title, img[alt]',  //prefer text
  },
}