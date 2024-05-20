# imdb on watcha
[탬퍼멍키](https://www.tampermonkey.net/)와 [저스트워치](https://www.justwatch.com/) API를 이용해 왓챠, 넷플릭스, 웨이브, 디플, 키노라이츠 등의 목록/타이틀 화면에 IMDb 평점을 보여준다.

## 기능 및 간단한 원리
1. 화면에 뜬 영화(들)의 국문 제목을 [저스트워치](https://www.justwatch.com/) API로 검색한다. 
2. 이 검색 결과에는 IMDb id가 포함되어 있고 보통은 평점도 있다. 이 결과를 영화 위에 출력한다.
3. 저스트워치 페이지 링크와 IMDb 평점 등은 탬퍼멍키 저장소(브라우저에 저장됨)에 저장해서 캐싱한다.
4. 목록에서 아이템 클릭 시 뜨는 타이틀 화면에는 연도나 TV 시리즈 여부 등 더 자세한 정보가 나오므로, 검색 결과가 불완전했을 경우 이 정보까지 활용해 다시 검색한다(키노라이츠의 경우 목록은 지원하지 않고 타이틀 화면만 지원). 왓챠의 경우 왓챠피디아 페이지도 스크레이핑한다.
5. OTT마다 제목 표기가 다를 수 있고, 검색 결과는 완벽하지 않다. 검색 결과가 잘못되었다면 edit를 클릭해 수동으로 저스트워치 또는 IMDb 링크를 입력할 수 있다.
6. IMDb 평점은 계속 변화하므로 API에서 가져오는 평점이 아웃데이트될 수 있다. 따라서 IMDb 페이지에 방문할 때마다 스크레이핑해서 캐시를 업데이트한다.

## 사용법
1. [탬퍼멍키](https://www.tampermonkey.net/)를 안 쓴다면 먼저 설치한다.
2. 이 저장소의 [`app.js`](https://anemochore.github.io/imdbOnWatcha/app.js)를 탬퍼멍키에 '새 스크립트'로 저장한다.
3. 탬퍼멍키 설정 화면에서 '설정 모드'를 '상급자'로 고르고 탬퍼멍키 화면을 새로고침하면, 스크립트에 'Storage' 탭이 생긴다. 앞으로 여기에 캐시가 저장된다. JSON이므로 손으로 고쳐도 된다.
7. 왓챠 등에 다시 접속하면 스크립트가 실행될 거다.
8. 스크립트 로그는 콘솔을 참고. DEBUG 레벨에서는 더 많은 정보를 볼 수 있다.

## 초기 스샷
![sample](https://user-images.githubusercontent.com/8731054/123694785-bcd88d00-d894-11eb-9e37-a2ce4233448a.png)

## 지원 사이트
1. watcha.com
2. www.netflix.com
3. www.disneyplus.com/ko-kr/
4. www.waave.com: /player & /my pages (still updating)
5. m.kinolights.com/title pages
6. www.imdb.com/title/ pages

## 서드파티 라이선스 등
1. 저스트워치 무료 API는 공개되어 있지 않다. [이런 곳](https://github.com/Fredwuz/node-justwatch-api) 등에서 엔드포인트를 베꼈다.
2. 저스트워치 검색 시 정확히 일치하는 제목이 없을 때는 [fuzzysort](https://github.com/farzher/fuzzysort)로 일치도가 가장 높은 제목을 고른다. MIT 라이선스다.

## todo
0. support for tving
1. support for waave (maybe done)
2. support for disney+ (partially done)
3. support for seezn (closed now)
4. support for imdb my rating (when accessing www.imdb.com)
5. support for uflix (no account now)
6. setting.js 문서화

## 버전 히스토리
`changelog.md` 참고.