class ParseJW {
  //parsing and scraping funcs
  async parseJwSearchResults_(results, otData, trueData, titles, reSearching = false) {
    console.debug("🚀 ~ file: parseJW.js:4 ~ ParseJW ~ results:", results)
    for(const [i, r] of results.entries()) {
      const result = r?.items;
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
      const fuzzyThresholdRating = 4.1;  //discard result with less rating than this

      const tvString = 'show';  //, movieString = 'movie';

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

      //fields: ['id','full_path','title','object_type','original_release_year','scoring','external_ids','original_title'],
      let sIds = result.map(el => el.id);
      let sUrls = result.map(el => `https://www.justwatch.com${el.full_path}`);
      let sTitles = result.map(el => el.title);
      let sTypes = result.map(el => el.object_type == tvString ? 'TV Series' : 'Movie');
      let sYears = result.map(el => el.original_release_year);
      let sRatings = result.map(el => el.scoring?.filter(el => el.provider_type == 'imdb:score')[0]?.value);  //scoring may not present
      let sImdbIds = result.map(el => el.external_ids?.filter(el => el.provider == 'imdb')[0]?.external_id);  //this too??? idk.
      let sOrgTitles = result.map(el => el.original_title);

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
      else if(trueImdbId && sImdbIds.includes(trueImdbId)) {
        //imdb id를 알고 있다면 끝~
        console.info('imdb id was manually provided and actually found.', trueImdbId);
        otData[i].otFlag = '';
        idx = sImdbIds.indexOf(trueImdbId);
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
            let found = false;

            // console.log("🚀 ~ file: parseJW.js:104 ~ ParseJW ~ title.replace ~ trueYear:", j, sTitle, sYears[j], sRatings[j])
            if((!trueType || (trueType == 'TV Series' && sTypes[j] == 'TV Series')) && !title.startsWith('극장판 ')) {
              //TV물이면(혹은 type을 아예 모르면) 제목(원제)이 일치해야 함(시즌 무시. 연도 무시)
              if(title == sTitle || title.replace(/\-/g, '~') == sTitle || trueOrgTitle?.replace(/～/g, '~') == sOrgTitle) {
                found = true;
              }
            }

            if(!found) {
              if(title == sTitle || 
                title.replace(' - ', ': ') == sTitle || title.replace(': ', ' - ') == sTitle || 
                title.replace(/\-/g, '~') == sTitle || trueOrgTitle?.replace(/～/g, '~') == sOrgTitle) {
                //TV물이 아니거나 못 찾았으면, 제목(or 원제)이 일치하는 건 물론 trueYear가 있다면 연도도 일치해야 함.
                found = true;
                if(trueYear) {
                  if(trueYear != sYears[j])
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
            // console.log("🚀 ~ file: parseJW.js:104 ~ ParseJW ~ title.replace ~ trueYear:", j, sTitle, sYears[j], sRatings[j], maybeIdxWithSameDateOrType)

            if(!found && trueType != 'TV Series' && possibleIdxWithCloseDate == -1) {
              if(title.length > fuzzyThresholdLength) {  //manual fuzzy matching (tv 시리즈는 X)
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

            if(found) {
              if(idx == -1 || !isValidRating_(sRatings[idx])) {
                idx = j;
                otData[i].otFlag = '';
              }
              exactMatchCount++;
            }
          }
        });

        const titleForWarning = `${title} (trueYear: ${trueYear}, trueType: "${trueType}")`;
        if(exactMatchCount > 1) {
          //검색 결과 많음
          if(possibleIdxWithCloseDate > -1) {
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
        else if(idx == -1) {
          console.debug('idx is -1. exactMatchCount, possibleIdxWithCloseDate, maybeIdxWithSameDateOrType:', exactMatchCount, possibleIdxWithCloseDate, maybeIdxWithSameDateOrType);
          //검색 결과 없음
          //원제가 있다면 원제로 재검색
          if(trueOrgTitle && !reSearching) {
            toast.log('re-searching (using org. title) from jw again...');

            const URL = `https://apis.justwatch.com/content/titles/en_US/popular`;
            const qTitles = [trueOrgTitle];
            const urls = [URL];
            const otSearchResults = await fetchAll(urls, {}, qTitles, {
              fields: ['id','full_path','title','object_type','original_release_year','scoring','external_ids','original_title'],
              page_size: 10,  //hard limit
            });

            const localOtData = [{ ...otData[i]}];
            // console.log("🚀 ~ file: parseJW.js:175 ~ ParseJW ~ trueData:", trueData)
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
                    //console.debug('maybeIdxWithSameDateOrType is > -1. sTitles[maybeIdxWithSameDateOrType], sOrgTitles[maybeIdxWithSameDateOrType]:', sTitles[maybeIdxWithSameDateOrType], sOrgTitles[maybeIdxWithSameDateOrType], sTitles[maybeIdxWithSameDateOrType] == sOrgTitles[maybeIdxWithSameDateOrType]);
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

      //fields: ['id','full_path','title','object_type','original_release_year','scoring','external_ids','original_title'],
      if(reSearching != 'done') {
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