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

function elementReady(selector, baseEl, countEmpty = true) {
  return new Promise((resolve, reject) => {
    if (!baseEl)
      baseEl = document.documentElement;

    let els = [...baseEl.querySelectorAll(selector)];
    if(els.length > 0)
      resolve(els[els.length-1]);

    new MutationObserver(async (m, o) => {
      let els = [...baseEl.querySelectorAll(selector)];
      if (els.length > 0) {
        if (countEmpty || els.pop().childNodes.length > 0) {
          o.disconnect();
          resolve(els[els.length - 1]);
        }
      }
    })
      .observe(baseEl, {
        childList: true,
        subtree: true
      });
  });
}

async function fetchAll(urls, headers = {}, querys = [], constQuery = {}) {
  fy.isFetching = true;

  const results = [];
  const promises = urls.map(async (url, i) => {
    results[i] = await fetchOne_(url, headers, querys[i], constQuery);
  });
  await Promise.all(promises);

  fy.isFetching = false;
  return results;


  async function fetchOne_(url, headers, query, constQuery) {
    //쿼리가 있으면 POST + json
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

        if(query) {
          payload.method = 'POST';  //헤더에 json 생략해도 작동하는 거 확인
          payload.responseType = 'json';
          payload.onload = res => {
            resolve(JSON.parse(res.responseText));
          };

          const params = constQuery;
          params.query = query;
          //console.debug('query', query);  //dev+++
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
      els = [...div.querySelectorAll(nestedSelector.selector)];
    }
    else {
      els = [...baseEl.querySelectorAll(nestedSelector.selector)];
    }

    if(selectors.isTVSeries) {
      if(els.filter(el => el.innerText.match(nestedSelector?.contains)).length > 0)
        return 'TV Series';  //tv mini series는 어떡하냐 -_- 아오
      else
        return 'not TV Series';  //not tv series. should not be null
    }
    else if(selectors.types) {
      const key = els[0]?.innerText;
      return nestedSelector?.mapping[key];
    }
  }
  return null;
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

  if(el)
    result = el.innerText || el?.alt || el?.getAttribute('aria-label') || el.querySelector('img')?.alt;

  return result;
}

function getIdFromValidUrl_(validUrl = null) {
  //watcha and imdb only
  return validUrl ? validUrl.split('/').pop().split('?')[0] : null;
}

function getImdbUrlFromId_(id, title) {
  let url = null;
  if(id && id != 'n/a')
    url = 'https://www.imdb.com/title/' + id;
  else
    url = 'https://www.imdb.com/find?s=tt&q=' + encodeURIComponent(title);

  return url;
}

function getWpUrlFromId_(wpId) {
  return 'https://pedia.watcha.com/ko-KR/contents/' + wpId;
}

function isValidRating_(rating = 'n/a') {
  return rating != 'n/a' && !isNaN(parseFloat(rating))
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
