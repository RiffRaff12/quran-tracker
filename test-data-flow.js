// Test script to verify data flow during onboarding
// Run this in the browser console

console.log('🔍 Testing Data Flow...');

// Test 1: Check localStorage
function testLocalStorage() {
  console.log('Test 1: Checking localStorage...');
  
  try {
    const keys = Object.keys(localStorage);
    console.log('localStorage keys:', keys);
    
    // Look for user profile data
    const profileData = localStorage.getItem('userProfile') || 
                       localStorage.getItem('profile') ||
                       localStorage.getItem('onboarding');
    
    if (profileData) {
      console.log('✅ Found profile data in localStorage:', JSON.parse(profileData));
    } else {
      console.log('ℹ️ No profile data found in localStorage');
    }
  } catch (error) {
    console.log('❌ Error accessing localStorage:', error);
  }
}

// Test 2: Check IndexedDB
async function testIndexedDB() {
  console.log('Test 2: Checking IndexedDB...');
  
  try {
    if (typeof indexedDB !== 'undefined') {
      console.log('✅ IndexedDB is available');
      
      // Try to access the database
      const request = indexedDB.open('quran-tracker', 1);
      
      request.onsuccess = function(event) {
        const db = event.target.result;
        console.log('✅ IndexedDB opened successfully');
        
        // Check for user profile table
        if (db.objectStoreNames.contains('userProfile')) {
          console.log('✅ userProfile table exists');
          
          const transaction = db.transaction(['userProfile'], 'readonly');
          const store = transaction.objectStore('userProfile');
          const getRequest = store.get('local-profile');
          
          getRequest.onsuccess = function() {
            if (getRequest.result) {
              console.log('✅ Found user profile in IndexedDB:', getRequest.result);
            } else {
              console.log('ℹ️ No user profile found in IndexedDB');
            }
          };
        } else {
          console.log('ℹ️ userProfile table does not exist');
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

// Test 3: Check React Query cache
function testReactQueryCache() {
  console.log('Test 3: Checking React Query cache...');
  
  try {
    // Try to access React Query cache
    if (window.__REACT_QUERY_CACHE__) {
      console.log('✅ React Query cache found');
      console.log('Cache keys:', Object.keys(window.__REACT_QUERY_CACHE__));
    } else {
      console.log('ℹ️ React Query cache not accessible');
    }
  } catch (error) {
    console.log('❌ Error accessing React Query cache:', error);
  }
}

// Test 4: Check current URL and navigation state
function testNavigationState() {
  console.log('Test 4: Checking navigation state...');
  
  console.log('Current URL:', window.location.href);
  console.log('Current pathname:', window.location.pathname);
  console.log('Current search:', window.location.search);
  console.log('Current hash:', window.location.hash);
  
  // Check if we're in a React Router context
  if (window.history && window.history.state) {
    console.log('History state:', window.history.state);
  }
}

// Test 5: Check for onboarding completion flag
async function testOnboardingCompletion() {
  console.log('Test 5: Checking onboarding completion status...');
  
  try {
    // Check localStorage first
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      const profile = JSON.parse(profileData);
      console.log('Onboarding completed:', profile.hasCompletedOnboarding);
      console.log('Memorized surahs:', profile.memorisedSurahs);
    }
    
    // Check IndexedDB
    if (typeof indexedDB !== 'undefined') {
      const request = indexedDB.open('quran-tracker', 1);
      request.onsuccess = function(event) {
        const db = event.target.result;
        if (db.objectStoreNames.contains('userProfile')) {
          const transaction = db.transaction(['userProfile'], 'readonly');
          const store = transaction.objectStore('userProfile');
          const getRequest = store.get('local-profile');
          
          getRequest.onsuccess = function() {
            if (getRequest.result) {
              console.log('IndexedDB - Onboarding completed:', getRequest.result.hasCompletedOnboarding);
              console.log('IndexedDB - Memorized surahs:', getRequest.result.memorisedSurahs);
            }
          };
        }
      };
    }
  } catch (error) {
    console.log('❌ Error checking onboarding completion:', error);
  }
}

// Run all tests
async function runDataFlowTests() {
  console.log('🚀 Starting data flow tests...');
  
  testLocalStorage();
  await testIndexedDB();
  testReactQueryCache();
  testNavigationState();
  await testOnboardingCompletion();
  
  console.log('🏁 Data flow tests completed!');
}

// Auto-run the tests
runDataFlowTests(); 