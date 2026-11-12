// Lighthouse CI용 서버: 빌드 결과(dist/)를 SPA 규칙으로 내보내고, 화면이 읽는 /api/*에는 E2E와 같은 목업 데이터로 답합니다.
// vite preview에는 Netlify 함수가 없어 그대로 재면 API 실패 화면을 재게 됩니다.
// 사용: node scripts/lighthouse-server.ts [--port 4181]
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { facets, home, search, seedMovies } from '../e2e/fakeData.ts';

const root = join(import.meta.dirname, '..', 'dist');
const portIndex = process.argv.indexOf('--port');
const port = Number(portIndex > -1 ? process.argv[portIndex + 1] : 4181);
const movies = seedMovies();
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
};

function api(url: URL): { status: number; body: unknown } | undefined {
  const path = url.pathname;
  if (path === '/api/me') return { status: 200, body: { user: null } };
  if (path === '/api/movie-facets') return { status: 200, body: facets(movies) };
  if (path === '/api/home') return { status: 200, body: home(movies) };
  if (path === '/api/movies') return { status: 200, body: search(movies, url.searchParams) };
  const detail = path.match(/^\/api\/movies\/([^/]+)$/);
  if (detail) {
    let id: string;
    try {
      id = decodeURIComponent(detail[1]!);
    } catch {
      return { status: 400, body: { error: 'bad_request' } };
    }
    const movie = movies.find((item) => item.id === id);
    return movie ? { status: 200, body: movie } : { status: 404, body: { error: 'not_found' } };
  }
  return undefined;
}

createServer((request, response) => {
  const send = (status: number, body: unknown) => {
    response.writeHead(status, { 'content-type': 'application/json' });
    response.end(JSON.stringify(body));
  };
  let url: URL;
  let pathname: string;
  try {
    url = new URL(request.url ?? '/', `http://localhost:${port}`);
    pathname = decodeURIComponent(url.pathname);
  } catch {
    // 잘못 인코딩된 주소로 서버가 멈추지 않게 합니다.
    send(400, { error: 'bad_request' });
    return;
  }
  if (pathname.startsWith('/api/')) {
    const result = api(url) ?? { status: 404, body: { error: 'not_found' } };
    send(result.status, result.body);
    return;
  }
  const file = normalize(join(root, pathname));
  // root 바깥(같은 이름으로 시작하는 옆 폴더 포함)은 내보내지 않습니다.
  const found = file.startsWith(root + sep) && existsSync(file) && statSync(file).isFile();
  if (!found && pathname.startsWith('/assets/')) {
    // 배포(netlify.toml)처럼 없는 빌드 파일은 앱 화면이 아니라 404로 답합니다.
    send(404, { error: 'not_found' });
    return;
  }
  const target = found ? file : join(root, 'index.html');
  response.writeHead(200, { 'content-type': types[extname(target)] ?? 'application/octet-stream' });
  createReadStream(target).pipe(response);
}).listen(port, () => console.log(`lighthouse server ready: http://localhost:${port}`));
