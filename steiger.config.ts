import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

// Feature-Sliced Design 규칙을 그대로 씁니다. (Next.js가 아니라 계층 이름 규칙을 끌 필요가 없습니다.)
export default defineConfig([...fsd.configs.recommended]);
