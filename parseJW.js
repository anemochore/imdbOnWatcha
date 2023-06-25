class ParseJW {
  //parsing and scraping funcs
  parseJwSearchResults_(results, otData, trueData, titles) {
    results.forEach((r, i) => {
      const result = r?.items;
      let title = titles[i];

      if(!title)
        return;  //continue
      if(!result) {
        if(title) {
          console.warn('search for',title,'on jw failed! no result at all!');
          otData[i].otFlag = '??';
        }
        return;  //continue
      }
      console.debug('title, result', title, result);  //dev+++

      const fuzzyThresholdLength = 3;  //minimum length of title to which fuzzysort can applied.
      const fuzzyThresholdScore = -10000;  //score to exclude for bad results. 0 is exact match.
      const movieString = 'movie', tvString = 'show';

      //to update cache
      otData[i].query = title;
      title = fy.getCleanTitle(title);

      const trueUrl = trueData.url;  //edit의 경우(캐시의 값을 쓰면 안 됨)
      const trueOrgTitle = trueData.orgTitle;  //watcha large-div 같은 경우(캐시의 값을 쓰면 안 됨)
      const trueType = trueData.type || otData[i].type;
      const trueYear = trueData.year || otData[i].year;

      //fields: ['id','full_path','title','object_type','original_release_year','scoring','external_ids','original_title'],
      let sIds = result.map(el => el.id);
      let sUrls = result.map(el => `https://www.justwatch.com${el.full_path}`);
      let sTitles = result.map(el => el.title);
      let sTypes = result.map(el => el.object_type == tvString ? 'TV Series' : 'Movie');
      let sYears = result.map(el => el.original_release_year);
      let sRatings = result.map(el => el.scoring.filter(el => el.provider_type == 'imdb:score')[0]?.value);
      let sImdbIds = result.map(el => el.external_ids.filter(el => el.provider == 'imdb')[0]?.external_id);
      let sOrgTitles = result.map(el => el.original_title);

      //todo: being improved...
      let idx = -1, exactMatchCount = 0, maybeIdxWithSameDateOrType = -1, possibleIdxWithCloseDate = -1, closeDate = 9999, tokenCount = 0;

      if(trueUrl && sUrls.indexOf(trueUrl) > -1) {
        //url을 알고 있다면 끝~
        idx = sUrls.indexOf(trueUrl);
        otData[i].otFlag = '';
        console.info('url was manually provided.', trueUrl);
      }
      else {
        sTitles.forEach((sTitle, j) => {
          if(sTitle) {
            const sOrgTitle = sOrgTitles[j];
            let found = false;

            if((!trueType || (trueType == 'TV Series' && sTypes[j] == 'TV Series')) && !title.startsWith('극장판 ')) {
              //TV물이면(혹은 type을 아예 모르면) 제목(원제)이 일치해야 함(시즌 무시. 연도 무시)
              if(title == sTitle || sOrgTitle == trueOrgTitle) {
                found = true;
              }
            }
            else {
              if(sTitle == title || sOrgTitle == trueOrgTitle) {
                //TV물이 아니면 제목(원제)이 일치하는 건 물론 trueYear가 있다면 연도도 일치해야 함.
                found = true;
                if(trueYear) {
                  //console.debug('sTitle, title, sOrgTitle, trueOrgTitle', sTitle, title, sOrgTitle, trueOrgTitle);
                  if(trueYear != sYears[j])
                    found = false;
                  const curCloseDate = Math.abs(trueYear - sYears[j]);
                  if(curCloseDate < closeDate && fy.isValidRating_(sRatings[j])) {
                    closeDate = curCloseDate;
                    possibleIdxWithCloseDate = j;
                  }
                }
              }
              else if((trueYear == sYears[j] || trueType == sTypes[j]) && fy.isValidRating_(sRatings[j])) {
                //제목이 일치하는 게 없으면 연도 일치하는 거라도 건지자... 첫 번째만.
                if(maybeIdxWithSameDateOrType == -1)
                  maybeIdxWithSameDateOrType = j;
              }
            }

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
              if(idx == -1 || !fy.isValidRating_(sRatings[idx])) {
                idx = j;
                otData[i].otFlag = '';
              }
              exactMatchCount++;
            }
          }
        });

        console.debug('exactMatchCount, possibleIdxWithCloseDate, maybeIdxWithSameDateOrType', exactMatchCount, possibleIdxWithCloseDate, maybeIdxWithSameDateOrType);
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
            //연도를 알 수 없으면 첫 번째 거(리뷰 있는 거)
            console.warn(`${exactMatchCount} multiple exact matches for ${titleForWarning} found on jw. so taking the first result with rating present: ${sOrgTitles[idx]} (${sYears[idx]}) id: ${sImdbIds[idx]}`);
            otData[i].otFlag = '?';
          }
        }
        else if(idx == -1) {
          //검색 결과 없음
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

                //console.debug('maybeIdxWithSameDateOrType, etc', maybeIdxWithSameDateOrType, trueYear, sYears[idx]);
                if(maybeIdxWithSameDateOrType > -1 && Math.abs(trueYear - sYears[idx]) > YEAR_DIFFERENCE_THRESHOLD) {
                  //다른 실제 연도 일치 결과가 있는데 퍼지 매칭 결과는 실제 연도가 차이가 크다면 버린다.
                  //ex: 인비테이션
                  idx = -1;
                  console.info('fuzzysort result is discarded:', first.target);
                }
                else {
                  console.warn(`no exact match. so taking ${first.target} with fuzzysort score ${first.score} for ${titleForWarning}`);
                  otData[i].otFlag = '?';
                }
              }
              else {
                console.info('fuzzysort epic failed for', title);
                //검색 결과가 너무나 무관하면 같은 날짜나 타입 결과가 있더라도 버린다.
                maybeIdxWithSameDateOrType = -1;
              }
            }

            if(idx == -1) {
              if(maybeIdxWithSameDateOrType > -1) {
                idx = maybeIdxWithSameDateOrType;
                console.warn(`${titleForWarning} seems not found on jw among many (or one). so just taking the first result with rating present and with the same date or type: ${sTitles[idx]}`);
                otData[i].otFlag = '?';
              }
              else {
                idx = 0;
                console.warn(`${titleForWarning} seems not found on jw among many (or one). so just taking the first result: ${sTitles[idx]}`);
                if(sTitles.filter(el => el).length == 1) otData[i].otFlag = '?';
                else otData[i].otFlag = '??';
              }
            }
          }
        }
      }

      //fields: ['id','full_path','title','object_type','original_release_year','scoring','external_ids','original_title'],
      otData[i].id = sIds[idx];
      otData[i].otUrl = sUrls[idx];
      otData[i].type = sTypes[idx];
      otData[i].year = sYears[idx];
      otData[i].imdbRating = sRatings[idx] || '??';
      if(sImdbIds[idx])
        otData[i].imdbId = sImdbIds[idx];
      else
        otData[i].imdbFlag = '??';  //if not imdb id is not set at all.
      otData[i].orgTitle = sOrgTitles[idx];

      otData[i].imdbUrl = fy.getImdbUrlFromId_(otData[i].imdbId, otData[i].orgTitle);
      otData[i].imdbRatingFetchedDate = new Date().toISOString();

      if(sRatings[idx] && sImdbIds[idx])  //if not imdb flag is not set at all.
        otData[i].imdbFlag = '';
    });
  }
}