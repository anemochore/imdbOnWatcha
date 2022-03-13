const FY_UNIQ_STRING = 'fy-item';

const SETTINGS = {};

SETTINGS['watcha.com'] = {
  includingPaths: ['/browse', '/explore', '/watched', '/wishes', '/watchings', '/search', '/ratings', '/arrivals', '/staffmades', '/contents', '/people'],
  //todo:  '/tutorial'],
  //todo: excludingSectionTexts = ['새로 올라왔어요', '추천 리스트', '혼자 보기 아쉬울 때, 같이 봐요 우리!'],
  rootSelector: 'main',
  selector: 'section:not([class$="BrowseSection"]) ul>li>article[class*="-Cell"]:not(['+FY_UNIQ_STRING+'])>a>div',  //list item (parent of parent of IMG)
  singlePageSelector: 'main>div:not(['+FY_UNIQ_STRING+'])>div[class]>div',  //single page (parent of parent of IMG)
  titleSelector: 'div[aria-hidden]>p, img[alt], h4[class]',  //order: list item, on large div, on main screen
  largeDivSelector: 'section>div>div.enter-done>div.enter-done',  //parent of parent of parent of IMG (this is not for single page)
  selectRuleOnUpdateDiv: {
    numberToParent: 2,
    selector: 'div.'+FY_UNIQ_STRING,
  },
  selectRuleOnEdit: {
    numberToParent: 2,
    selector: 'a>div',
  },
};

SETTINGS['m.kinolights.com'] = {
  includingPaths: ['/title'],
  rootSelector: 'html',
  titleSelector: 'h3.title-kr',
  largeDivSelector: 'div.movie-title-wrap',  //selector is not used for kino
  preventMultipleUrlChanges: true,  //hack for kino
  selectRuleOnUpdateDiv: {
    selector: 'span.imdb-wrap>div.score'
  },
  selectRuleOnEdit: {
    root: 'main',
    selector: 'div.movie-title-wrap',
  },
};