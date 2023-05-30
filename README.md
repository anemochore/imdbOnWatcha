# imdb on watcha
[탬퍼멍키](https://www.tampermonkey.net/)와 [무료 API](https://rapidapi.com/SAdrian/api/data-imdb1/)를 이용해 왓챠, 넷플릭스, 웨이브, 키노라이츠 등의 목록/타이틀 화면에 IMDb 평점을 보여준다.

- English readme is available on `README_eng.md`.

## 기능 및 간단한 원리
1. 화면에 뜬 국문 제목을 [왓챠피디아](https://pedia.watcha.com/) 국문 사이트에서 검색하고, 검색 결과 중 일치하는 항목의 영문 페이지를 스크레이핑해서 영문 제목을 얻는다.
2. 영문 제목에 대해 [무료 API](https://rapidapi.com/SAdrian/api/data-imdb1/)를 이용해 IMDb 평점을 가져오고, 화면에 출력한다.
3. 왓챠피디아 페이지 링크와 IMDb 평점은 탬퍼멍키 저장소(브라우저에 저장됨)에 저장해서 캐싱한다.
4. 목록에서 아이템 클릭 시 뜨는 타이틀 화면에는 연도나 TV 물 여부까지 나오기 때문에, 검색 결과가 불완전했을 경우 이 정보까지 활용해 다시 검색한다(키노라이츠의 경우 목록은 지원하지 않고 타이틀 화면만 지원).
5. 왓챠피디아 검색 결과가 불완전하거나 왓챠피디아에 있는 영문 제목이 IMDb에 있는 제목과 불일치하는 경우가 있다. 이때는 edit를 클릭해 수동으로 왓챠피디아 링크 또는 IMDb 링크를 입력할 수 있다.
6. IMDb 평점은 계속 변화하므로 API에서 가져오는 평점이 아웃데이트될 수 있다. 따라서 IMDb 페이지에 방문할 때마다 스크레이핑해서 캐시를 업데이트한다.

## 사용법
1. [탬퍼멍키](https://www.tampermonkey.net/)를 안 쓴다면 먼저 설치한다.
2. 이 저장소의 `app.js`를 탬퍼멍키에 '새 스크립트'로 저장한다.
3. 탬퍼멍키 설정 화면에서 '설정 모드'를 '상급자'로 고르고 탬퍼멍키 화면을 새로고침하면, 스크립트에 'Storage' 탭이 생긴다. 앞으로 여기에 캐시가 저장된다.
4. 이후 왓챠 등에 접속하면 API 키를 넣으라고 alert가 뜰 거다. [무료 API](https://rapidapi.com/SAdrian/api/data-imdb1/)를 구독하고 API 키를 받는다.
5. 스크립트의 'Storage' 탭에 가서 `"RAPID_API_KEY"` 키에 자신의 API 키 값을 넣는다(JSON 형식이다).
6. 왓챠 등에 다시 접속하기 전에 왓챠피디아에 가서 언어가 한국어가 아니면 한국어로 바꾼다!
7. 이후 왓챠 등에 다시 접속하면 스크립트가 실행될 거다.
8. 스크립트 로그는 콘솔을 참고. DEBUG 레벨에서는 더 많은 정보를 볼 수 있다.
9. 무료 API이므로 요청을 너무 많이 보내면 차단당한다. 개발자에게 사정하면 풀어준다...

## 초기 스샷
![sample](https://user-images.githubusercontent.com/8731054/123694785-bcd88d00-d894-11eb-9e37-a2ce4233448a.png)

## 지원 사이트
1. watcha.com
2. www.netflix.com
3. www.disneyplus.com/ko-kr/ list pages
4. www.waave.com: /player & /my pages (still updating)
5. m.kinolights.com/title pages
6. www.imdb.com/title/ pages

## todo
1. support for waave (maybe done)
2. support for disney+ (partially done)
3. support for seezn (no account now)
4. support for imdb my rating (when accessing www.imdb.com)
5. support for uflix (no account now)
6. setting.js 문서화

## 버전 히스토리
`changelog.md` 참고.