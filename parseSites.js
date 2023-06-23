class ParseSites {
  //parsing and scraping funcs
  async parseWpSearchResults_(results, otData, trueData, titles, needsEngSearch = false) {
    for await(const [i, result] of results.entries()) {
      const title = titles[i];
      if(!result) {
        if(title) {
          console.warn('search for',title,'on wp failed! no result at all!');
          otData[i].otFlag = '??';
        }
        continue;  //continue
      }

      let movieString = '영화', tvString = 'TV 프로그램';
      const targetDoc = new DOMParser().parseFromString(result, 'text/html');
      if(targetDoc.documentElement.lang != 'ko-KR') {
        console.debug('wp loaded in not Korean (ko-KR) when searching. so exact match is not possible for',title);
        otData[i].otFlag = '?';
        movieString = 'Movies', tvString = 'TV Shows';
      }

      //to update cache
      otData[i].query = title;

      //to make selecting easier
      [...targetDoc.querySelectorAll('style[data-emotion-css]')].forEach(el => {
        el.remove();
      });

      const selector = 'div[class*="StyledTabContentContainer"] section>section';
      let sDivs = [...targetDoc.querySelectorAll(selector)];

      let sUrls = [], sTitles = [], sYears = [], sTypes = [];

      const headerSelector = 'header>h2';
      if(sDivs[0] && !sDivs[0].querySelector(headerSelector))  //최상위 섹션의 중요도를 낮춤(검색 정확도를 높이기 위해). ex: 주(咒)
        sDivs.push(sDivs.shift())

      //최상위 섹션('콘텐츠', 영화, TV 프로그램만 처리
      sDivs.forEach((sDiv, j) => {
        const header = sDiv.querySelector(headerSelector);
        //첫 번째(최상위) 섹션은 헤더가 없음
        let info;
        if(!header) {  // && j == 0) {
          info = [...sDiv.querySelectorAll('ul>li>a>div:last-child')];
          sUrls.push(...info.map(el => el.parentNode.getAttribute("href")));  //no .href
          sTypes.push(...info.map(el => el.lastChild.innerText).map(el => getType_(el)));
        }
        else if(header.innerText == movieString || header.innerText == tvString) {
          info = [...sDiv.querySelectorAll('ul>li>a>div:last-child>div[class]')];
          sUrls.push(...info.map(el => el.parentNode.parentNode.getAttribute("href")));  //no .href
          sTypes.push(...Array(info.length).fill(header.innerText).map(el => getType_(el)));
        }

        if(info) {
          info = info.map(el => [...el.childNodes]);
          sTitles.push(...info.map(el => el[0].innerText));
          sYears.push(...info.map(el => el[1].innerText.split(' ・ ')[0]));
          if(!sTypes[sYears.length-1]) {
            sTypes.push(...info.map(el => {
              const typeText = el[2]?.innerText;
              if(typeText)
                return getType_(typeText);
            }));
          }
        }

        function getType_(str) {
          if(str == movieString)   return 'Movie';
          else if(str == tvString) return 'TV Series';
          else                    return null;
        }
      });

      //영화나 TV 프로그램이 아니면 제외. 중복 항목(url이 프라이머리 키)도 제외
      for(let j=0; j < sUrls.length; j++)
        if((sTypes[j] != 'Movie' && sTypes[j] != 'TV Series') || sUrls.slice(0, j).includes(sUrls[j]))
          sUrls[j] = sTitles[j] = null;

      if(sUrls.length == 0) {
        console.warn(title, 'seems not found on wp!');
        //console.debug(targetDoc.documentElement.outerHTML);
        console.debug('check this url: https://pedia.watcha.com' + targetDoc.head.querySelector('link[href^="/ko-KR/search?query="]').getAttribute('href'));  //no .href
        otData[i].otFlag = '??';
        continue;  //continue
      }
      sUrls = sUrls.map(el => el ? 'https://pedia.watcha.com' + el : null);

      let idx = -1, firstNotNullIdx = -1, exactMatchCount = 0, idxForSeason1, possibleIdxWithSameDate, closeDate = 9999, possibleIdxWithCloseDate;
      sTitles.forEach((sTitle, j) => {
        if(sTitle) {
          let found = false;
          if((!trueData.type || (trueData.type == 'TV Series' && sTypes[j] == 'TV Series')) && !title.startsWith('극장판 ')) {
            //TV물이면(혹은 type을 아예 모르면) 제목이 일치하거나 '시즌 1' 등 붙인 거랑 일치해야 함(연도 무관!).
            if(sTitle == title || sTitle == title + ' 시즌 1' || sTitle == title + ' Season 1' || sTitle == title + ' 1기' || (trueData.type == 'TV Series' && sTitle == title + ' 1')) {
              found = true;
            }
            else if(sTitle.endsWith(' 시즌 1') || sTitle.endsWith('Season 1') || sTitle.endsWith(' 1기'))
              if(!idxForSeason1)
                idxForSeason1 = j;
          }
          else {
            if(sTitle == title) {
              //TV물이 아니면 제목이 일치해야 함. trueYear가 있다면 아이템의 연도와도 일치해야 함.
              found = true;
              if(trueData.year && trueData.year != sYears[j]) {
                found = false;
                const curCloseDate = Math.abs(trueData.year - sYears[j]);
                if(curCloseDate < closeDate) {
                  closeDate = curCloseDate;
                  possibleIdxWithCloseDate = j;
                }
              }
            }
            else if(trueData.year == sYears[j]) {
              //제목이 일치하는 게 없으면 연도 일치하는 거라도 건지자... 첫 번째만.
              if(!possibleIdxWithSameDate)
                possibleIdxWithSameDate = j;
            }
          }

          if(found) {
            if(idx == -1) {
              idx = j;
              otData[i].otFlag = '';
            }
            exactMatchCount++;
          }
        }
      });
      const titleForWarning = `${title} (trueYear: ${trueData.year}, trueType: "${trueData.type}")`;
      if(exactMatchCount > 1) {
        needsEngSearch = false;
        console.warn(`${exactMatchCount} multiple exact matches for ${titleForWarning} found on wp. so taking the first result: ${sTitles[idx]}`);
        otData[i].otFlag = '?';
      }
      else if(idx == -1) {
        if(!isNaN(parseInt(idxForSeason1))) {
          needsEngSearch = false;
          idx = idxForSeason1;
          if(!trueData.type) {
            idx = 0;
            console.warn(`${titleForWarning} is maybe TV series. so taking the first result with 'season 1': ${sTitles[idx]}`);
            otData[i].otFlag = '?';
          }
        }
        else {
          if(needsEngSearch) {
            //영어 페이지 검색해도 결과 없음(영어 페이지에도 제목은 한국어로 나오므로 정확한 비교는 불가능)
            needsEngSearch = false;

            if(possibleIdxWithSameDate) {
              idx = possibleIdxWithSameDate;
              console.warn(`${titleForWarning} seems not found on wp among many (or one). so just taking the first result with the same date: ${sTitles[idx]}`);
              otData[i].otFlag = '?';
            }
            else {
              idx = 0;
              console.warn(`${titleForWarning} seems not found on wp among many (or one) and Eng-page-searching yields no match either. so just taking the first result: ${sTitles[idx]}`);
              if(sTitles.filter(el => el).length == 1) otData[i].otFlag = '?';
              else otData[i].otFlag = '??';
            }
          }
          else {
            //검색 결과 없음. 아직 영어 페이지 검색은 안 했지만...
            if(!trueData.orgTitle) {
              //원제가 없다면 영어 페이지 검색도 불가능
              if(possibleIdxWithCloseDate) {
                console.warn(`${titleForWarning} seems not found on wp among many (or one). so just taking the first result with the closest date: ${sTitles[idx]}`);
                idx = possibleIdxWithCloseDate;
                otData[i].otFlag = '?';
              }
              else {
                idx = 0;
                console.warn(`${titleForWarning} seems not found on wp among many (or one) and Eng-page-searching is not possible (no org title). so just taking the first result: ${sTitles[idx]}`);
                if(sTitles.filter(el => el).length == 1) otData[i].otFlag = '?';
                else otData[i].otFlag = '??';
              }
            }
            else {
              //원제가 있다면(키노) 원제로 영어 페이지 재검색
              console.warn(`${titleForWarning} seems not found on wp among many (or one). so re-searching Eng-page with org title: ${trueData.orgTitle}...`);

              const titlesforEngSearch = [];
              titlesforEngSearch[i] = trueData.orgTitle;

              const ENG_SEARCH_PREFIX = 'https://pedia.watcha.com/en-KR/search?query=';
              const engOtSearchResults = await fy.fetchAll(titlesforEngSearch.map(title => title ? ENG_SEARCH_PREFIX + encodeURIComponent(title.replace(/\./g, '')) : null), {
                headers: {'Accept-Language': 'en-KR'},  //헤더가 안 먹히는지 한국어로 나오므로 원제 비교는 불가능...
              });
              needsEngSearch = true;
              await fy.parseWpSearchResults_(engOtSearchResults, otData, trueData, titlesforEngSearch, needsEngSearch);
            }
          }
        }
      }
      else {
        //검색 결과 있음
        needsEngSearch = false;
      }

      if(!needsEngSearch) {
        const id = fy.getIdFromValidUrl_(sUrls[idx]);
        otData[i].id = id;
        otData[i].otUrl = fy.getUrlFromId_(id);
        otData[i].type = sTypes[idx];
      }
    }
  }

  async parseWpScrapeResults_(results, otData, allTitles, needToGetSeason1 = false) {
    let toReSearch = [], localResults = results.slice();

    const END_COUNT = 33;  //The Simpsons (as of 2022-4-29)
    let count = 1;
    while(count < END_COUNT) {
      count++;

      localResults.forEach((result, i) => {
        if(!result)  //아예 찾을 필요가 없는 애들
          return;  //continue

        let targetDoc = new DOMParser().parseFromString(result, 'text/html');

        let [orgTitle, tempYear] = targetDoc.title
        .replace(/ - Watcha Pedia$/, '').replace(/ - 왓챠피디아$/, '').replace(/\)$/, '').split(' (');
        const oldTitle = orgTitle;

        let loadedInEnglish = true;
        if(!targetDoc.documentElement.lang.startsWith('en')) {
          console.debug(`wp loaded in not English when scraping: ${targetDoc.documentElement.lang}. exact match may not possible if the org. title is non-English: ${orgTitle}`);
          loadedInEnglish = false;
        }

        //wp는 원제를 따로 표시한다. 근데 imdb 가이드에 따르면 제목은 iso-8859-1만 쓴다.
        //출처: https://help.imdb.com/article/contribution/titles/title-formatting/G56U5ERK7YY47CQB#
        const possibleRealOrgTitle = targetDoc.querySelector('div[class*="-Summary"]')?.firstChild.textContent;  //innerText 아님
        if(possibleRealOrgTitle && orgTitle != possibleRealOrgTitle) {
          if(isAllLatinChars(possibleRealOrgTitle) || !loadedInEnglish)
            orgTitle = possibleRealOrgTitle;

          function isAllLatinChars(str) {
            //https://stackoverflow.com/a/32851131/6153990
            return !/[^\u0000-\u00ff]/g.test(str);
          }
        }

        const seriesH2 = [...targetDoc.querySelectorAll('header>h2')].filter(el => el.innerText == 'Series');
        if(seriesH2.length > 0)
          otData[i].type = 'TV Series';

        let found = false;
        if(needToGetSeason1) {
          //wp id search
          let newId, newUrl;
          if(otData[i].type == 'TV Series') {
            let possibleSeason = oldTitle.match(/ Season ([0-9]+)$/);
            if((!possibleSeason && seriesH2.length == 0) || (possibleSeason && parseInt(possibleSeason[1]) == 1)) {
              //'시즌 2' 식으로 안 끝나고 하단에 다른 시리즈 정보도 없다면, 혹은 시즌 1이라면.
              toReSearch[i] = null;
              found = true;
            }

            if(!found) {
              const seriesSection = seriesH2[0].parentNode.parentNode.parentNode.parentNode;
              const season1div = [...seriesSection.querySelectorAll('ul>li div[class*="StyledText"]')].filter(el => el.innerText.endsWith(' Season 1'));
              if(season1div.length > 0) {
                newId = fy.getIdFromValidUrl_(season1div[0].parentNode.parentNode.parentNode.href);
                newUrl = fy.getUrlFromId_(newId);
                console.log(`found season 1 url for ${orgTitle}: ${newId}. will be re-scraped...`); 

                found = true;
                otData[i].id = newId;
                otData[i].otUrl = newUrl;
                toReSearch[i] = newUrl;
              }
            }

            if(!found) {
              console.warn('cannot find season 1 when scraping on', newUrl ? newUrl + ' on ' + otData[i].otUrl : otData[i].otUrl);
              console.debug(targetDoc.documentElement.outerHTML);
              otData[i].otFlag = '?';
            }
          }
        }

        if(orgTitle == '' || !tempYear) {
          console.debug('scraping failed on', otData[i].otUrl);
          otData[i].otFlag = '???';  //왓챠 '이어보기' 항목
          toReSearch[i] = null;

          return;  //continue
        }

        otData[i].orgTitle = orgTitle;  //여기선 원제 뒤에 시즌 1 붙은 걸 굳이 바꾸지 않음. 뒤에서 바꿈.
        otData[i].year = parseInt(tempYear);
      });

      if(toReSearch.filter(el => el).length == 0)
        break;  //for while

      localResults = await fy.fetchAll(toReSearch), {
        headers: {'Accept-Language': 'en-KR'},
      };
    }  //of while
  }
}