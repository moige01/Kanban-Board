import { useEffect } from 'react';
import { useThemeStore } from './stores/useThemeStore';
import { useProjectStore } from './stores/useProjectStore';
import { AppShell } from './components/layout/AppShell';
import './App.css';

export default function App() {
  const { init: initTheme } = useThemeStore();
  const { init: initProjects } = useProjectStore();

  useEffect(() => {
    initTheme();
    initProjects();
  }, []);

  return <AppShell />;
}
