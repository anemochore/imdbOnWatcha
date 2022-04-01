const FY_UNIQ_STRING = 'fy-item';

const SETTINGS = {};

SETTINGS['watcha.com'] = {
  includingPaths: ['/browse', '/explore', '/watched', '/wishes', '/watchings', '/search', '/ratings', '/arrivals', '/staffmades', '/contents', '/people'],
  //todo:  '/tutorial'],
  //todo: excludingSectionTexts = ['새로 올라왔어요', '추천 리스트', '혼자 보기 아쉬울 때, 같이 봐요 우리!'],
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
    idSelector: 'a:not(fy-edit)',
    targetElSelectorForSinglePage: 'div>h1',
    targetElSelectorForListItem: 'a[class]>div',
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
    selector: 'div.movie-title-wrap',
  },
};