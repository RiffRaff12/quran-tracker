// Comprehensive debug script for onboarding flow
// Run this in the browser console after completing onboarding

console.log('🔍 Starting comprehensive onboarding debug...');

// Test 1: Check if we're on the dashboard
function testDashboardState() {
  console.log('Test 1: Checking dashboard state...');
  console.log('Current URL:', window.location.href);
  console.log('Current pathname:', window.location.pathname);
  
  if (window.location.pathname === '/') {
    console.log('✅ On dashboard page');
    return true;
  } else {
    console.log('❌ Not on dashboard page');
    return false;
  }
}

// Test 2: Check localStorage for user profile
function testUserProfile() {
  console.log('Test 2: Checking user profile...');
  
  try {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      const profile = JSON.parse(profileData);
      console.log('✅ User profile found:', profile);
      console.log('Onboarding completed:', profile.hasCompletedOnboarding);
      console.log('Memorized surahs:', profile.memorisedSurahs);
      return profile;
    } else {
      console.log('❌ No user profile found in localStorage');
      return null;
    }
  } catch (error) {
    console.log('❌ Error reading user profile:', error);
    return null;
  }
}

// Test 3: Check IndexedDB for surah revisions
async function testSurahRevisions() {
  console.log('Test 3: Checking surah revisions in IndexedDB...');
  
  try {
    if (typeof indexedDB !== 'undefined') {
      const request = indexedDB.open('quran-tracker', 1);
      
      request.onsuccess = function(event) {
        const db = event.target.result;
        console.log('✅ IndexedDB opened successfully');
        
        if (db.objectStoreNames.contains('surahRevisions')) {
          console.log('✅ surahRevisions table exists');
          
          const transaction = db.transaction(['surahRevisions'], 'readonly');
          const store = transaction.objectStore('surahRevisions');
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = function() {
            const surahRevisions = getAllRequest.result;
            console.log('All surah revisions:', surahRevisions);
            
            const memorizedSurahs = surahRevisions.filter(s => s.memorized);
            console.log('Memorized surahs:', memorizedSurahs);
            
            const dueToday = memorizedSurahs.filter(s => {
              if (!s.nextRevision) return false;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const nextRevision = new Date(s.nextRevision);
              return nextRevision <= today;
            });
            
            console.log('Surahs due today:', dueToday);
            return dueToday;
          };
        } else {
          console.log('❌ surahRevisions table does not exist');
        }
      };
      
      request.onerror = function(event) {
        console.log('❌ Error opening IndexedDB:', event.target.error);
      };
    } else {
      console.log('❌ IndexedDB is not available');
    }
  } catch (error) {
    console.log('❌ Error accessing IndexedDB:', error);
  }
}

// Test 4: Check React Query cache
function testReactQueryCache() {
  console.log('Test 4: Checking React Query cache...');
  
  try {
    // Try to access React Query cache
    if (window.__REACT_QUERY_CACHE__) {
      console.log('✅ React Query cache found');
      const cache = window.__REACT_QUERY_CACHE__;
      console.log('Cache keys:', Object.keys(cache));
      
      // Check for todaysRevisions query
      const todaysRevisionsQuery = cache.find(query => 
        query.queryKey && query.queryKey[0] === 'todaysRevisions'
      );
      
      if (todaysRevisionsQuery) {
        console.log('✅ todaysRevisions query found:', todaysRevisionsQuery);
        console.log('Query data:', todaysRevisionsQuery.state.data);
      } else {
        console.log('❌ todaysRevisions query not found');
      }
      
      // Check for surahRevisions query
      const surahRevisionsQuery = cache.find(query => 
        query.queryKey && query.queryKey[0] === 'surahRevisions'
      );
      
      if (surahRevisionsQuery) {
        console.log('✅ surahRevisions query found:', surahRevisionsQuery);
        console.log('Query data:', surahRevisionsQuery.state.data);
      } else {
        console.log('❌ surahRevisions query not found');
      }
    } else {
      console.log('ℹ️ React Query cache not accessible');
    }
  } catch (error) {
    console.log('❌ Error accessing React Query cache:', error);
  }
}

// Test 5: Check DOM for Today tab content
function testTodayTabContent() {
  console.log('Test 5: Checking Today tab content...');
  
  // Look for revision cards
  const revisionCards = document.querySelectorAll('[data-testid="revision-card"]') || 
                       document.querySelectorAll('.revision-card') ||
                       document.querySelectorAll('[class*="revision"]');
  
  console.log('Revision cards found:', revisionCards.length);
  
  // Look for "All Set for Today" message
  const allSetMessage = document.querySelector('h3');
  if (allSetMessage && allSetMessage.textContent.includes('All Set for Today')) {
    console.log('❌ "All Set for Today" message found - no revisions due');
  } else {
    console.log('✅ No "All Set for Today" message found');
  }
  
  // Look for any surah information
  const surahElements = document.querySelectorAll('[class*="surah"]') ||
                       document.querySelectorAll('[data-surah]');
  
  console.log('Surah elements found:', surahElements.length);
  
  // Check if we're on the Today tab
  const todayTab = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent.includes('Today') || 
    btn.textContent.includes('Recommendations')
  );
  
  if (todayTab) {
    console.log('✅ Today tab found');
    const isActive = todayTab.classList.contains('bg-emerald-600') || 
                    todayTab.classList.contains('bg-primary');
    console.log('Today tab active:', isActive);
  } else {
    console.log('❌ Today tab not found');
  }
}

// Test 6: Force refresh the data
async function forceRefreshData() {
  console.log('Test 6: Force refreshing data...');
  
  try {
    // Try to trigger a manual refresh
    if (window.location.pathname === '/') {
      console.log('Refreshing page to force data reload...');
      window.location.reload();
    }
  } catch (error) {
    console.log('❌ Error refreshing data:', error);
  }
}

// Run all tests
async function runComprehensiveDebug() {
  console.log('🚀 Starting comprehensive debug...');
  
  // Wait for page to load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const dashboardOk = testDashboardState();
  
  if (dashboardOk) {
    const profile = testUserProfile();
    await testSurahRevisions();
    testReactQueryCache();
    testTodayTabContent();
    
    // Wait a bit more and check again
    setTimeout(() => {
      console.log('🔄 Re-checking after delay...');
      testTodayTabContent();
      testReactQueryCache();
    }, 1000);
  }
  
  console.log('🏁 Comprehensive debug completed!');
}

// Auto-run the tests
runComprehensiveDebug(); 