import { css } from '@emotion/react';
import type { FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import {
  AGE_LABELS,
  GENRES,
  parseMovieFilters,
  RUNTIMES,
  SORTS,
  STATUSES,
  toMovieQuery,
  useMovieFacets,
  type MovieFilters,
} from '@/entities/movie';
import { routes } from '@/shared/config';
import { Button, buttonCss } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { SelectControl } from '@/shared/ui/SelectControl';
import { inputCss, panelCss } from '@/shared/ui/styles';

const gridCss = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(200px, 100%), 1fr));
  gap: 16px;
`;
const detailsCss = css`
  margin-top: 16px;

  summary {
    min-height: 44px;
    padding-block: 10px;
    font-weight: 700;
    cursor: pointer;
  }
`;
const checkCss = css`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;

  input {
    width: 24px;
    height: 24px;
    margin: 0;
    accent-color: var(--accent);
  }
`;
const actionsCss = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
`;

function Select({
  label,
  name,
  value,
  options,
  all = '전체',
}: {
  label: string;
  name: string;
  value?: string | number;
  options: readonly (readonly [string | number, string])[];
  all?: string | null;
}) {
  return (
    <Field label={label}>
      {(control) => (
        <SelectControl {...control} name={name} defaultValue={value ?? ''}>
          {all !== null && <option value="">{all}</option>}
          {options.map(([key, text]) => (
            <option key={key} value={key}>
              {text}
            </option>
          ))}
        </SelectControl>
      )}
    </Field>
  );
}

const pairs = (values: readonly (string | number)[]) =>
  values.map((value) => [value, String(value)] as const);

interface Props {
  filters: MovieFilters;
  onApply: (query: string) => void;
}

/**
 * 조건을 고른 뒤 적용 버튼으로 반영합니다. 값을 바꾸는 것만으로 결과가 바뀌지 않게 해 사용자가 요청할 때만 움직입니다.
 * 주소가 곧 상태이므로 공유와 뒤로 가기가 그대로 동작합니다.
 */
export function MovieFilterForm({ filters, onApply }: Props) {
  const { data: facets } = useMovieFacets();
  const loaded = Boolean(facets);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of form) params.set(key, String(value));
    // 조건이 바뀌면 첫 페이지부터 봅니다.
    params.delete('page');
    onApply(toMovieQuery(parseMovieFilters(params)));
  };

  const advanced = Boolean(
    filters.year || filters.country || filters.director || filters.actor || filters.age || filters.runtime,
  );

  return (
    // 주소가 바뀌면 입력값을 다시 맞춥니다.
    <form key={toMovieQuery(filters)} css={panelCss} onSubmit={handleSubmit} aria-label="영화 필터">
      <div css={gridCss}>
        <Field label="검색어" hint="제목, 원제, 감독, 각본, 배우, 국가">
          {(control) => <input {...control} css={inputCss} type="search" name="q" defaultValue={filters.q} />}
        </Field>
        <Select label="장르" name="genre" value={filters.genre} options={pairs(GENRES)} />
        <Select label="공개 상태" name="status" value={filters.status} options={Object.entries(STATUSES)} />
        <Select
          label="정렬"
          name="sort"
          value={filters.sort ?? 'latest'}
          options={Object.entries(SORTS)}
          all={null}
        />
      </div>
      <label css={checkCss}>
        <input type="checkbox" name="firstImport" value="true" defaultChecked={filters.firstImport} />
        국내 첫 공개작만 보기
      </label>
      <details css={detailsCss} open={advanced}>
        <summary>상세 필터</summary>
        <div css={gridCss}>
          {/* 목록이 늦게 도착해도 입력 중인 값이 지워지지 않게, 목록을 쓰는 칸만 다시 만듭니다. */}
          <Select
            key={`year-${loaded}`}
            label="제작 연도"
            name="year"
            value={filters.year}
            options={pairs(facets?.years ?? [])}
          />
          <Select
            key={`country-${loaded}`}
            label="제작 국가"
            name="country"
            value={filters.country}
            options={pairs(facets?.countries ?? [])}
          />
          <Select
            key={`age-${loaded}`}
            label="관람 등급"
            name="age"
            value={filters.age}
            options={(facets?.ageRatings ?? []).map((age) => [age, AGE_LABELS[age]] as const)}
          />
          <Select
            label="러닝타임"
            name="runtime"
            value={filters.runtime}
            options={Object.entries(RUNTIMES)}
          />
          <Field label="감독">
            {(control) => (
              <input
                {...control}
                css={inputCss}
                name="director"
                list="director-list"
                defaultValue={filters.director}
              />
            )}
          </Field>
          <Field label="배우">
            {(control) => (
              <input
                {...control}
                css={inputCss}
                name="actor"
                list="actor-list"
                defaultValue={filters.actor}
              />
            )}
          </Field>
        </div>
        <datalist id="director-list">
          {facets?.directors.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </datalist>
        <datalist id="actor-list">
          {facets?.actors.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </datalist>
      </details>
      <div css={actionsCss}>
        <Button type="submit">적용</Button>
        <Link {...routes.movies()} css={buttonCss('outline')}>
          초기화
        </Link>
      </div>
    </form>
  );
}
