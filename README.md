# 🎉 Jia The Best World Party — 초대장 웹사이트

딸 지아의 생일 파티 초대장 웹사이트입니다. GitHub Pages로 바로 배포할 수 있는 정적 사이트이며,
친구들이 아래 순서(관문)를 통과해야 파티 참가 신청을 할 수 있습니다.
미국 친구들을 초대하는 용도라 **사이트의 모든 문구는 영어**입니다. (파티 일정: 2026년 11월 7일 토요일)

**공유용 주소 (단축 URL):**
- https://tinyurl.com/JiaBestWorldParty
- https://tinyurl.com/jia-party
- 원본: https://kyj5482.github.io/jia-party/

RSVP 신청은 Formspree(https://formspree.io/f/mvkzdker)로 접수되어 이메일로 도착합니다.

1. **🎆 불꽃놀이 인트로** — 캔버스 불꽃놀이 애니메이션과 타이틀 등장
2. **📸 지아 알아가기** — 지아의 사진 슬라이드쇼 (사진마다 소개 문구)
3. **⭕❌ 지아 더 알기 퀴즈** — O/X 퀴즈로 지아가 좋아하는 것 맞추기 (기준 점수 통과 필요)
4. **🎬 티저** — "어떤 파티가 열릴까?" 영화 예고편 스타일의 키네틱 타이포그래피 티저
5. **📝 참가 신청** — 친구 이름 + 보호자 연락처 등 간단한 정보 입력
6. **✅ 완료** — 파티 안내 (풀 파티인 경우 수영복 챙기기 안내 자동 표시)

## 빠르게 내용 바꾸기

**`js/config.js` 파일 하나만 수정하면 됩니다.** 파티 날짜/장소, 사진 목록, 퀴즈 문제,
티저 문구, 풀 파티 여부(`isPoolParty`), 신청 폼 전송 주소를 모두 이 파일에서 설정합니다.

### 지아 사진 넣기

1. `assets/photos/` 폴더에 사진 파일을 넣습니다. (예: `jia1.jpg`)
2. `js/config.js`의 `photos` 배열에서 `src`와 `caption`을 수정합니다.

지금은 자리표시용 SVG 이미지 4장이 들어 있습니다.

### 신청 폼 전송 설정 (중요)

GitHub Pages는 정적 호스팅이라 서버가 없으므로, 폼 데이터를 받으려면 둘 중 하나를 설정하세요.

- **Formspree (추천)**: https://formspree.io 에서 무료 폼을 만들고,
  `config.js`의 `formspreeEndpoint`에 `https://formspree.io/f/xxxxxxx` 주소를 넣으면
  신청 내용이 이메일로 도착합니다.
- **설정 안 한 경우**: 신청 내용을 문자 메시지로 보낼 수 있도록 "문자로 보내기" 버튼과
  "내용 복사" 버튼이 자동으로 표시됩니다. (`rsvpPhone`에 보호자 번호를 넣어두세요.)

## 로컬에서 미리보기

```bash
cd jia-party
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 열기
```

## GitHub Pages 배포

```bash
cd jia-party
git add -A && git commit -m "초대장 내용 수정"
# GitHub에서 새 저장소(예: jia-party)를 만든 뒤:
git remote add origin https://github.com/<아이디>/jia-party.git
git branch -M main
git push -u origin main
```

그다음 GitHub 저장소의 **Settings → Pages → Source: Deploy from a branch →
Branch: `main` / 폴더: `/ (root)`** 를 선택하면
`https://<아이디>.github.io/jia-party/` 주소로 초대장이 공개됩니다.

> **개인정보 주의**: 사진과 연락처가 들어가는 사이트입니다. 공개 범위가 걱정되면
> `config.js`에 실제 연락처 대신 Formspree만 쓰고, 장소는 "신청자에게 개별 안내"로
> 두는 것을 추천합니다. (기본 설정이 그렇게 되어 있습니다.)

## 파티 프로그램 아이디어 (구상 메모)

현재 구상: 풀 파티 → 집으로 이동 → 보물찾기 → 방탈출. 여기에 더해볼 만한 아이디어:

- **QR 보물찾기**: 보물 단서를 QR코드로 만들어 집 곳곳에 숨기고, 찍으면 이 웹사이트의
  숨겨진 힌트 페이지(`index.html#hint1` 등)가 열리게 하기 — 초대장 사이트를 파티 당일에도 재활용
- **지아 퀴즈 골든벨 현장판**: 초대장에서 풀었던 O/X 퀴즈를 현장에서 스케치북 골든벨로
  다시 진행 — 미리 퀴즈를 풀고 온 친구들이 유리해서 초대장 참여율도 올라감
- **포토부스 + 즉석 사진**: 소품(선글라스, 가랜드)과 폴라로이드로 기념사진, 답례품 봉투에 넣어주기
- **컵케이크/쿠키 꾸미기**: 수영 후 간식 시간을 활동으로 — 각자 꾸민 걸 집에 가져가게
- **글로우 이벤트**: 해 질 무렵 야광팔찌/야광풍선 켜고 미니 댄스파티로 마무리
- **타임캡슐**: 친구들이 지아에게 쓴 쪽지를 상자에 봉인, "내년 생일에 열기"
- **The Best World Party 어워드**: 마지막에 전원 시상식 (수영왕, 보물탐정, 방탈출 천재 등
  한 명도 빠짐없이 상 받기)
