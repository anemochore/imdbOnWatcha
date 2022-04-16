# imdb on watcha
Search and show IMDb ratings on Watcha, Netflix running on [Tampermonkey](https://www.tampermonkey.net/).

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
6. **IMPORTANT: Now, before accesing watcha.com, please logout on pedia.watcha.com and then re-login on watcha.com!
7. Now refreshing watcha.com will initiate the script run.
8. Processing details can be found in browser console.
9. **IMPORTANT: When the API is blocked, you should contact the API provider.

## screenshot
![sample](https://user-images.githubusercontent.com/8731054/123694785-bcd88d00-d894-11eb-9e37-a2ce4233448a.png)

## supported sites
1. watcha.com
2. www.netflix.com
3. m.kinolights.com/title/ pages
4. www.imdb.com/title/ pages

## todo
1. support for waave
3. support for disney+
4. support for seezn
1. support for imdb my rating (when accessing www.imdb.com)
5. support for uflix (but... now i don't have an account there)
6. setting.js 문서화

## history
See `changelog.md`.