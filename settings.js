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

  selectorsForSinglePage: {
    title: 'h2.title-kr',
    isTVSeries: {
      selector: 'span.tv-label',
      contains: 'TV',
    },
    meta: 'p.metadata>span',
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

  //numberToBaseEl: 2,  //in this case, 'the base element' is the 2nd parent of 'the last element'.

  selectorsForListItems: {
    //this should be the child of 'the last element'. the latter is for edit() of additional titles on large-div.
    title: 'a[href^="/watch/"]:not([class*="playLink"]), img[alt]',
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
    additionalSelector: {
      selector: `.moreLikeThis--container>.titleCard--container:not([${FU}])>div>div.ptrack-content`,
      title: 'img[alt]',
      year: 'div.year',
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
  includingPaths: ['/browse', '/home'],
  rootSelector: 'div#webAppRoot',

  //'the last element'(fyItem) selection.
  selector: `section>div>div>div[data-testid="set-shelf-item"]:not([${FU}])>a[aria-label][href^="/ko-kr/browse/entity-"], `      //main??
  + `div>div>section>div[data-testid]>div:not([${FU}])>a[aria-label][href^="/ko-kr/browse/entity-"]`,  //browse/... except large-div
  
  numberToBaseElWhenUpdating: 0,

  elementReadyOption: {
    checkIfAllChildrenAreAdded: true,
  },

  selectorsForListItems: {
    ignoreItemIfMatches: [/^STAR Original$/, / 예고편 콘텐츠를 시청하려면 선택하세요/, / 예고편$/],
    ignoreStrings: [' STAR Original', ' | 특별 영상', ': 특별 영상', ' Disney+ Original', '이 콘텐츠에 대한 정보를 보려면 선택하세요.'],
    title: 'a[data-item-id][aria-label], img:not([alt=""])',  //this should be the child of 'the last element' or itself!.
  },

  selectorOnSinglePage: `section#explore-ui-main-content-container:not([${FU}])>div`,  //browse/... large-div`,
  
  typePerPath: {
    '/ko-kr/browse/movies': 'Movie',
    '/ko-kr/browse/series': 'TV Series',
  },

  //year 등은 app.js에 하드코딩했음
  selectorsForSinglePage: {
    useHardcodedFunc: true,  //selectors를 안 쓸 때만.
  },
};
SETTINGS['www.disneyplus.com'].includingPaths = SETTINGS['www.disneyplus.com'].includingPaths.map(el => '/ko-kr' + el);


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
};


SETTINGS['uflix.co.kr'] = {
  includingPaths: ['/main', '/mine', '/search'],  //todo: '/genre', '/premium'],
  //rootSelector: 'div.outwrap',

  selector: `div.updatelist div.owl-item:not([${FU}])>li:has(a), `  //main
  + `div.medialist li.delete:not([${FU}])>a.photo_wrap, `  // mine
  + `div.resultlist>div.resultcon:not(:has(div.fy-temp)), `  // search(before hardcoded pre-proc in app.js)
  + `div.resultlist>div.resultcon:not([${FU}])>div.fy-temp`,  // search(after)

  selectorsForListItems: {
    ignoreItemIfMatches: ['유플레이 가입하기', '유플레이 소개 영상', /^\[유플레이\] /],
    ignoreStrings: ['(예고편)', '[우리말]'],
    title: `div.tit_caption>span, a>img[alt], `  //main
    + `span.title, a>img[alt], `  //mine
    + `div.title, div.resultpst>img[alt]`,  //search
    year: 'ul>li:last-of-type>span:last-of-type',
    getYearFromTitle: true,
    /*
    // 부정확해서 사용하지 않음
    types: {
      attribute: 'data-seriesyn',
      mapping: {'N': 'Movie', 'Y': 'TV Series'},
    }
    */
  },
};
SETTINGS['uflix.co.kr'].includingPaths = SETTINGS['uflix.co.kr'].includingPaths.map(el => '/uws/web' + el);


SETTINGS['www.coupangplay.com'] = {
  includingPaths: ['/my-profile', '/mylist', '/search', '/query'],

  preventMultipleUrlChanges: true,

  selector: `div[class^="MyProfile_mainContent__"]>div>div>ul>li:not([${FU}])>a[href^="/titles/"], `  //my-profile
  + `div[class*="TitleListContainer_gridContainer__"]>div[data-cy="titleListItem"]>div>div>div:not([${FU}])>a[href^="/titles/"],  `  //mylist
  + `div[class^="SearchTopTrending_topTrendingContainer__"]>div div:not([${FU}])>a[href^="/titles/"], `  //search
  + `div[class^="SearchResultGrouped_results__"]>div div:not([${FU}])>a[href^="/titles/"]`,  //query

  selectorsForListItems: {
    ignoreStrings: ['thumbnail '],
    title: `div>img[aria-label], `  //my-profile
    + `img[class^="TitleListItem_listItemThumbnail__"][alt], `  //mylist, search
    + `div>p[class^="CarouselThumbnail_spareContainerText__"]`,  //query
    types: {  //either use types or isTVSeries
      numberToBaseEl: 4,
      selector: 'div>h1[class^="SearchResultGrouped_rowTitle__"]',  //query page only
      mapping: {'스토어': 'Movie'},
    },
    getYearFromTitle: true,
  },

  typePerPath: {
    '/buy': 'Movie',
    '/movies': 'Movie',
  },
};