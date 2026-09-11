import { Icon } from '../../../components/ui/index.js';
import type { Category, LibraryResponse } from '../types/index.js';
import { countCategoryTopics } from '../utils/selectors.js';
import { subjectStyles } from '../utils/subjects.js';

export function SubjectGrid({ data, loading, selected, onChooseSubject }: {
  data: LibraryResponse | null;
  loading: boolean;
  selected: Category | undefined;
  onChooseSubject: (slug: string) => void;
}) {
  return <section id="subjects" className="subjects-section" aria-labelledby="subjects-heading" data-entrance>
    <div className="section-heading"><h2 id="subjects-heading">Browse by subject</h2><span className="section-note">Find your next direction</span></div>
    <div className="subject-grid" aria-busy={loading}>
      {loading && [0, 1, 2].map((index) => <div key={index} className="subject-skeleton" aria-hidden="true" />)}
      {!loading && (data?.categories ?? []).map((category, index) => {
        const style = subjectStyles[category.slug];
        const count = countCategoryTopics(data, category.id);
        return <button key={category.id} className={`subject-card ${style?.className ?? ''} ${selected?.id === category.id ? 'subject-selected' : ''}`}
          aria-pressed={selected?.id === category.id} onClick={() => onChooseSubject(selected?.id === category.id ? 'all' : category.slug)}>
          <div className="subject-card-top"><span className="subject-symbol"><Icon name={style?.icon ?? 'book'} size={27} /></span><span className="subject-number">0{index + 1}</span></div>
          <h3>{style?.label ?? category.name}</h3>
          <p>{category.description}</p>
          <div className="subject-card-bottom"><span>{count} {count === 1 ? 'topic' : 'topics'}</span><Icon name={selected?.id === category.id ? 'check' : 'arrow-up-right'} size={18} /></div>
        </button>;
      })}
    </div>
  </section>;
}
