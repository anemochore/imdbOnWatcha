class ParseJW {
  //parsing and scraping funcs
  async parseJwSearchResults_(results, otData, trueData, titles) {
    for await(const [i, result] of results.items()) {
      const title = titles[i];
      if(!result) {
        if(title) {
          console.warn('search for',title,'on jw failed! no result at all!');
          otData[i].otFlag = '??';
        }
        continue;  //continue
      }

      const movieString = 'movie', tvString = 'show';

      //to update cache
      otData[i].query = title;

      //fields: ['id','title','object_type','original_release_year','scoring','full_path','external_ids'],
      let sIds = result.map(el => el.id);
      let sTitles = result.map(el => el.title);
      let sTypes = result.map(el => el.object_type == tvString ? 'TV Series' : 'Movie');
      let sYears = result.map(el => el.original_release_year);
      let sRatings = result.map(el => el.scoring.filter(el => el.provider_type == 'imdb:score')[0]?.value);
      let sUrls = result.map(el => `https://www.justwatch.com${el.full_path}`);
      let sImdbIds = result.map(el => el.external_ids.filter(el => el.provider == 'imdb')[0]?.external_id);

      //todo+++
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
        console.warn(`${exactMatchCount} multiple exact matches for ${titleForWarning} found on jw. so taking the first result: ${sTitles[idx]}`);
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
        }

      }

      //fields: ['id','title','object_type','original_release_year','scoring','full_path','external_ids'],
      otData[i].id = sIds[idx];
      otData[i].orgTitle = sTitles[idx];
      otData[i].type = sTypes[idx];
      otData[i].year = sYears[idx];
      otData[i].imdbRating = sRatings[idx];
      otData[i].otUrl = sUrls[idx];
      otData[i].imdbId = sImdbIds[idx];

      otData[i].imdbUrl = fy.getUrlFromId_(otData[i].imdbId, 'www.imdb.com');
      otData[i].imdbRatingFetchedDate = new Date().toISOString();
    }
  }
}