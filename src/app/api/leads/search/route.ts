import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get('country') || 'USA';
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 10;
    const offset = (page - 1) * limit;

    console.log(`[LEADS_SEARCH] Fetching: country=${country}, category=${category}, page=${page}`);

    // Check if Supabase client is initialized
    if (!supabase) {
      console.error('[LEADS_SEARCH] Supabase client is not initialized');
      return NextResponse.json(
        { success: false, error: 'Supabase client not initialized' },
        { status: 500 }
      );
    }

    // Build the query
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' });

    // Filter by country
    if (country) {
      console.log(`[LEADS_SEARCH] Filtering by country: ${country}`);
      query = query.eq('country', country);
    }

    // Filter by category (mapped to businessType column)
    if (category) {
      console.log(`[LEADS_SEARCH] Filtering by category/businessType: ${category}`);
      query = query.ilike('businessType', `%${category}%`);
    }

    // Execute the query with pagination
    console.log(`[LEADS_SEARCH] Executing query with offset=${offset}, limit=${limit}`);
    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[LEADS_SEARCH] Supabase query error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json(
        { success: false, error: error.message, details: error.details },
        { status: 500 }
      );
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    console.log(`[LEADS_SEARCH] Found ${totalCount} total leads, returning ${data?.length || 0} leads`);

    // Transform data to match frontend Lead interface
    const leads = (data || []).map((record: any) => {
      // Split name into first/last if needed
      const nameParts = (record.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      return {
        id: record.id,
        firstName: firstName,
        lastName: lastName,
        email: record.email || '',
        company: record.company || record.website || '',
        title: record.title || record.position || 'Unknown',
        location: record.location || `${record.city || ''}, ${record.country || ''}`.replace(/^, /, '').replace(/, $/, ''),
        companySize: record.companySize || record.company_size || 'Unknown',
        industry: record.businessType || record.category || category || 'Unknown',
        website: record.website,
        phone: record.phone,
        openHours: record.openHours,
        socialMedia: record.socialMedia,
        source: 'database',
        matchQualityScore: 100,
        matchedCriteria: [country, category].filter(Boolean)
      };
    });

    return NextResponse.json({
      success: true,
      leads,
      totalCount,
      page,
      totalPages,
      pageSize: limit
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[LEADS_SEARCH] Unexpected error:', {
      message,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
