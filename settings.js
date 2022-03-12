const FY_UNIQ_STRING = 'fy-item';  //should be the same as css. don't change.

const SETTINGS = {};

SETTINGS['watcha.com'] = {
  includingPaths: ['/browse', '/explore', '/watched', '/wishes', '/watchings', '/search', '/ratings', '/arrivals', '/staffmades', '/contents', '/people'],
  //todo:  '/tutorial'],
  //todo: excludingSectionTexts = ['새로 올라왔어요', '추천 리스트', '혼자 보기 아쉬울 때, 같이 봐요 우리!'],
  rootSelector: 'main',
  selector: 'ul>li>article[class*="-Cell"]:not(['+FY_UNIQ_STRING+'])>a>div, img[alt]',  //first: list item(parent of parent of IMG), second: large div on single page
  titleSelector: 'div[aria-hidden]>p, img[alt], h4[class]',  //order: list item, on large div, on main screen
  largeDivSelector: 'section>div>div.enter-done>div.enter-done',  //parent of parent of parent of IMG (this is not for single page)
  specialSelector: {
    numberToParent: 2,
    selector: 'div',
  },
};

SETTINGS['m.kinolights.com'] = {
  includingPaths: ['/title'],
  rootSelector: 'html',
  titleSelector: 'h3.title-kr',
  largeDivSelector: 'div.movie-title-wrap',  //selector is not used for kino
  specialSelector: 'span.imdb-wrap>div.score',
  preventMultipleUrlChanges: true,  //hack for kino
};