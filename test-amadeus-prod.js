// test-amadeus-prod.js - Test your Amadeus production credentials
// Run with: node test-amadeus-prod.js

import 'dotenv/config';
import fetch from 'node-fetch';

async function testAmadeusProduction() {
  console.log('🧪 Testing Amadeus Production Authentication\n');
  console.log('========================================\n');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`   AMADEUS_API_KEY: ${process.env.AMADEUS_API_KEY ? '✅ Found' : '❌ Missing'}`);
  console.log(`   AMADEUS_API_SECRET: ${process.env.AMADEUS_API_SECRET ? '✅ Found' : '❌ Missing'}`);
  
  if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
    console.error('\n❌ Missing required environment variables!');
    console.error('   Please check your .env file');
    return;
  }
  
  console.log('\n📤 Attempting authentication...\n');
  
  try {
    // Prepare the request exactly as Amadeus expects
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', process.env.AMADEUS_API_KEY.trim());
    formData.append('client_secret', process.env.AMADEUS_API_SECRET.trim());
    
    console.log('   URL: https://api.amadeus.com/v1/security/oauth2/token');
    console.log('   Method: POST');
    console.log('   Content-Type: application/x-www-form-urlencoded');
    console.log(`   Client ID length: ${process.env.AMADEUS_API_KEY.length} chars`);
    console.log(`   Client Secret length: ${process.env.AMADEUS_API_SECRET.length} chars`);
    console.log();
    
    const response = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: formData.toString()
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ AUTHENTICATION SUCCESSFUL!\n');
      console.log('📊 Token Details:');
      console.log(`   Type: ${data.type}`);
      console.log(`   Username: ${data.username}`);
      console.log(`   Application: ${data.application_name}`);
      console.log(`   Scope: ${data.scope}`);
      console.log(`   Expires in: ${data.expires_in} seconds (${Math.round(data.expires_in / 60)} minutes)`);
      console.log(`   Token preview: ${data.access_token.substring(0, 30)}...`);
      console.log(`   State: ${data.state}`);
      console.log('\n✅ Your credentials are valid for PRODUCTION environment!');
      console.log('   You can now use the Amadeus API in your application.');
      
      // Test a simple API call
      console.log('\n🧪 Testing a simple API call (Airport search)...\n');
      
      const testResponse = await fetch(
        'https://api.amadeus.com/v1/reference-data/locations?subType=AIRPORT&keyword=LON',
        {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
            'Accept': 'application/json'
          }
        }
      );
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('✅ API call successful!');
        console.log(`   Found ${testData.data?.length || 0} airports matching "LON"`);
        if (testData.data && testData.data.length > 0) {
          console.log(`   Example: ${testData.data[0].name} (${testData.data[0].iataCode})`);
        }
      } else {
        console.log('⚠️ API test call failed:', testResponse.status);
        console.log('   This might be a rate limit or scope issue.');
      }
      
    } else {
      console.log('❌ AUTHENTICATION FAILED!\n');
      console.log(`   HTTP Status: ${response.status} ${response.statusText}`);
      console.log('   Response:', responseText);
      
      try {
        const errorData = JSON.parse(responseText);
        console.log('\n📊 Error Details:');
        console.log(`   Error: ${errorData.error}`);
        console.log(`   Description: ${errorData.error_description}`);
        console.log(`   Code: ${errorData.code}`);
        console.log(`   Title: ${errorData.title}`);
        
        if (errorData.error === 'invalid_client') {
          console.log('\n💡 Possible solutions:');
          console.log('   1. Check that your API Key and Secret are correct');
          console.log('   2. Make sure there are no extra spaces or quotes');
          console.log('   3. Verify your app is active in the Amadeus dashboard');
          console.log('   4. Ensure you\'re using PRODUCTION (not TEST) credentials');
          console.log('   5. Try regenerating your API Secret in the dashboard');
        }
      } catch (e) {
        // Response wasn't JSON
      }
    }
    
  } catch (error) {
    console.log('❌ Network or other error:', error.message);
    console.log('\n💡 Check your internet connection and proxy settings');
  }
  
  console.log('\n========================================\n');
}

// Run the test
testAmadeusProduction();