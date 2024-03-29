class ImdbRun {
  async imdbRun() {
    const otCache = await GM_getValue(GM_CACHE_KEY);

    const path = document.location.pathname.replace(/\/$/, '');
    if(!path.startsWith('/title/') || path.endsWith('/episodes') || path.split('/').length > 3) {
      toast.log();
      return;
    }

    const imdbId = path.split('/')[2];

    const json = document.querySelector('script#__NEXT_DATA__')?.text;
    let imdbData;
    if(json)
      imdbData = JSON.parse(json).props.pageProps.aboveTheFoldData;
    else
      return;

    let imdbRating = imdbData.ratingsSummary?.aggregateRating;
    if(!isValidRating_(imdbRating))
      imdbRating = 'n/a';

    const trueOrgTitle = imdbData.originalTitleText.text;
    const trueYear = imdbData.releaseYear.year;
    const trueType = imdbData.titleType.text;
    console.debug('trueOrgTitle, trueYear, trueType, imdbRating', trueOrgTitle, trueYear, trueType, imdbRating);

    const keys = Object.keys(otCache);
    const values = Object.values(otCache);
    const ids = values.map(el => el.imdbId);
    const orgTitles = values.map(el => el.orgTitle);
    const years = values.map(el => el.year);
    //const flags = values.map(el => el.imdbFlag);

    let idx = -1;
    if(imdbId && ids.includes(imdbId)) {
      idx = ids.indexOf(imdbId);
    }
    else {
      idx = orgTitles.indexOf(trueOrgTitle);

      //console.log(orgTitles[idx], years[idx]);
      if(!(idx > -1 && years[idx] == trueYear))  //if not exact match
        idx = -1;
    }

    if(idx > -1) {
      console.debug('found idx:', idx);
      const orgTitle = orgTitles[idx];
      let cache = otCache[keys[idx]], isCacheUpdateNeeded = false;

      if(cache.imdbFlag != '') {
        if(isValidRating_(cache.imdbRating) && !isValidRating_(imdbRating)) {
          toast.log('warning: cache rating is valid but imdb rating is n/a. so deleting the cache which is probably wrong!');

          cache.imdbId = 'n/a';  //다시 업데이트하지 못하게 막음
          cache.imdbRating = 'n/a';
          cache.imdbUrl = getImdbUrlFromId_(null, orgTitle);
        }
        else if(Math.abs(parseInt(cache.year) - trueYear) > 1) {
          toast.log('year on imdb is ' + trueYear + ', which differs more than 1 year from ' + cache.year + '. so deleting the cache which is probably wrong!');

          cache.imdbId = 'n/a';  //다시 업데이트하지 못하게 막음
          cache.imdbRating = 'n/a';
          cache.imdbUrl = getImdbUrlFromId_(null, orgTitle);
        }
        else {
          isCacheUpdateNeeded = true;
          if(cache.imdbUrl.startsWith('https://www.imdb.com/find?') || cache.imdbFlag == '??') {
            toast.log('updated the whole imdb data on cache (id was not set or flag is ??) for '+orgTitle+' ('+trueYear+').');

            cache.imdbId = imdbId;
            cache.imdbUrl = getImdbUrlFromId_(imdbId, 'www.imdb.com');
          }
          else {
            if(imdbRating != cache.imdbRating) {
              toast.log(`imdb rating differs from the cache, so updating the cache rating for ${orgTitle || trueOrgTitle} (${cache.year}).`);
              cache.imdbRating = imdbRating;
            }
            else {
              toast.log('imdb rating on cache was confirmed for '+orgTitle+' ('+cache.year+').');
            }
          }
        }
        console.log('imdb flag was reset.')
        cache.imdbFlag = '';
      }
      else if(imdbRating != cache.imdbRating) {
        isCacheUpdateNeeded = true;
        if(cache.imdbRating == 'n/a') {
          toast.log('updated the imdb data on cache (flag was not set) for '+orgTitle+' ('+trueYear+').');

          cache.imdbId = imdbId;
          cache.imdbUrl = getImdbUrlFromId_(imdbId, 'www.imdb.com');
        }
        else if(imdbRating == 'n/a') {
          toast.log('imdb rating is really not present for '+orgTitle+' ('+trueYear+')!');
        }
        else {
          toast.log('imdb rating differs from the cache, so updating the cache rating (only) for '+orgTitle+' ('+cache.year+').');
        }
        cache.imdbRating = imdbRating;
      }
      else {
        isCacheUpdateNeeded = true;
        toast.log('imdb flag is not set and imdb rating is the same as cache, so no rating update.');
      }

      if(isCacheUpdateNeeded) {
        replaceCacheValueIfNeeded_('imdbId', imdbId);
        replaceCacheValueIfNeeded_('imdbUrl', getImdbUrlFromId_(imdbId));
        replaceCacheValueIfNeeded_('orgTitle', trueOrgTitle);
        replaceCacheValueIfNeeded_('year', trueYear);
        replaceCacheValueIfNeeded_('type', trueType);
      }

      //wrap-up
      cache.imdbRatingFetchedDate = new Date().toISOString();
      cache.imdbVisitedDate = new Date().toISOString();
      otCache[keys[idx]] = cache;
      await GM_setValue(GM_CACHE_KEY, otCache);

      function replaceCacheValueIfNeeded_(sourceKey, targetValue) {
        if(cache[sourceKey] != targetValue) {
          console.log(`updated ${sourceKey}: ${cache[sourceKey]} -> ${targetValue}`);
          cache[sourceKey] = targetValue;
        }
      }

    }
    else {
      toast.log('this title is not yet stored on the cache.');
    }

    toast.log();
  }

}