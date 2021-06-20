# imdb on watcha
search and show imdb rating on watcha. running on [tampermonkey](https://www.tampermonkey.net/).

## features
1. searches korean titles on [kl](https://m.kinolights.com/) to get english titles by [google cse](https://cse.google.com/).
2. searches english title on imdb and scrapes data using [this api](https://rapidapi.com/hmerritt/api/imdb-internet-movie-database-unofficial/).
3. stores kl and imdb data cache on tampermonkey storage in json format.
4. if search was imperfect, clicking an item (which reveals more infomation like release year) will initiate search again.

## screenshot (prototype)
![sample](https://user-images.githubusercontent.com/8731054/121945768-1ddd6c80-cd8f-11eb-9d67-078e799f43e3.png)

## supported sites
1. watcha.com
2. todo: netflix?

## todo
1. support for imdb my rating -> not possible. scraping is being blocked sooner or later. user rating url sample: https://www.imdb.com/user/ur105461136/ratings
2. css tuning...
3. support for fetching rating per single season/episode in case of drama on imdb. maybe later...
4. support for netflix (but... other extensions are already available)
5. support for uflix (but... now i don't have an account there)
6. augmenting search
7. add ui to edit cache
8. add support or another script to get ratings and store on cache when accessing imdb.

## limitations
1. there's no way to find out the release year of a movie in list screen. ie 헤드헌터 (2011), 헤드헌터 (1993), and 헤드헌터 (2018) cannot be distinguished from each others.
2. in rather small browser window size, items at the bottom are shown but won't be processed (since the script cannot recognize dom change).
3. the accuracy of ratings getting via imdb api is not quite good.

## history
code will be revealed later. prototyping is done as of 2021-6-15.