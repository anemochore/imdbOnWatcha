//common global util classes
class FadingAlert {
  constructor() {
    this.div = document.createElement('div');
    this.div.id = 'alertBoxDiv';
    document.body.appendChild(this.div);

    const s = this.div.style;
    s.position = 'fixed';
    s.top = '40%';
    s.left = '45%';
    s.textAlign = 'center';
    s.width = '300px';
    s.height = 'auto';
    s.padding = '2px';
    s.border = 0;
    s.color = 'Black';
    s.backgroundColor = 'LawnGreen';
    s.overflow = 'auto';
    s.zIndex = '1000'; //z-index on css is 999

    this.log = async (...txt) => {
      if (txt.length == 0) {
        await sleep(1);
        this.div.style.opacity = 0;
        this.div.style.transition = 'opacity 2s ease-in';
      }
      else {
        this.div.textContent = txt.join(' ');
        this.div.style.transition = '';
        this.div.style.opacity = 1;
        console.log(...txt);
      }
    };
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function elementReady(selector, baseEl = document.documentElement, options = fy.elementReadyOption || {}) {
  return new Promise((resolve, reject) => {
    let els = [...baseEl.querySelectorAll(selector)];
    if(els.length > 0 && !options.waitFirst) {
      //console.debug('resolved at first call', els);
      if(options.returnAll) resolve(els);
      else resolve(els[els.length-1]);
    }

    //console.debug('this.prevElNumber, els.length', this.prevElNumber, els.length);
    this.prevElNumber = els.length;

    new MutationObserver(async (mutationRecords, observer) => {
      let els = [...baseEl.querySelectorAll(selector)];
      if(options.notCountEmpty || els.length > 0) {
        if(!options.checkIfAllChildrenAreAdded) {
          //console.debug('resolved for checkIfAllChildrenAreAdded false', els);
          observer.disconnect();
          if(options.returnAll) resolve(els);
          else resolve(els[els.length-1]);
        }
        else if(els.length >= this.prevElNumber) {
          this.prevElNumber = els.length;
          await sleep(1000);  //dirty hack
          if([...baseEl.querySelectorAll(selector)].length == this.prevElNumber) {
            //console.debug('resolved for checkIfAllChildrenAreAdded true', els);
            observer.disconnect();
            if(options.returnAll) resolve(els);
            else resolve(els[els.length-1]);
          }
        }
      }
    })
    .observe(baseEl, {
      childList: true,
      subtree: true
    });
  });
}

async function fetchAll(urls, headers = {}, querys = [], locale = {country: fy.country, lang: fy.lang}) {
  fy.isFetching = true;

  const results = [];
  const promises = urls.map(async (url, i) => {
    results[i] = await fetchOne_(url, headers, querys[i], locale);
  });
  await Promise.all(promises);

  fy.isFetching = false;
  return results;


  async function fetchOne_(url, headers, query, locale) {
    //query가 있으면 graphQL. headers는 무시함.
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

        //시즌 정보를 가져와도 원제 필드는 없고, 평점 역시 시즌별로 다르지 않고 모두 동일하게 나오므로 시즌별 쿼리는 포기.
        if(query) {
          payload.method = 'POST';  //헤더에 json 생략해도 될 듯??
          payload.headers = {"Content-Type": "application/json"};
          payload.responseType = 'json';
          payload.onload = res => {
            resolve(res.response);
          };

          //imdbVotes is included, but not used.
          const params = {
            "operationName": "GetSuggestedTitles",
            "variables": {
              "country": locale.country,
              "language": locale.lang,
              "first": 10,
              "filter": {
                "searchQuery": query
              }
            },
            "query": `query GetSuggestedTitles($country: Country!, $language: Language!, $first: Int!, $filter: TitleFilter) {
  popularTitles(country: $country, first: $first, filter: $filter) {
    edges {
      node {
        ...SuggestedTitle
        __typename
      }
      __typename
    }
    __typename
  }
}

fragment SuggestedTitle on MovieOrShow {
  id
  objectType
  objectId
  content(country: $country, language: $language) {
    fullPath
    title
    originalReleaseYear
    originalTitle
    scoring {
      imdbScore
      imdbVotes
      __typename
    }
    externalIds {
      imdbId
      __typename
    }
    __typename
  }
  __typename
}
`
          };
          payload.data = JSON.stringify(params);
        }

        fy.XHR = GM_xmlhttpRequest(payload);
      }
    });
  }
}


//small utils
function getTypeFromDiv_(selectors, baseEl) {
  let nestedSelector = selectors.isTVSeries || selectors.types;  //either. not and/or
  if(nestedSelector) {
    let els;
    if(nestedSelector.numberToBaseEl) {
      const div = getParentsFrom_(baseEl, nestedSelector.numberToBaseEl);
      els = [...querySelectorAllFiFo_(div, nestedSelector.selector)];
    }
    else {
      els = [...querySelectorAllFiFo_(baseEl, nestedSelector.selector)];
    }
    if(selectors.isTVSeries) {
      if(els.filter(el => el.innerText.match(nestedSelector?.contains)).length > 0)
        return 'TV Series';  //tv mini series는 어떡하냐 -_- 아오
      else
        return 'not TV Series';  //not tv series. should not be null
    }
    else if(selectors.types) {
      const key = els[0]?.innerText
      .replace(/ ·.+$/, '');  //for watcha /search page
      return nestedSelector?.mapping[key];
    }
  }
  //return null;
}

function getParentsFrom_(div, numberOrRoot) {
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

function getTextFromNode_(el = null) {
  let result = null;

  if(el) {
    //get self node's text only
    let child = el.firstChild, texts = [];
    while (child) {
        if (child.nodeType == 3) {
            texts.push(child.data);
        }
        child = child.nextSibling;
    }
    result = texts.join("");

    if(!result)
      result = el.alt || el.getAttribute('aria-label') || el.querySelector('img')?.alt || el.querySelector('a')?.getAttribute('aria-label') || el.innerText;
  }
  //console.debug(`el & result`, el, result);
  if(fy.selectorsForListItems?.ignoreStrings) {
    let ignoreStrings = fy.selectorsForListItems.ignoreStrings;
    if(!Array.isArray(fy.selectorsForListItems.ignoreStrings)) 
      ignoreStrings = [ignoreStrings];
    for(const ignoreString of ignoreStrings)
      result = result?.replace(ignoreString, '');
  }

  return result?.trim();
}

function getIdFromValidUrl_(validUrl = null) {
  //watcha and imdb only
  return validUrl ? validUrl.split('/').pop().split('?')[0] : null;
}

function getImdbUrlFromId_(id, orgTitle = null) {
  let url = null;
  if(id && id != 'n/a')
    url = 'https://www.imdb.com/title/' + id;
  else if(orgTitle)
    url = 'https://www.imdb.com/find?s=tt&q=' + encodeURIComponent(orgTitle);

  return url;
}

function getWpUrlFromId_(wpId) {
  return 'https://pedia.watcha.com/ko-KR/contents/' + wpId;
}

//common(?) publics
function getCleanTitle(title) {
  if(title) {
    title = title.replace(/^\[자막\] ?/, '').replace(/^\[더빙\] ?/, '');

    const seasonString = 
    title.match(/ 시즌( |)[0-9]+( |$)/) || 
    title.match(/ [0-9]+기( |$)/) || 
    title.match(/ Season( |)[0-9]+( |$)/);  //todo: 일본어에서 1기는??
    if(seasonString) title = title.replace(seasonString[0], '');
  }
  return title;
}

function getCleanTokens(title) {
  return title.replace(/[:-]/g, '').split(' ').filter(el => el);
}


function isValidRating_(rating = 'n/a') {
  return rating != 'n/a' && !isNaN(parseFloat(rating))
}

function querySelectorFiFo_(baseEl, selectors) {
  let result;
  for(const selector of selectors.split(', ')) {
    result = baseEl.querySelector(selector);
    if(result) break;
  }

  return result;
}

function querySelectorAllFiFo_(baseEl, selectors) {
  let results = [];
  for(const selector of selectors.split(', ')) {
    results = baseEl.querySelectorAll(selector);
    if(results.length > 0) break;
  }

  return results;
}

//others' small utils
function dateDiffInDays(a, b) {
  //https://stackoverflow.com/a/15289883/6153990
  // a and b are javascript Date objects
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}
