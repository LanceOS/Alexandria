import { useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useTheme } from '../hooks/useTheme';
import { CurriculumPage } from '../modules/curriculum';
import { LibraryNavigation, LibraryPage, useLibrary } from '../modules/library';

/** Compose feature entry points with the shared workspace and browser navigation. */
export function WorkspacePage() {
  const navigation = useAppNavigation();
  const library = useLibrary();
  const { theme, chooseTheme } = useTheme();
  const { topicSlug, moduleId, partId } = navigation.curriculum;
  const breadcrumbTitle = topicSlug
    ? library.data?.topics.find((topic) => topic.slug === topicSlug)?.name ?? 'Learning'
    : null;

  useEffect(() => {
    document.title = `${breadcrumbTitle ?? 'Library'} · Alexandria`;
  }, [breadcrumbTitle]);

  return <AppShell
    theme={theme} onThemeChange={chooseTheme}
    breadcrumbTitle={breadcrumbTitle} onLibrary={() => navigation.navigate(null)}
    connection={{ loading: library.loading, error: library.error }} routeKey={navigation.routeKey}
    navigation={(closeMenu) => <LibraryNavigation data={library.data} category={navigation.filters.category}
      isLibrary={!topicSlug} onChooseSubject={(category) => { navigation.chooseSubject(category); closeMenu(); }} />}
  >
    {topicSlug
      ? <CurriculumPage topicSlug={topicSlug} moduleId={moduleId} partId={partId} onNavigate={navigation.navigate} />
      : <LibraryPage data={library.data} loading={library.loading} error={library.error} onRetry={library.retry}
        filters={navigation.filters} onChooseSubject={navigation.chooseSubject}
        onUpdateFilters={navigation.updateFilters} onNavigate={navigation.navigate} />}
  </AppShell>;
}
