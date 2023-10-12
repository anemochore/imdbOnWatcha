class ParseJW {
  //parsing and scraping funcs
  async parseJwSearchResults_(results, otData, trueData, titles, reSearching = false) {
    for(const [i, r] of results.entries()) {
      const result = r?.data?.popularTitles?.edges.map(el => el.node);
      let title = titles[i];

      if(!title)
        continue;
      if(!result) {
        if(title) {
          console.warn('search for',title,'on jw failed! no result at all!');
          otData[i].otFlag = '??';
        }
        continue;
      }

      //todo: being tested...
      const fuzzyThresholdLength = 3;  //minimum length of title to which fuzzysort can applied.
      const fuzzyThresholdScore = -10000;  //score to exclude for bad results. 0 is exact match.
      const fuzzyThresholdRating = 4.1;  //discard result with rating less than this

      const YEAR_DIFFERENCE_THRESHOLD_RE_SEARCH = 2;  //accept re-search result with year-diffence less than this

      const tvString = 'SHOW';  //jw는 미니 시리즈와 그냥 tv 시리즈를 구분하지 않음.

      //to update cache
      otData[i].query = title;
      title = fy.getCleanTitle(title);

      let trueJwUrl = trueData.jwUrl;  //edit의 경우(캐시의 값을 쓰면 안 됨)
      let trueSeason = null;
      if(trueJwUrl) {
        //ex: https://www.justwatch.com/kr/TV-프로그램/mujigjeonsaeng-isegyee-gasseumyeon-coeseoneul-dahanda/시즌-1
        trueSeason = trueJwUrl.split('/').slice(6)[0];  //or null
        trueJwUrl  = trueJwUrl.split('/').slice(0, 6).join('/');
      }

      const trueOrgTitle = trueData.orgTitle;  //watcha/kino large-div 같은 경우(캐시의 값을 쓰면 안 됨)
      const trueImdbId = trueData.imdbId;  //watcha/kino large-div 같은 경우(캐시의 값을 쓰면 안 됨)
      const trueType = trueData.type || otData[i].type;
      const trueYear = trueData.year || otData[i].year;

      let cacheTrueImdbId = null;
      if(!trueData.imdbId && otData[i].imdbId && otData[i].imdbRating && otData[i].imdbVisitedDate) {
        //직접 imdb 방문한 게 캐시에 있다면, 검색이 실패할 경우 그걸 쓴다.
        cacheTrueImdbId = otData[i].imdbId;
      }

      //fields: ['id','full_path','title','object_type','original_release_year','scoring','external_ids','original_title'], (old)
      let sIds = result.map(el => el.objectId);  //not id.
      let sUrls = result.map(el => `https://www.justwatch.com${el.content.fullPath}`);
      let sTypes = result.map(el => el.objectType == tvString ? 'TV Series' : 'Movie');

      let sTitles =    result.map(el => el.content.title);
      let sYears =     result.map(el => el.content.originalRleaseYear);
      let sOrgTitles = result.map(el => el.content.originalTitle);

      let sRatings = result.map(el => el.content?.scoring?.imdbScore);  //scoring may not present
      let sImdbIds = result.map(el => el.content?.externalIds?.imdbId);  //this too??? idk.

      //for title fix
      const sourceWords = [...JW_TITLE_FIX_DICT.keys()], targetWords = [...JW_TITLE_FIX_DICT.values()];

      //todo: being improved...
      let idx = -1, exactMatchCount = 0, maybeIdxWithSameDateOrType = -1, possibleIdxWithCloseDate = -1, closeDate = 9999, tokenCount = 0;

      if(trueJwUrl && sUrls.includes(decodeURI(trueJwUrl))) {
        //jw url을 알고 있다면 끝~
        console.info('url was manually provided and actually found.', trueJwUrl+trueSeason);
        otData[i].otFlag = '';
        idx = sUrls.indexOf(decodeURI(trueJwUrl));
        sUrls[idx] = sUrls[idx] + (trueSeason ? '/' + decodeURI(trueSeason) : '');
      }
      else if(trueImdbId) {
        //imdb id를 알고 있다면
        if(sImdbIds.includes(trueImdbId)) {
          console.info('imdb id was manually provided and actually found:', trueImdbId);
          otData[i].otFlag = '';
          idx = sImdbIds.indexOf(trueImdbId);
        }
        else {
          console.warn(`imdb id ${trueImdbId} was manually provided, but not found in jw. so jw info is n/a and plz visit imdb page to get rating. :(`);
          otData[i] = {};
          otData[i].query = title;
          otData[i].otFlag = '??';
          otData[i].imdbId = trueImdbId;
          if(trueOrgTitle) otData[i].orgTitle = trueOrgTitle;
          if(trueYear)     otData[i].year = trueYear;
          otData[i].imdbUrl = getImdbUrlFromId_(trueImdbId);
          reSearching = 'no need';
        }
      }
      else {
        sTitles.forEach((sTitle, j) => {
          if(sTitle) {
            //title fix
            let fixedOrgTitle = sTitle;
            sourceWords.forEach((sourceWord, j) => {
              if((typeof sourceWord == 'string' && sTitle.includes(sourceWord)) || 
                (typeof sourceWord == 'object' && sTitle.match(sourceWord)))
                fixedOrgTitle = sTitle.replace(sourceWord, targetWords[j]);
            });
            if(fixedOrgTitle != sTitle) {
              console.info(`${sTitle} is fixed to ${fixedOrgTitle} via fixesJW.js`);
              sTitles[j] = fixedOrgTitle;
              sTitle = fixedOrgTitle;
            }

            const sOrgTitle = sOrgTitles[j];
            //console.debug('trueType, sTypes[j], title, sTitle, trueOrgTitle, sOrgTitle:', trueType, sTypes[j], '/', title, sTitle, '/', trueOrgTitle, sOrgTitle);
            let found = false;
            if(!trueType || (trueType.endsWith('Series') && sTypes[j] == 'TV Series' && !title.startsWith('극장판 '))) {
              //TV물이면(혹은 type을 아예 모르면) 제목(원제)이 일치해야 함(시즌 무시. 연도 무시)
              if(title == sTitle || title.replace(/\-/g, '~') == sTitle || trueOrgTitle?.replace(/～/g, '~') == sOrgTitle) {
                found = true;
              }
            }

            //console.debug('found:', found);
            if(!found) {
              if(title == sTitle || 
                title.replace(' - ', ': ') == sTitle || title.replace(': ', ' - ') == sTitle || 
                title.replace(/\-/g, '~') == sTitle || trueOrgTitle?.replace(/～/g, '~') == sOrgTitle) {
                //TV물이 아니거나 못 찾았으면, 제목(or 원제)이 일치하는 건 물론 trueYear가 있다면 연도도 일치해야 함.
                found = true;
                if(trueYear && trueYear != sYears[j]) {
                  found = false;
                  const curCloseDate = Math.abs(trueYear - sYears[j]);
                  if(curCloseDate < closeDate && isValidRating_(sRatings[j])) {
                    closeDate = curCloseDate;
                    possibleIdxWithCloseDate = j;
                  }
                }
              }
              else if(trueYear == sYears[j] && isValidRating_(sRatings[j])) {
                //제목이 일치하는 게 없으면 연도 일치하는 거라도 건지자... 첫 번째만.
                if(maybeIdxWithSameDateOrType == -1)
                  maybeIdxWithSameDateOrType = j;
              }
            }

            if(!found && trueType && !trueType.endsWith('Series')) {
              if(possibleIdxWithCloseDate == -1) {
                //날짜 비슷하면 manual fuzzy matching (tv 시리즈는 X)
                if(title.length > fuzzyThresholdLength) {
                  if(sTitle.replaceAll(' ', '') == title.replaceAll(' ', '')) {
                    found = true;
                    console.info(`spaces were ignored for ${title} and ${sTitle}`);
                  }
                  if(sTitle.replaceAll(':', '') == title.replaceAll(':', '')) {
                    found = true;
                    console.info(`colons were ignored for ${title} and ${sTitle}`);
                  }
                }
              }
            }

            if(found) {
              if(idx == -1 || !isValidRating_(sRatings[idx])) {
                idx = j;
                otData[i].otFlag = '';
              }
              exactMatchCount++;
            }
          }
        });

        console.debug('idx, exactMatchCount, possibleIdxWithCloseDate, maybeIdxWithSameDateOrType:', idx, exactMatchCount, possibleIdxWithCloseDate, maybeIdxWithSameDateOrType);
        const titleForWarning = `${title} (trueYear: ${trueYear}, trueType: "${trueType}")`;
        if(exactMatchCount > 1) {  //검색 결과 많음
          if(idx > -1) {
            console.debug(`mild warning: ${exactMatchCount} multiple exact title matches for ${title} found on jw.`);
            otData[i].otFlag = '';
          }
          else if(possibleIdxWithCloseDate > -1) {
            //true year가 있으면 연도 가까운 걸 선택
            idx = possibleIdxWithCloseDate;
            console.warn(`${exactMatchCount} multiple exact matches for ${titleForWarning} found on jw. so taking the first result with rating present and with the closest date: ${sOrgTitles[idx]} (${sYears[idx]}) id: ${sImdbIds[idx]}`);
            otData[i].otFlag = '';
          }
          else {
            //연도를 알 수 없으면 첫 번째 거(rating 있는 거)
            console.warn(`${exactMatchCount} multiple exact matches for ${titleForWarning} found on jw. so taking the first result with rating present: ${sOrgTitles[idx]} (${sYears[idx]}) id: ${sImdbIds[idx]}`);
            otData[i].otFlag = '?';
          }
        }
        else if(idx == -1) {  //검색 결과 없음
          if(reSearching) {
            //원제로 재검색 중인데 원제가 같고 날짜가 아주 비슷하면 그냥 걔 선택
            if(Math.abs(trueYear - sYears[possibleIdxWithCloseDate]) < YEAR_DIFFERENCE_THRESHOLD_RE_SEARCH) {
              idx = possibleIdxWithCloseDate;
              console.warn(`${title} (${trueYear}) is not found, but the same title (${sYears[idx]}) with rating is found. so taking it.`);
              otData[i].otFlag = '?';
            }
          }
          else if(cacheTrueImdbId) {
            //검색이 실패했지만, 직접 imdb 방문한 게 캐시에 있다면, 그걸 쓴다.
            console.log(`search failed. keep the healthy cache data with imdb id present (${cacheTrueImdbId}).`);
            reSearching = 'no need';
          }
          else if(trueOrgTitle && !reSearching) {
            //원제가 있다면 원제로 재검색
            toast.log('re-searching (using org. title) from jw again...');

            const URL = `https://apis.justwatch.com/content/titles/en_US/popular`;
            const qTitles = [trueOrgTitle];
            const urls = [URL];
            const otSearchResults = await fetchAll(urls, {}, qTitles, {
              fields: ['id','full_path','title','object_type','original_release_year','scoring','external_ids','original_title'],
              page_size: 10,  //hard limit
            });

            const localOtData = [{ ...otData[i]}];
            await fyJW.parseJwSearchResults_(otSearchResults, localOtData, trueData, [trueOrgTitle], true);
            const searchLength = otSearchResults.filter(el => el).length;
            if(searchLength == 0) {
              console.log('jw re-searching result is empty.');
              reSearching = 'pass';
            }
            else if(localOtData[i].imdbFlag == '??') {
              console.log('jw re-searching failed. :(');
              reSearching = 'pass';
            }
            else {
              localOtData[i].query = otData[i].query;
              otData[i] = {...localOtData[i]};
              console.log('jw re-searching done.');
              console.debug('jw re-searching result', otData[i]);
              reSearching = 'done';
            }
          }

          if(reSearching == false || reSearching == 'pass') {
            if(possibleIdxWithCloseDate > -1) {
              idx = possibleIdxWithCloseDate;
              console.warn(`${titleForWarning} seems not found on jw among many (or one). so just taking the first result with rating present and with the closest date: ${sOrgTitles[idx]} (${sYears[idx]}) id: ${sImdbIds[idx]}`);
              otData[i].otFlag = '?';
            }
            else {
              if(title.length > fuzzyThresholdLength) {
                //https://github.com/farzher/fuzzysort
                let first = fuzzysort.go(title, sTitles, {threshold: fuzzyThresholdScore});
                if(first.length > 0) {
                  console.debug('fuzzysort first result for title:', first);

                  first = first[0];
                  idx = sTitles.indexOf(first.target);

                  console.debug('after fuzzysort. sTitles[idx], sYears[idx], sOrgTitles[idx], sRatings[idx]:', sTitles[idx], sYears[idx], sOrgTitles[idx], sRatings[idx]);

                  if(maybeIdxWithSameDateOrType > -1 && maybeIdxWithSameDateOrType != idx) {
                    if(Math.abs(trueYear - sYears[idx]) > YEAR_DIFFERENCE_THRESHOLD) {
                      //다른 실제 연도 일치 결과가 있는데 퍼지 매칭 결과는 실제 연도가 차이가 크다면 버린다.
                      //ex: 인비테이션
                      idx = -1;
                      console.info('fuzzysort result is discarded since year is too different:', first.target);
                    }
                    else if(sTitles[maybeIdxWithSameDateOrType] == sOrgTitles[maybeIdxWithSameDateOrType] && sRatings[idx] < fuzzyThresholdRating) {
                      //다른 실제 연도 일치 결과가 한국어 제목이 없는데 퍼지 매칭 결과 평점이 너무 구려도 버린다.
                      //ex: 인터스텔라(jw에 한국어 제목이 영어 제목임-_-)
                      idx = -1;
                      console.info('fuzzysort result is discarded since its rating is so poor and no korean title is present:', first.target);
                    }
                    else {
                      console.info('fuzzysort result is taken:', first.target);
                    }
                  }
                  else {
                    console.warn(`no exact match. so taking ${first.target} (${sYears[idx]}) with fuzzysort score ${first.score} for ${titleForWarning}`);
                    otData[i].otFlag = '?';
                  }
                }
                else {
                  console.info('fuzzysort epic failed for', title);
                  ////검색 결과가 너무나 무관하면 같은 날짜나 타입 결과가 있더라도 버린다.
                  //maybeIdxWithSameDateOrType = -1;
                }
              }

              if(idx == -1) {
                if(maybeIdxWithSameDateOrType > -1 && sRatings[maybeIdxWithSameDateOrType] >= fuzzyThresholdRating) {
                  idx = maybeIdxWithSameDateOrType;
                  console.warn(`${titleForWarning} seems not found on jw among many (or one). so just taking the first result with not-poor rating present and with the same date or type: ${sTitles[idx]}`);
                  otData[i].otFlag = '?';
                }
                else {
                  idx = 0;
                  console.warn(`${titleForWarning} seems not found on jw among many (or one). so just taking the first (the most popular) result: ${sTitles[idx]}`);
                  if(sTitles.filter(el => el).length == 1) otData[i].otFlag = '?';
                  else otData[i].otFlag = '??';
                }
              }
            }
          }
        }
      }

      //fields: ['id','full_path','title','object_type','original_release_year','scoring','external_ids','original_title'], (old)
      if(reSearching != 'done' && reSearching != 'no need') {
        console.debug('found idx', idx);
        otData[i].jwId = sIds[idx];
        otData[i].jwUrl = sUrls[idx];
        otData[i].type = sTypes[idx];
        otData[i].year = sYears[idx];
        otData[i].orgTitle = sOrgTitles[idx];

        if(sImdbIds[idx])
          otData[i].imdbId = sImdbIds[idx];
        else
          otData[i].imdbFlag = '??';  //if not imdb id is, not set at all.

        if(otData[i].otFlag == '??' && isValidRating_(otData[i].imdbRating)) {
          //if search failed but present (on kino), use it.
          console.warn(`jw search failed. so use kino's rating instead`);
          otData[i].imdbFlag = '??';
        }
        else {
          otData[i].imdbRating = sRatings[idx] || '??';

          otData[i].imdbUrl = getImdbUrlFromId_(otData[i].imdbId, otData[i].orgTitle);
          otData[i].imdbRatingFetchedDate = new Date().toISOString();

          if(sRatings[idx] && sImdbIds[idx])  //if imdb flag is not set at all.
            otData[i].imdbFlag = '';
        }
      }
    }
  }
}