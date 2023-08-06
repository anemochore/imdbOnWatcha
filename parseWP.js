class ParseWP {
  //parsing and scraping funcs
  async parseWpScrapeResults_(results, otData, needToGetSeason1 = false) {
    console.log('otData[0]', otData[0])
    let toReSearch = [], localResults = results.slice();

    const END_COUNT = 33;  //The Simpsons (as of 2022-4-29)
    let count = 1;
    while(count < END_COUNT) {
      count++;

      localResults.forEach((result, i) => {
        if(!result)  //아예 찾을 필요가 없는 애들
          return;  //continue

        let targetDoc = new DOMParser().parseFromString(result, 'text/html');

        //to make selecting easier
        [...targetDoc.querySelectorAll('style[data-emotion-css]')].forEach(el => {
          el.remove();
        });

        let [orgTitle, tempYear] = targetDoc.title
        .replace(/ - Watcha Pedia$/, '').replace(/ - 왓챠피디아$/, '').replace(/\)$/, '').split(' (');
        const oldTitle = orgTitle;

        let loadedInEnglish = true;
        if(!targetDoc.documentElement.lang.startsWith('en')) loadedInEnglish = false;

        //wp는 원제를 따로 표시한다. 근데 imdb 가이드에 따르면 제목은 iso-8859-1만 쓴다.
        //https://help.imdb.com/article/contribution/titles/title-formatting/G56U5ERK7YY47CQB#
        const possibleRealOrgTitle = targetDoc.querySelector('h1+div')?.textContent;
        if(possibleRealOrgTitle && orgTitle != possibleRealOrgTitle) {
          orgTitle = possibleRealOrgTitle;

          if(!isAllLatinChars(orgTitle)) {
            if(loadedInEnglish) {
              orgTitle = oldTitle;
            }
            else {
              console.warn(`when scraping, wp was loaded in non-English language and org. title is non-English (${possibleRealOrgTitle}). exact match may not possible`);
            }
          }
        }

        const seriesH2 = [...targetDoc.querySelectorAll('header>h2')].filter(el => el.innerText == 'Series' || el.innerText == '시리즈');
        if(seriesH2.length > 0)
          otData[i].type = 'TV Series';

        let found = false;
        if(needToGetSeason1) {
          //wp id search
          let newId, newUrl;
          if(otData[i].type == 'TV Series') {
            let possibleSeason = oldTitle.match(/ Season ([0-9]+)$/);
            if((!possibleSeason && seriesH2.length == 0) || (possibleSeason && parseInt(possibleSeason[1]) == 1)) {
              //'시즌 2' 식으로 안 끝나고 다른 시리즈 정보도 없다면, 혹은 시즌 1이라면.
              toReSearch[i] = null;
              found = true;
            }

            if(!found) {
              const seriesSection = seriesH2[0].closest('section');
              const season1div = [...seriesSection.querySelectorAll('ul>li div[class*="StyledText"]')].filter(el => el.innerText.endsWith(' Season 1') || el.innerText.endsWith(' 1기'));
              if(season1div.length > 0) {
                newId = getIdFromValidUrl_(season1div[0].closest('a').href);
                newUrl = getUrlFromId_(newId);
                console.log(`found season 1 url for ${orgTitle}: ${newId}. will be re-scraped...`); 

                found = true;
                otData[i].wpId = newId;
                otData[i].wpUrl = newUrl;
                toReSearch[i] = newUrl;
              }
            }

            if(!found) {
              console.warn(`cannot find season 1 when scraping on ${newUrl ? newUrl + ' on ' + otData[i].wpUrl : otData[i].wpUrl}. so assumes the current page is the season 1 page.`);
              //console.debug(targetDoc.documentElement.outerHTML);
              otData[i].otFlag = '?';
            }
          }
        }

        if(orgTitle == '' || !tempYear) {
          console.debug('scraping failed on', otData[i].wpUrl);
          otData[i].otFlag = '???';  //왓챠 '이어보기' 항목
          toReSearch[i] = null;

          return;  //continue
        }

        otData[i].orgTitle = orgTitle;  //여기선 원제 뒤에 시즌 1 붙은 걸 굳이 바꾸지 않음. 뒤에서 바꿈.
        otData[i].year = parseInt(tempYear);
      });

      if(toReSearch.filter(el => el).length == 0)
        break;  //for while

      localResults = await fetchAll(toReSearch), {
        headers: {'Accept-Language': 'en-KR'},  //not working
      };
    }  //of while

    function isAllLatinChars(str) {
      //https://stackoverflow.com/a/32851131/6153990
      return !/[^\u0000-\u00ff]/g.test(str);
    }
  }
}