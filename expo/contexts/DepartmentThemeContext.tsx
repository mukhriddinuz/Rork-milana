import { useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useWebHeader } from '@/contexts/WebHeaderContext';
import { DEPARTMENT_THEMES, DEFAULT_DEPARTMENT } from '@/constants/departmentThemes';
import { DepartmentTheme, DepartmentKey } from '@/types';

export const [DepartmentThemeProvider, useDepartmentTheme] = createContextHook(() => {
  const { selectedTopCategory } = useWebHeader();

  const activeDepartment: DepartmentKey = useMemo(() => {
    if (selectedTopCategory === 'men' || selectedTopCategory === 'women' || selectedTopCategory === 'kids') {
      return selectedTopCategory;
    }
    return DEFAULT_DEPARTMENT;
  }, [selectedTopCategory]);

  const theme: DepartmentTheme = useMemo(() => {
    return DEPARTMENT_THEMES[activeDepartment];
  }, [activeDepartment]);

  return useMemo(() => ({
    activeDepartment,
    theme,
    allThemes: DEPARTMENT_THEMES,
  }), [activeDepartment, theme]);
});
