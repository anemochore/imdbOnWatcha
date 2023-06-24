class ParseJW {
  //parsing and scraping funcs
  parseJwSearchResults_(results, otData, trueData, qTitles) {
    results.forEach((r, i) => {
      const result = r?.items;
      const title = qTitles[i];
      console.debug('title, result', title, result);  //dev+++
      if(!title)
        return;  //continue

      if(!result) {
        if(title) {
          console.warn('search for',title,'on jw failed! no result at all!');
          otData[i].otFlag = '??';
        }
        return;  //continue
      }

      const fuzzyThresholdLength = 3;  //minimum length of title to which fuzzysort can applied.
      const fuzzyThresholdScore = -10000;  //score to exclude for bad results. 0 is exact match.
      const movieString = 'movie', tvString = 'show';

      //to update cache
      otData[i].query = title;

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
      let idx = -1, exactMatchCount = 0, possibleIdxWithSameDateOrType, possibleIdxWithCloseDate, closeDate = 9999, tokenCount = 0;
      sTitles.forEach((sTitle, j) => {
        if(sTitle) {
          let found = false;
          if((!trueType || (trueType == 'TV Series' && sTypes[j] == 'TV Series')) && !title.startsWith('극장판 ')) {
            //TV물이면(혹은 type을 아예 모르면) 제목이 일치해야 함(시즌 무시. 연도 무시)
            if(sTitle == title) {
              found = true;
            }
          }
          else {
            if(sTitle == title) {
              //TV물이 아니면 제목이 일치하는 건 물론 trueYear가 있다면 연도도 일치해야 함.
              found = true;
              if(trueYear && trueYear != sYears[j]) {
                found = false;
                const curCloseDate = Math.abs(trueYear - sYears[j]);
                if(curCloseDate < closeDate) {
                  closeDate = curCloseDate;
                  possibleIdxWithCloseDate = j;
                }
              }
            }
            else if(trueYear == sYears[j] || trueType == sTypes[j]) {
              //제목이 일치하는 게 없으면 연도 일치하는 거라도 건지자... 첫 번째만.
              if(!possibleIdxWithSameDateOrType)
                possibleIdxWithSameDateOrType = j;
            }
          }

          if(title.length > fuzzyThresholdLength) {  //fuzzy matching
            if(!found) {
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
      const titleForWarning = `${title} (trueYear: ${trueYear}, trueType: "${trueType}")`;
      if(exactMatchCount > 1) {
        //검색 결과 많음
        console.warn(`${exactMatchCount} multiple exact matches for ${titleForWarning} found on jw. so taking the first result with rating: ${sTitles[idx]} (${sYears[idx]})`);
        otData[i].otFlag = '?';
      }
      else if(idx == -1) {
        //검색 결과 없음
        if(possibleIdxWithCloseDate) {
          console.warn(`${titleForWarning} seems not found on wp among many (or one). so just taking the first result with the closest date: ${sTitles[idx]}`);
          idx = possibleIdxWithCloseDate;
          otData[i].otFlag = '?';
        }
        else {
          if(title.length > fuzzyThresholdLength) {
            //https://github.com/farzher/fuzzysort
            let first = fuzzysort.go(title, sTitles, {threshold: fuzzyThresholdScore});
            if(first.length > 0) {
              console.log(first);
              first = first[0];
              idx = sTitles.indexOf(first?.target);
              console.warn(`no. exact match. so taking ${first.target} with fuzzysort score ${first.score} for ${titleForWarning}`);
            }
          }

          if(idx == -1) {
            if(possibleIdxWithSameDateOrType) {
              idx = possibleIdxWithSameDateOrType;
              console.warn(`${titleForWarning} seems not found on wp among many (or one). so just taking the first result with the same date or type: ${sTitles[idx]}`);
              otData[i].otFlag = '?';
            }
            else {
              idx = 0;
              console.warn(`${titleForWarning} seems not found on wp among many (or one). so just taking the first result: ${sTitles[idx]}`);
              if(sTitles.filter(el => el).length == 1) otData[i].otFlag = '?';
              else otData[i].otFlag = '??';
            }
          }
        }
      }

      //fields: ['id','full_path','title','object_type','original_release_year','scoring','external_ids','original_title'],
      otData[i].id = sIds[idx];
      otData[i].otUrl = sUrls[idx];
      otData[i].type = sTypes[idx];
      otData[i].year = sYears[idx];
      otData[i].imdbRating = sRatings[idx];
      otData[i].imdbId = sImdbIds[idx];
      otData[i].orgTitle = sOrgTitles[idx];

      otData[i].imdbUrl = fy.getUrlFromId_(otData[i].imdbId, 'www.imdb.com');
      otData[i].imdbRatingFetchedDate = new Date().toISOString();
    });
  }
}