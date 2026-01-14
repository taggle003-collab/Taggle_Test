import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.KAGGLE_API_TOKEN;
  
  const results = {
    hasToken: !!token,
    tokenLength: token?.length || 0,
    tokenPrefix: token ? `${token.slice(0, 6)}...${token.slice(-4)}` : 'none',
    tests: [] as Array<{ name: string; success: boolean; message: string; data?: unknown }>
  };

  // Test 1: Check environment variable
  results.tests.push({
    name: 'Environment Variable Check',
    success: !!token,
    message: token ? `KAGGLE_API_TOKEN is set (${token.length} characters)` : 'KAGGLE_API_TOKEN is not set'
  });

  if (!token) {
    return NextResponse.json(results);
  }

  // Test 2: Test authentication endpoint
  try {
    console.log('[TEST_KAGGLE] Testing /users/whoami endpoint...');
    const authUrl = 'https://www.kaggle.com/api/v1/users/whoami';
    const authResponse = await fetch(authUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const authBody = await authResponse.text();

    results.tests.push({
      name: 'Authentication (/users/whoami)',
      success: authResponse.ok,
      message: authResponse.ok 
        ? 'Authentication successful' 
        : `Failed with status ${authResponse.status}: ${authResponse.statusText}`,
      data: {
        status: authResponse.status,
        statusText: authResponse.statusText,
        body: authBody.slice(0, 500)
      }
    });

    if (authResponse.ok) {
      try {
        const authData = JSON.parse(authBody);
        results.tests[results.tests.length - 1].data = authData;
      } catch {
        // Body is not JSON
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.tests.push({
      name: 'Authentication (/users/whoami)',
      success: false,
      message: `Network error: ${errorMessage}`
    });
  }

  // Test 3: Test dataset search endpoint
  try {
    console.log('[TEST_KAGGLE] Testing /datasets/search endpoint...');
    const searchUrl = new URL('https://www.kaggle.com/api/v1/datasets/search');
    searchUrl.searchParams.set('search', 'companies');
    searchUrl.searchParams.set('page_size', '5');

    const searchResponse = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const searchBody = await searchResponse.text();
    let searchData: unknown = null;
    try {
      searchData = JSON.parse(searchBody);
    } catch {
      // Not JSON
    }

    results.tests.push({
      name: 'Dataset Search (/datasets/search)',
      success: searchResponse.ok,
      message: searchResponse.ok
        ? 'Dataset search successful'
        : `Failed with status ${searchResponse.status}: ${searchResponse.statusText}`,
      data: {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        isArray: Array.isArray(searchData),
        isObject: typeof searchData === 'object' && searchData !== null,
        keys: typeof searchData === 'object' && searchData !== null ? Object.keys(searchData) : 'N/A',
        body: searchBody.slice(0, 500)
      }
    });

    if (Array.isArray(searchData)) {
      results.tests[results.tests.length - 1].data = {
        arrayLength: searchData.length,
        sample: searchData.slice(0, 2)
      };
    } else if (searchData && typeof searchData === 'object' && searchData !== null && 'results' in searchData) {
      const resultsArray = (searchData as { results?: unknown }).results;
      results.tests[results.tests.length - 1].data = {
        hasResults: true,
        resultsLength: Array.isArray(resultsArray) ? resultsArray.length : 'N/A',
        sample: Array.isArray(resultsArray) ? resultsArray.slice(0, 2) : 'N/A'
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.tests.push({
      name: 'Dataset Search (/datasets/search)',
      success: false,
      message: `Network error: ${errorMessage}`
    });
  }

  // Test 4: Test alternative endpoint with Basic Auth
  try {
    console.log('[TEST_KAGGLE] Testing Basic Auth alternative...');
    const basicAuthUrl = 'https://www.kaggle.com/api/v1/users/whoami';
    const basicResponse = await fetch(basicAuthUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(token + ':').toString('base64')}`
      }
    });

    const basicBody = await basicResponse.text();

    results.tests.push({
      name: 'Authentication with Basic Auth (alternative)',
      success: basicResponse.ok,
      message: basicResponse.ok
        ? 'Basic Auth successful'
        : `Failed with status ${basicResponse.status}: ${basicResponse.statusText}`,
      data: {
        status: basicResponse.status,
        statusText: basicResponse.statusText,
        body: basicBody.slice(0, 500)
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.tests.push({
      name: 'Authentication with Basic Auth (alternative)',
      success: false,
      message: `Network error: ${errorMessage}`
    });
  }

  return NextResponse.json(results);
}
