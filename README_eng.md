# imdb on watcha
Search and show IMDb ratings on Watcha, Netflix, Wavve running on [Tampermonkey](https://www.tampermonkey.net/).

## features
1. Searches Korean titles on [Watcha Pedia](https://pedia.watcha.com/) to get English titles.
2. Searches English title on IMDb and scrapes data using [this API](https://rapidapi.com/SAdrian/api/data-imdb1/).
3. Stores Watcha Pedia and IMDb data cache on Tampermonkey storage.
4. If search was imperfect, clicking an item (which reveals more infomation like release year) will initiate search again.
5. If search was still imperfect, you can enter the correct url manually to update the cache.
6. Still, ratings can be outdated. So when you visit the IMDb page, the script will try to update the cache if possible.

## usage
1. Install [Tampermonkey](https://www.tampermonkey.net/) if not installed.
2. Install `app.js` into Tampermonkey.
3. In Tampermonkey setting, set 'Config Mode' to 'Advanced' and refresh in order to access 'Storage' tab for scripts.
4. Upon first run (accessing watcha.com), an error popup will show up saying the API keys should be set. You should subscribe for free and get the key at [the API page](https://rapidapi.com/SAdrian/api/data-imdb1/).
5. Set the key at 'Storage' tab for the script in JSON format, eg. `"RAPID_API_KEY": "YOUR_LONG_API_KEY_BLAH_BLAH"` and refresh.
6. **IMPORTANT**: Now, before accesing watcha.com, please change your language to Korean on pedia.watcha.com!
7. Now refreshing watcha.com will initiate the script run.
8. Processing details can be found in browser console.
9. **IMPORTANT**: When the API is blocked, you should contact the API provider.

## screenshot
![sample](https://user-images.githubusercontent.com/8731054/123694785-bcd88d00-d894-11eb-9e37-a2ce4233448a.png)

## supported sites
1. watcha.com
2. www.netflix.com
3. www.disneyplus.com/ko-kr/ list pages
4. www.waave.com (not updating)
5. m.kinolights.com/title/ pages
6. www.imdb.com/title/ pages

## todo
1. support for waave (maybe done)
2. support for disney+ (partially done)
3. support for seezn (no account now)
4. support for imdb my rating (when accessing www.imdb.com)
5. support for uflix (no account now)
6. setting.js documenting

## history
See `changelog.md`.