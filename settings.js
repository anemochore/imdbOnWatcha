const FY_UNIQ_STRING = 'fy-item';

const SETTINGS = {};

SETTINGS['watcha.com'] = {
  includingPaths: ['/browse', '/explore', '/watched', '/wishes', '/watchings', '/search', '/ratings', '/arrivals', '/staffmades', '/contents', '/people'],
  //todo:  '/tutorial'],
  rootSelector: 'main',
  selector: 'section:not([class$="BrowseSection"]) ul>li>article[class*="-Cell"]:not(['+FY_UNIQ_STRING+'])>a[class]>div, header>div>section>div>h1',  //list item, single-page
  //single page selectors are hard-coded in app.js. below two rules are for list items
  selectRuleOnGetTitleForListItems: {
    numberToParent: 2,
    selector: 'div[aria-hidden]>p',
  },
  selectRuleOnGetIdForListItems: {
    numberToParent: 2,
    selector: 'a[href^="/contents/"]',
  },
  selectRuleOnUpdateDiv: {
    numberToParent: 2,
    selector: 'div.'+FY_UNIQ_STRING,
  },
  selectRuleOnEdit: {
    numberToParent: 3,

    determineSinglePageBy: 'DIV',  //list-item is ARTICLE

    selectorsForSinglePage: {
      id: 'a:not(fy-edit)',
      title: 'h1',
      targetEl: 'h1',
    },

    selectorsForListItems: {
      id: 'a[href^="/contents/"]',
      title: 'div[aria-hidden]>p',
      targetEl: 'a[class]>div',
    },
  },
};

SETTINGS['m.kinolights.com'] = {
  includingPaths: ['/title'],
  rootSelector: 'html',
  titleSelector: 'h3.title-kr',
  largeDivSelector: 'div.movie-title-wrap',  //selector is not used for kino
  preventMultipleUrlChanges: true,  //hack for kino
  selectRuleOnUpdateDiv: {
    selector: 'span.imdb-wrap>div.score',  //hard-coded somewhat
  },
  selectRuleOnEdit: {
    root: 'main',
    determineSinglePageBy: true,  //force single-page

    selectorsForSinglePage: {
      title: 'h3.title-kr',
      targetEl: 'div.movie-title-wrap',
    },
  },
};

SETTINGS['www.netflix.com'] = {
  includingPaths: ['/browse', '/latest', '/my-list', '/search'],  //TODO: , '/title'],
  rootSelector: 'body',

  //'the last element'(fyItem) selection. From it the title should be able to be selected.
  selector: 'div.title-card-container:not(['+FY_UNIQ_STRING+'])>div[id]>div.ptrack-content',
  //In above case,
  //div.title... will be set FY_UNIQ_STRING, so it should be 'the base element' and 
  //div.ptrack... will be 'the last element'.
  //After updating, 'the base element' will have 'the info element'(.fy-item) child.
  //Where to put FY_UNIQ_STRING? It depends on clickability.

  titleSelector: 'a[href^="/watch/"]',  //this should be the direct child of 'the last element'.

  //'the info element' selection from 'the last element'
  selectRuleOnUpdateDiv: {
    numberToParent: 2,                //in this case, 'the base element' is the 2nd parent of 'the last element'.
    selector: 'div.'+FY_UNIQ_STRING,  //at there, 'the info element' can be directly selected.
  },

  //selection from the child(<a>edit</a>) of 'the info element'
  selectRuleOnEdit: {
    numberToParent: 2,
    //<a> is the direct child of 'the info element' and 'the info element' is the direct child of 'the base element' and 
    //title, etc elements can be selected from 'the base element'.

    selectorsForListItems: {
      title: 'a[href^="/watch/"]',
      targetEl: 'div[id]>div.ptrack-content',
    },
  },
};