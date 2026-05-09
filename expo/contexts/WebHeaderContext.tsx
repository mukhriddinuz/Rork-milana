import { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';

export const [WebHeaderProvider, useWebHeader] = createContextHook(() => {
  const [search, setSearch] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [selectedTopCategory, setSelectedTopCategory] = useState('all');
  const [showCatalog, setShowCatalog] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarVisible((v) => !v);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarVisible(false);
  }, []);

  const enterCatalog = useCallback(() => {
    setShowCatalog(true);
  }, []);

  const exitCatalog = useCallback(() => {
    setShowCatalog(false);
  }, []);

  const navigateToSegment = useCallback((topCategory: string, category?: string, searchQuery?: string) => {
    console.log('[WebHeader] navigateToSegment:', { topCategory, category, searchQuery });
    setSelectedTopCategory(topCategory);
    if (category) setSelectedCategory(category);
    else setSelectedCategory('all');
    if (searchQuery) setSearch(searchQuery);
    else setSearch('');
    setShowCatalog(true);
  }, []);

  const goHome = useCallback(() => {
    setShowCatalog(false);
    setSelectedCategory('all');
    setSelectedTopCategory('all');
    setSearch('');
  }, []);

  const selectDepartment = useCallback((dept: string) => {
    console.log('[WebHeader] selectDepartment (showroom):', dept);
    setSelectedTopCategory(dept);
    setSelectedCategory('all');
    setSearch('');
    setShowCatalog(false);
  }, []);

  return useMemo(() => ({
    search,
    setSearch,
    sidebarVisible,
    toggleSidebar,
    closeSidebar,
    selectedCategory,
    setSelectedCategory,
    megaMenuOpen,
    setMegaMenuOpen,
    selectedTopCategory,
    setSelectedTopCategory,
    showCatalog,
    enterCatalog,
    exitCatalog,
    navigateToSegment,
    goHome,
    selectDepartment,
  }), [search, setSearch, sidebarVisible, toggleSidebar, closeSidebar, selectedCategory, setSelectedCategory, megaMenuOpen, setMegaMenuOpen, selectedTopCategory, setSelectedTopCategory, showCatalog, enterCatalog, exitCatalog, navigateToSegment, goHome, selectDepartment]);
});
