import { Icon } from '../../../components/ui/index.js';
import type { Navigate } from '../../../types/navigation.js';
import { destinationHref, shouldInterceptNavigation } from '../../../utils/navigation.js';
import type { Topic } from '../types/index.js';

export function TopicCard({ topic, onNavigate }: { topic: Topic; onNavigate: Navigate }) {
  const destination = { topicSlug: topic.slug };
  return <a className="topic-card topic-card-link" href={destinationHref(destination)} onClick={(event) => {
    if (!shouldInterceptNavigation(event)) return;
    event.preventDefault();
    onNavigate(destination);
  }}>
    <div className="topic-card-symbol"><Icon name={topic.slug === 'cpp' ? 'code' : 'book'} size={22} /><Icon name="arrow-up-right" size={18} /></div>
    <h3>{topic.name}</h3><p>{topic.description}</p>
    <span className="topic-card-action">Explore topic<Icon name="arrow-right" size={16} /></span>
  </a>;
}
