/**
 * test_gas.js
 * 
 * This script tests your live Google Apps Script Web App directly.
 * It uses native fetch (supported in Node.js v18+) with no external dependencies,
 * making it completely safe and easy to run!
 * 
 * To run this script, open your terminal and run:
 *   node test_gas.js
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbw9uc7nPwGCNvfc_fhlKe7W6DzLT7oi9bldAP4dajpUjkSEWdVC6ITTrYUwOXV776cY/exec';

// Test credentials
const EMAIL = 'visayas2.opsfinancialplanning@asaphil.org';
const PASSWORD = '123456';

async function runTest() {
  console.log('====================================================');
  console.log('🧪 TESTING GOOGLE APPS SCRIPT WEB APP API');
  console.log(`📡 URL: ${GAS_URL}`);
  console.log(`👤 User: ${EMAIL}`);
  console.log('====================================================\n');

  try {
    // 1. Test Login Action
    console.log('🔐 [1/2] Authenticating via login action...');
    const loginPayload = {
      action: 'login',
      email: EMAIL,
      password: PASSWORD
    };

    const loginRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginPayload)
    });

    const loginData = await loginRes.json();
    console.log('🔑 Login Response OK:', loginData.ok);
    if (!loginData.ok) {
      console.error('❌ Login Error:', loginData.error);
      return;
    }

    console.log('✅ Resolved User Details from Google Sheet:');
    console.log(JSON.stringify(loginData.user, null, 2));
    console.log('');

    // 2. Test getDrivenFactor Action
    console.log('📊 [2/2] Fetching budget and branch records...');
    const dfPayload = {
      action: 'getDrivenFactor',
      email: EMAIL,
      password: PASSWORD
    };

    const dfRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dfPayload)
    });

    const dfData = await dfRes.json();
    console.log('📈 getDrivenFactor Response OK:', dfData.ok);
    if (!dfData.ok) {
      console.error('❌ Fetch Error:', dfData.error);
      return;
    }

    const branchesCount = dfData.branches ? dfData.branches.length : 0;
    console.log(`\n📋 Branches found in your scope: ${branchesCount}`);

    if (branchesCount > 0) {
      console.log('✨ Sample Branch Object Structure (First Row):');
      console.log(JSON.stringify(dfData.branches[0], null, 2));
      
      // List the unique Divisions, Regions, and Areas present in the returned scope
      const divisions = [...new Set(dfData.branches.map(b => b.division).filter(Boolean))];
      const regions = [...new Set(dfData.branches.map(b => b.region).filter(Boolean))];
      const areas = [...new Set(dfData.branches.map(b => b.area).filter(Boolean))];

      console.log('\n🗺️  Returned Hierarchy Summary in your scope:');
      console.log(`🏢 Divisions: [${divisions.join(', ')}]`);
      console.log(`🗺️  Regions:   [${regions.join(', ')}]`);
      console.log(`📁 Areas:     [${areas.join(', ')}]`);
    } else {
      console.warn('⚠️  No branches were returned for this user! This means the user\'s scope code in your "user" sheet does not match the names/codes in your "Driven Factor" sheet.');
    }

  } catch (error) {
    console.error('❌ Network or Fetch Error:', error);
  }
  console.log('\n====================================================');
}

runTest();
