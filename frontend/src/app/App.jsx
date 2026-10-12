import { AppProviders } from './providers.jsx';
import { AppRouter } from './router.jsx';

export function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}

export default App;
