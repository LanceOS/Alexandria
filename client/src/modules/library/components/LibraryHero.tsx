import { Icon } from '../../../components/ui/index.js';
import { LibraryIllustration } from './LibraryIllustration.js';

export function LibraryHero() {
  return <section className="welcome" aria-labelledby="welcome-heading" data-entrance>
    <div className="welcome-copy">
      <div className="eyebrow"><span />A SPACE FOR CURIOUS MINDS</div>
      <h1 id="welcome-heading">Follow your<br /><em>curiosity.</em></h1>
      <p>Ideas to explore. Connections to make.<br />A world of understanding, one topic at a time.</p>
      <a className="explore-link" href="#subjects">Explore your library<Icon name="arrow-right" size={17} /></a>
    </div>
    <LibraryIllustration />
  </section>;
}
