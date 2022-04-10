const FY_UNIQ_STRING = 'fy-item';

const SETTINGS = {};

SETTINGS['watcha.com'] = {
  includingPaths: ['/browse', '/explore', '/watched', '/wishes', '/watchings', '/search', '/ratings', '/arrivals', '/staffmades', '/contents', '/people'],
  rootSelector: 'main',
  selector: 'section:not([class$="BrowseSection"]) ul>li>article[class*="-Cell"]:not(['+FY_UNIQ_STRING+'])>a[class]>div',  //list item
  selectorOnSinglePage: 'header>div>section:not(['+FY_UNIQ_STRING+'])>div>h1',  //single-page
  //large-div is removed at 2022 1Q

  numberToBaseEl: 2,  //when edit, this number + 1 is used

  selectorsForListItems: {
    id: 'a[href^="/contents/"]',
    title: 'div[aria-hidden]>p',
    targetEl: 'a[class]>div',
  },

  //more selectors are hard-coded. below are mainly for edit()
  selectorsForSinglePage: {
    determineSinglePageBy: 'section>div',  //if edit link is the child of this el, it is single-page
    id: 'a:not(fy-edit)',
    title: 'h1',
    isTVSeries: {
      selector: 'span',
      contains: /시즌 \d+개/,
    },
    targetEl: 'h1',
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
    orgTitle: 'h4.title-en',
    year: 'p.metadata>span:last-child',
    targetEl: 'span.imdb-wrap>div.score',
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

  numberToBaseEl: 2,  //in this case, 'the base element' is the 2nd parent of 'the last element'.

  selectorsForListItems: {
    title: 'a[href^="/watch/"]',  //this should be the direct child of 'the last element'.
    targetEl: 'div[id]>div.ptrack-content',
  },

  //large-div works like a single-page. don't use both.
  selectorOnLargeDiv: 'div.previewModal--container:not(['+FY_UNIQ_STRING+'])>div.previewModal--player_container>div.videoMerchPlayer--boxart-wrapper',

  //more selectors are hard-coded. below are mainly for edit()
  selectorsForLargeDiv: {
    determineSinglePageBy: 'div.previewModal--container>div',  //if edit link is the child of this el, it is single-page
    title: 'img.playerModel--player__storyArt',
    year: 'div.videoMetadata--second-line>div.year',
    isTVSeries: {
      selector: 'div.videoMetadata--second-line>span.duration',
      contains: /시즌 \d+개/,
    },
    targetEl: 'div.previewModal--player_container>div.videoMerchPlayer--boxart-wrapper',
  },
};