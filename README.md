# imdb on watcha
search and show imdb rating on watcha. running on [tampermonkey](https://www.tampermonkey.net/).

## features
1. searches korean titles on [kl](https://m.kinolights.com/) to get english titles by [google cse](https://cse.google.com/).
2. searches english title on imdb and scrapes data using [this api](https://rapidapi.com/rapidapi/api/movie-database-imdb-alternative/).
3. stores kl and imdb data cache on tampermonkey storage in json format.

## supported sites
1. watcha.com
2. todo: netflix?

## todo
1. support for imdb my rating -> not possible. scraping is being blocked sooner or later. user rating url sample: https://www.imdb.com/user/ur105461136/ratings
2. fetching should be stopped when changing search keyword in search page.
3. reduce unnecessary multiple fetching (some kind of internal cache seems possible)
4. css tuning...
5. support for fetching rating per single season/episode in case of drama on imdb. maybe later...
6. support for netflix (but... other extensions are already available)
7. support for uflix (but... now i don't have an account there)

## history
later to be revealed. prototyping is done.