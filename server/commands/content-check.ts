import { listContentNames, loadContentCatalog, readContentArgument } from '../content/content-catalog.js';
import { validatePracticeVersions } from '../content/practice.js';

// Validation needs neither a database nor server environment configuration.
try {
  const requested = readContentArgument(process.argv.slice(2), false);
  const names = requested ? [requested] : listContentNames();
  const bundles = loadContentCatalog(names);
  if (names.includes('cpp')) validatePracticeVersions(bundles);
  const content = bundles.map((bundle, index) => {
    const modules = bundle.units.flatMap((unit) => unit.modules);
    return { folder: names[index], topic: bundle.topic.name, units: bundle.units.length,
      modules: modules.length, parts: modules.reduce((count, module) => count + module.parts.length, 0) };
  });
  console.log(JSON.stringify({ level: 'info', command: 'content:check', message: 'Curriculum JSON is valid.', content }));
} catch (error) {
  console.error(JSON.stringify({ level: 'error', command: 'content:check', message: error instanceof Error ? error.message : 'Content validation failed.' }));
  process.exitCode = 1;
}
