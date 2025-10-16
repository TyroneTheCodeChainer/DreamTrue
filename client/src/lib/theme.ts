// Auto dark mode based on time
export function initializeTheme() {
  const hour = new Date().getHours();
  const isNightTime = hour >= 20 || hour < 7; // 8PM - 7AM
  
  if (isNightTime) {
    document.documentElement.classList.add('dark');
  } else {
    // Check user preference
    const userPreference = localStorage.getItem('theme');
    if (userPreference === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (userPreference === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Default to dark for dream journaling
      document.documentElement.classList.add('dark');
    }
  }
}

export function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  return isDark;
}
