// Manual test script for onboarding flow
// Run this in the browser console after opening http://localhost:8081

console.log('🧪 Manual Onboarding Test Started');

// Test 1: Check if we're redirected to onboarding
function testOnboardingRedirect() {
  console.log('Test 1: Checking onboarding redirect...');
  
  // Check current URL
  const currentPath = window.location.pathname;
  console.log('Current path:', currentPath);
  
  if (currentPath === '/onboarding') {
    console.log('✅ Successfully redirected to onboarding');
    return true;
  } else {
    console.log('❌ Not redirected to onboarding, current path:', currentPath);
    return false;
  }
}

// Test 2: Simulate onboarding completion
async function testOnboardingCompletion() {
  console.log('Test 2: Simulating onboarding completion...');
  
  // Check if we're on the onboarding page
  if (window.location.pathname !== '/onboarding') {
    console.log('❌ Not on onboarding page, cannot test completion');
    return false;
  }
  
  // Look for the onboarding component
  const onboardingElement = document.querySelector('[data-testid="onboarding"]') || 
                           document.querySelector('.onboarding') ||
                           document.querySelector('h2');
  
  if (!onboardingElement) {
    console.log('❌ Onboarding component not found');
    return false;
  }
  
  console.log('✅ Onboarding component found');
  
  // Look for surah selection buttons
  const surahButtons = document.querySelectorAll('[data-surah-number]') || 
                       document.querySelectorAll('.surah-item') ||
                       document.querySelectorAll('button');
  
  console.log('Found', surahButtons.length, 'potential surah buttons');
  
  // Simulate selecting a surah (first one)
  if (surahButtons.length > 0) {
    console.log('Clicking first surah button...');
    surahButtons[0].click();
    
    // Wait a bit and look for complete button
    setTimeout(() => {
      const completeButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Complete Setup') || 
        btn.textContent.includes('Complete')
      );
      
      if (completeButton) {
        console.log('✅ Found complete button, clicking...');
        completeButton.click();
        
        // Wait for navigation
        setTimeout(() => {
          console.log('Test 3: Checking navigation after completion...');
          const newPath = window.location.pathname;
          console.log('New path after completion:', newPath);
          
          if (newPath === '/') {
            console.log('✅ Successfully navigated to dashboard after completion!');
          } else {
            console.log('❌ Failed to navigate to dashboard, still on:', newPath);
          }
        }, 1000);
      } else {
        console.log('❌ Complete button not found');
      }
    }, 500);
  } else {
    console.log('❌ No surah buttons found');
  }
}

// Test 3: Check dashboard state
function testDashboardState() {
  console.log('Test 3: Checking dashboard state...');
  
  const currentPath = window.location.pathname;
  if (currentPath === '/') {
    console.log('✅ On dashboard page');
    
    // Check for dashboard elements
    const dashboardElements = document.querySelectorAll('h1, h2, h3');
    console.log('Dashboard elements found:', dashboardElements.length);
    
    // Look for "Today" tab or similar
    const todayTab = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Today') || 
      btn.textContent.includes('Recommendations')
    );
    
    if (todayTab) {
      console.log('✅ Today tab found on dashboard');
    } else {
      console.log('❌ Today tab not found on dashboard');
    }
  } else {
    console.log('❌ Not on dashboard page, current path:', currentPath);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting manual onboarding tests...');
  
  // Wait for page to load
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const test1Result = testOnboardingRedirect();
  
  if (test1Result) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testOnboardingCompletion();
    
    // Wait for navigation
    setTimeout(() => {
      testDashboardState();
      console.log('🏁 Manual tests completed!');
    }, 2000);
  }
}

// Auto-run the tests
runAllTests(); 