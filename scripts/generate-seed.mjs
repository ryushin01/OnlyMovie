// 가상의 영화로 포스터·배경 SVG(public/seed)와 시드 마이그레이션을 만듭니다. 한 번 실행하고 결과를 커밋합니다.
// 적용된 마이그레이션은 고칠 수 없으므로, 내용을 바꾸려면 OUT을 새 파일로 바꿔 새 마이그레이션을 추가합니다.
import { mkdirSync, writeFileSync } from 'node:fs';
import { MOVIES } from './seed-movies.mjs';

const OUT = 'netlify/database/migrations/20261106000100_seed_movies.sql';

const esc = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const sql = (text) => `'${text.replaceAll("'", "''")}'`;
const sqlArray = (items) => `ARRAY[${items.map(sql).join(', ')}]::text[]`;

/** 같은 작품은 언제 만들어도 같은 그림이 되도록 id로 난수를 정합니다. */
function randomFrom(id) {
  let seed = [...id].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function mix(hex, target, amount) {
  const channel = (value, offset) => parseInt(value.slice(offset, offset + 2), 16);
  const part = (offset) =>
    Math.round(channel(hex, offset) + (channel(target, offset) - channel(hex, offset)) * amount)
      .toString(16)
      .padStart(2, '0');
  return `#${part(1)}${part(3)}${part(5)}`;
}

const n = (value) => Math.round(value);

/** 지평선을 따라 굴곡진 땅 한 겹 */
function ridge(w, h, base, height, fill, random, steps = 7) {
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    return `${n((w / steps) * i)},${n(base - random() * height)}`;
  });
  return `<polygon points="0,${h} ${points.join(' ')} ${w},${h}" fill="${fill}"/>`;
}

const SCENES = {
  /** 불 켜진 창이 있는 도시 */
  city({ w, h, light, dark, random }) {
    const parts = [
      `<circle cx="${n(w * 0.72)}" cy="${n(h * 0.3)}" r="${n(h * 0.14)}" fill="${light}" opacity=".5"/>`,
    ];
    let x = -10;
    while (x < w) {
      const width = n(w * (0.07 + random() * 0.08));
      const top = n(h * (0.42 + random() * 0.32));
      parts.push(`<rect x="${x}" y="${top}" width="${width}" height="${h - top}" fill="${dark}"/>`);
      for (let wy = top + 24; wy < h - 20; wy += 48) {
        for (let wx = x + 12; wx < x + width - 16; wx += 34) {
          if (random() > 0.62)
            parts.push(`<rect x="${wx}" y="${wy}" width="12" height="20" fill="${light}" opacity=".75"/>`);
        }
      }
      x += width + 6;
    }
    return parts.join('');
  },
  /** 고리 달린 행성과 별 */
  space({ w, h, light, random }) {
    const stars = Array.from(
      { length: 70 },
      () =>
        `<circle cx="${n(random() * w)}" cy="${n(random() * h)}" r="${(1 + random() * 2.5).toFixed(1)}" fill="#fff" opacity="${(0.3 + random() * 0.6).toFixed(2)}"/>`,
    );
    const cx = n(w * (0.55 + random() * 0.25));
    const cy = n(h * (0.3 + random() * 0.2));
    const r = n(Math.min(w, h) * 0.2);
    return `${stars.join('')}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${light}"/><ellipse cx="${cx}" cy="${cy}" rx="${n(r * 1.8)}" ry="${n(r * 0.36)}" fill="none" stroke="#fff" stroke-width="6" opacity=".65" transform="rotate(-18 ${cx} ${cy})"/>`;
  },
  /** 달빛 아래의 침엽수 숲 */
  forest({ w, h, light, dark, random }) {
    const moon = `<circle cx="${n(w * (0.3 + random() * 0.4))}" cy="${n(h * 0.26)}" r="${n(h * 0.11)}" fill="${light}" opacity=".85"/>`;
    const trees = Array.from({ length: 16 }, (_, i) => {
      const x = n((w / 15) * i + (random() - 0.5) * 40);
      const height = n(h * (0.3 + random() * 0.3));
      const half = n(height * 0.2);
      return `<polygon points="${x - half},${h} ${x},${h - height} ${x + half},${h}" fill="${dark}"/>`;
    });
    return moon + trees.join('');
  },
  /** 해와 겹친 언덕 */
  hills({ w, h, light, dark, from, random }) {
    return `<circle cx="${n(w * (0.25 + random() * 0.5))}" cy="${n(h * 0.45)}" r="${n(h * 0.17)}" fill="${light}" opacity=".8"/>${ridge(w, h, h * 0.68, h * 0.14, mix(from, '#000000', 0.25), random)}${ridge(w, h, h * 0.84, h * 0.14, dark, random)}`;
  },
  /** 낮게 걸린 해와 탁자 모양의 바위산 */
  mesa({ w, h, light, dark, from, random }) {
    const rock = (x, width, top, fill) =>
      `<polygon points="${n(x)},${h} ${n(x + width * 0.14)},${n(top)} ${n(x + width * 0.86)},${n(top)} ${n(x + width)},${h}" fill="${fill}"/>`;
    return `<circle cx="${n(w * (0.4 + random() * 0.25))}" cy="${n(h * 0.56)}" r="${n(h * 0.24)}" fill="${light}" opacity=".85"/>${rock(w * -0.05, w * 0.42, h * (0.5 + random() * 0.1), mix(from, '#000000', 0.3))}${rock(w * 0.62, w * 0.46, h * (0.44 + random() * 0.14), mix(from, '#000000', 0.3))}<rect y="${n(h * 0.86)}" width="${w}" height="${n(h * 0.14)}" fill="${dark}"/>`;
  },
  /** 물결과 돛단배 */
  sea({ w, h, light, dark, random }) {
    const y = n(h * 0.62);
    const x = n(w * (0.3 + random() * 0.4));
    const size = n(h * 0.18);
    const waves = Array.from({ length: 5 }, (_, i) => {
      const wy = y + n((h - y) * (i / 5));
      const amp = 8 + i * 5;
      return `<path d="M0 ${wy} Q ${n(w / 4)} ${wy - amp} ${n(w / 2)} ${wy} T ${w} ${wy} V ${h} H 0Z" fill="${mix(dark, '#ffffff', 0.04 * (4 - i))}"/>`;
    });
    return `<circle cx="${n(w * 0.78)}" cy="${n(h * 0.28)}" r="${n(h * 0.09)}" fill="${light}" opacity=".7"/><polygon points="${x},${y - size} ${x},${y - 8} ${x + n(size * 0.7)},${y - 8}" fill="${light}"/><polygon points="${x - n(size * 0.5)},${y - 2} ${x + n(size * 0.8)},${y - 2} ${x + n(size * 0.6)},${y + 22} ${x - n(size * 0.34)},${y + 22}" fill="${dark}"/>${waves.join('')}`;
  },
  /** 소리 막대 */
  sound({ w, h, light, random }) {
    const count = 22;
    const gap = w / count;
    return Array.from({ length: count }, (_, i) => {
      const height = n(h * (0.12 + random() * 0.5));
      return `<rect x="${n(i * gap + gap * 0.2)}" y="${n(h * 0.56 - height / 2)}" width="${n(gap * 0.56)}" height="${height}" rx="${n(gap * 0.28)}" fill="${light}" opacity="${(0.45 + random() * 0.5).toFixed(2)}"/>`;
    }).join('');
  },
  /** 떠다니는 구름과 비눗방울 */
  dream({ w, h, light, random }) {
    const bubbles = Array.from(
      { length: 9 },
      () =>
        `<circle cx="${n(random() * w)}" cy="${n(random() * h * 0.7)}" r="${n(h * (0.03 + random() * 0.09))}" fill="#fff" opacity="${(0.12 + random() * 0.3).toFixed(2)}"/>`,
    );
    const cloud = (x, y, scale) =>
      `<g fill="${light}"><ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(150 * scale)}" ry="${n(62 * scale)}"/><circle cx="${n(x - 56 * scale)}" cy="${n(y - 36 * scale)}" r="${n(56 * scale)}"/><circle cx="${n(x + 44 * scale)}" cy="${n(y - 46 * scale)}" r="${n(70 * scale)}"/></g>`;
    const scale = w / 1600 + 0.3;
    return `${bubbles.join('')}${cloud(w * 0.3, h * 0.72, scale)}${cloud(w * 0.76, h * 0.6, scale * 0.8)}`;
  },
};

const SCENE_OF = {
  액션: 'city',
  범죄: 'city',
  스릴러: 'city',
  SF: 'space',
  공포: 'forest',
  미스터리: 'forest',
  드라마: 'hills',
  로맨스: 'hills',
  다큐멘터리: 'hills',
  서부: 'mesa',
  모험: 'mesa',
  전쟁: 'mesa',
  역사: 'sea',
  음악: 'sound',
  애니메이션: 'dream',
  가족: 'dream',
  판타지: 'dream',
  코미디: 'dream',
};

function scene(id, genre, w, h, from, to, gradientEnd) {
  const random = randomFrom(`${id}-${w}`);
  const light = mix(from, '#ffffff', 0.5);
  const dark = mix(to, '#000000', 0.25);
  return `<defs><linearGradient id="g" x1="0" y1="0" ${gradientEnd}><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".8"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
${SCENES[SCENE_OF[genre] ?? 'hills']({ w, h, light, dark, from, random })}`;
}

function posterSvg(id, genre, title, from, to) {
  // 긴 제목은 두 줄로 나눕니다.
  const words = title.split(' ');
  const lines = words.length > 1 ? [words.slice(0, -1).join(' '), words.at(-1)] : [title];
  const size = Math.max(...lines.map((line) => line.length)) > 6 ? 62 : 84;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900">
${scene(id, genre, 600, 900, from, to, 'x2="1" y2="1"')}
<rect width="600" height="900" fill="url(#s)"/>
${lines.map((line, i) => `<text x="44" y="${720 + i * (size + 8)}" font-family="sans-serif" font-size="${size}" font-weight="800" fill="#fff">${esc(line)}</text>`).join('\n')}
</svg>
`;
}

const backdropSvg = (id, genre, from, to) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
${scene(id, genre, 1600, 900, from, to, 'x2="0" y2="1"')}
</svg>
`;

/** 원어 음성이 기본이고, 가족 영화에는 한국어 더빙을 더합니다. */
const audioOf = (language, genres) => (genres.includes('가족') ? [language, '한국어'] : [language]);

mkdirSync('public/seed', { recursive: true });

const rows = MOVIES.map(
  ([
    id,
    title,
    originalTitle,
    year,
    country,
    language,
    genres,
    director,
    writer,
    cast,
    runtime,
    age,
    advisories,
    moods,
    from,
    to,
    releasedOn,
    firstImport,
    synopsis,
    importNote,
  ]) => {
    writeFileSync(`public/seed/${id}-poster.svg`, posterSvg(id, genres[0], title, from, to));
    writeFileSync(`public/seed/${id}-backdrop.svg`, backdropSvg(id, genres[0], from, to));
    return `  (${[
      sql(id),
      sql(title),
      sql(originalTitle),
      year,
      sql(country),
      sql(language),
      sqlArray(genres),
      sql(director),
      sql(writer),
      sqlArray(cast),
      runtime,
      sql(age),
      sqlArray(advisories),
      sqlArray(moods),
      sqlArray(audioOf(language, genres)),
      sqlArray(['한국어', '영어']),
      sql(synopsis),
      sql(importNote),
      firstImport,
      sql(releasedOn),
      sql(`/seed/${id}-poster.svg`),
      sql(`/seed/${id}-backdrop.svg`),
    ].join(', ')})`;
  },
);

writeFileSync(
  OUT,
  `-- scripts/generate-seed.mjs로 만든 가상의 영화입니다.
INSERT INTO movies (id, title, original_title, year, country, language, genres, director, writer, cast_members, runtime_minutes, age_rating, advisories, moods, audio_languages, subtitle_languages, synopsis, import_note, first_import, released_on, poster, backdrop) VALUES
${rows.join(',\n')};
`,
);
