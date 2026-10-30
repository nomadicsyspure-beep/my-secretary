# 작업 규칙

- 사용자와는 한국어로 대화한다.
- 사이트는 GitHub Pages로 `main` 브랜치를 그대로 배포한다: https://nomadicsyspure-beep.github.io/my-secretary/
- 사용자 요청: **업데이트할 때마다 자동 반영.** 작업 브랜치에 커밋·푸시한 뒤 `main`에도 바로 반영한다 (`git push origin HEAD:main`, fast-forward). PR을 따로 기다리지 않는다.
- 빌드 도구 없이 정적 파일(`index.html`, `sw.js`)만 사용한다.
