import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000/api';

async function testRateLimit() {
  console.log('Testing rate limiting...\n');

  // Test 1: General API rate limiting
  console.log('Test 1: Testing general API rate limiting...');
  try {
    for (let i = 0; i < 105; i++) {
      const response = await fetch(`${BASE_URL}/users/verify-access`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
      
      if (i === 100) {
        console.log(`Request ${i + 1}: Status ${response.status}`);
        if (response.status === 429) {
          console.log('✅ Rate limiting is working for general API requests');
        } else {
          console.log('❌ Rate limiting not working for general API requests');
        }
      }
    }
  } catch (error) {
    console.log('Error testing general rate limiting:', error.message);
  }

  // Test 2: Authentication rate limiting
  console.log('\nTest 2: Testing authentication rate limiting...');
  try {
    for (let i = 0; i < 7; i++) {
      const response = await fetch(`${BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'test@example.com',
          password: 'testpassword'
        })
      });
      
      if (i === 5) {
        console.log(`Request ${i + 1}: Status ${response.status}`);
        if (response.status === 429) {
          console.log('✅ Rate limiting is working for authentication requests');
        } else {
          console.log('❌ Rate limiting not working for authentication requests');
        }
      }
    }
  } catch (error) {
    console.log('Error testing authentication rate limiting:', error.message);
  }

  // Test 3: Registration rate limiting
  console.log('\nTest 3: Testing registration rate limiting...');
  try {
    for (let i = 0; i < 5; i++) {
      const response = await fetch(`${BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: `test${i}@example.com`,
          password: 'testpassword123',
          email: `test${i}@example.com`,
          first_name: 'Test',
          last_name: 'User',
          phone: '1234567890',
          aadhar_number: `12345678901${i}`,
          dob: '1990-01-01',
          gender: 'MALE',
          temple_name: 'BARKUR'
        })
      });
      
      if (i === 3) {
        console.log(`Request ${i + 1}: Status ${response.status}`);
        if (response.status === 429) {
          console.log('✅ Rate limiting is working for registration requests');
        } else {
          console.log('❌ Rate limiting not working for registration requests');
        }
      }
    }
  } catch (error) {
    console.log('Error testing registration rate limiting:', error.message);
  }

  console.log('\nRate limiting test completed!');
}

testRateLimit().catch(console.error); 