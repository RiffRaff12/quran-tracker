// Step-by-step onboarding test
// Run this in the browser console

console.log('🧪 Step-by-Step Onboarding Test');

// Step 1: Clear any existing data
function clearExistingData() {
  console.log('Step 1: Clearing existing data...');
  
  // Clear localStorage
  localStorage.clear();
  console.log('✅ localStorage cleared');
  
  // Clear IndexedDB
  if (typeof indexedDB !== 'undefined') {
    const request = indexedDB.deleteDatabase('ayat-revision-db');
    request.onsuccess = function() {
      console.log('✅ IndexedDB cleared');
    };
    request.onerror = function() {
      console.log('❌ Error clearing IndexedDB');
    };
  }
}

// Step 2: Navigate to onboarding
function navigateToOnboarding() {
  console.log('Step 2: Navigating to onboarding...');
  window.location.href = '/onboarding';
}

// Step 3: Simulate onboarding completion
function simulateOnboardingCompletion() {
  console.log('Step 3: Simulating onboarding completion...');
  
  // Wait for onboarding page to load
  setTimeout(() => {
    console.log('Onboarding page loaded, looking for surah selection...');
    
    // Look for surah selection buttons
    const surahButtons = document.querySelectorAll('div[onclick]') || 
                         document.querySelectorAll('.surah-item') ||
                         document.querySelectorAll('[data-surah-number]');
    
    console.log('Found surah buttons:', surahButtons.length);
    
    if (surahButtons.length > 0) {
      // Select first few surahs
      const surahsToSelect = [1, 2, 3]; // Al-Fatiha, Al-Baqarah, Al-Imran
      
      surahsToSelect.forEach((surahNumber, index) => {
        setTimeout(() => {
          const surahButton = Array.from(surahButtons).find(btn => 
            btn.textContent.includes(surahNumber.toString()) ||
            btn.getAttribute('data-surah-number') === surahNumber.toString()
          );
          
          if (surahButton) {
            console.log(`Selecting surah ${surahNumber}...`);
            surahButton.click();
          } else {
            console.log(`Could not find button for surah ${surahNumber}`);
          }
        }, index * 500);
      });
      
      // Wait and click complete button
      setTimeout(() => {
        const completeButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent.includes('Complete Setup') || 
          btn.textContent.includes('Complete')
        );
        
        if (completeButton) {
          console.log('Clicking complete button...');
          completeButton.click();
        } else {
          console.log('❌ Complete button not found');
        }
      }, surahsToSelect.length * 500 + 1000);
    } else {
      console.log('❌ No surah buttons found');
    }
  }, 2000);
}

// Step 4: Check Today tab after completion
function checkTodayTab() {
  console.log('Step 4: Checking Today tab...');
  
  setTimeout(() => {
    // Check if we're on dashboard
    if (window.location.pathname === '/') {
      console.log('✅ On dashboard page');
      
      // Look for Today tab
      const todayTab = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Today') || 
        btn.textContent.includes('Recommendations')
      );
      
      if (todayTab) {
        console.log('✅ Today tab found');
        
        // Check for revision cards
        const revisionCards = document.querySelectorAll('[data-testid="revision-card"]') || 
                             document.querySelectorAll('.revision-card') ||
                             document.querySelectorAll('[class*="revision"]');
        
        console.log('Revision cards found:', revisionCards.length);
        
        if (revisionCards.length > 0) {
          console.log('✅ Surahs are showing on Today tab!');
        } else {
          console.log('❌ No revision cards found on Today tab');
          
          // Check for "All Set for Today" message
          const allSetMessage = document.querySelector('h3');
          if (allSetMessage && allSetMessage.textContent.includes('All Set for Today')) {
            console.log('❌ "All Set for Today" message found - no revisions due');
          }
        }
      } else {
        console.log('❌ Today tab not found');
      }
    } else {
      console.log('❌ Not on dashboard page');
    }
  }, 3000);
}

// Run the complete test
async function runStepByStepTest() {
  console.log('🚀 Starting step-by-step onboarding test...');
  
  // Step 1: Clear data
  clearExistingData();
  
  // Step 2: Navigate to onboarding
  setTimeout(() => {
    navigateToOnboarding();
    
    // Step 3: Simulate completion
    setTimeout(() => {
      simulateOnboardingCompletion();
      
      // Step 4: Check Today tab
      setTimeout(() => {
        checkTodayTab();
      }, 5000);
    }, 3000);
  }, 1000);
}

// Auto-run the test
runStepByStepTest(); 