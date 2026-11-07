#!/usr/bin/env bash
# Netlify가 빌드 전에 실행합니다. 종료 코드 0이면 빌드를 건너뛰고, 1이면 빌드합니다.
# 팀 크레딧을 아끼려고 운영(main) 배포만 빌드하고, 사이트에 영향이 없는 변경은 건너뜁니다.
set -u

# PR 미리보기와 브랜치 배포는 빌드하지 않습니다. PR 검사는 GitHub Actions(CI)가 프로덕션 빌드로 합니다.
case "${CONTEXT:-}" in
  deploy-preview | branch-deploy)
    echo "PR 미리보기·브랜치 배포는 빌드하지 않습니다."
    exit 0
    ;;
esac

# 비교할 이전 빌드가 없거나 그 커밋을 찾을 수 없으면 안전하게 빌드합니다.
if [ -z "${CACHED_COMMIT_REF:-}" ] || [ "${CACHED_COMMIT_REF}" = "${COMMIT_REF:-}" ]; then
  exit 1
fi
if ! git cat-file -e "${CACHED_COMMIT_REF}^{commit}" 2>/dev/null; then
  exit 1
fi
changed=$(git diff --name-only "$CACHED_COMMIT_REF" "$COMMIT_REF") || exit 1

# 문서, 테스트, 저장소 설정만 바뀌었으면 배포할 내용이 같으므로 건너뜁니다.
# 이 목록은 .github/workflows/live-check.yml의 paths-ignore와 같게 유지합니다.
site=$(printf '%s\n' "$changed" | grep -vE '^(docs/|e2e/|\.github/|README\.md$|CHANGELOG\.md$|\.coderabbit\.yaml$)|\.test\.tsx?$' || true)
if [ -z "$site" ]; then
  echo "문서·테스트·저장소 설정만 바뀌어 빌드하지 않습니다."
  exit 0
fi
exit 1
