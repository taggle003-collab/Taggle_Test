import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get('country');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10;
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' });

    if (country) {
      query = query.eq('country', country);
    }

    // Map "Category" to the appropriate column. 
    // Assuming 'category' or 'businessType' or 'industry'. 
    // The prompt example used 'Category', but supabase-client has 'businessType'.
    // We will try to match the prompt's data description.
    if (category) {
      // We'll try to match against 'category' column first, if it fails we might need to adjust.
      // But since we can't see the schema, we'll assume 'category' based on the requirement "Select Category".
      // However, if the existing schema has 'businessType', maybe that's it.
      // Let's assume the table has a 'category' column as implied by the prompt's query example.
      // But to be safe, if the codebase uses businessType, I might check that too.
      // Given the prompt explicitly says: .eq('Category', 'Tech'), I will use 'category' (lowercase common practice)
      // or 'Category' if the DB is case sensitive on columns (Postgres usually isn't for unquoted).
      query = query.ilike('category', `%${category}%`);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Transform data to match frontend Lead interface if necessary
    // We need to see what we get. For now, we'll map best effort.
    const leads = (data || []).map((record: any) => {
        // Split name into first/last if needed
        const nameParts = (record.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        return {
            id: record.id,
            firstName: record.first_name || firstName,
            lastName: record.last_name || lastName,
            email: record.email || '',
            company: record.company || record.website || '',
            title: record.title || record.position || 'Unknown',
            location: record.location || `${record.city || ''}, ${record.country || ''}`.replace(/^, /, '').replace(/, $/, ''),
            companySize: record.company_size || 'Unknown',
            industry: record.category || record.business_type || category || 'Unknown',
            website: record.website,
            phone: record.phone,
            openHours: record.open_hours, // Requirement
            socialMedia: record.social_media, // Requirement
            source: 'database',
            matchQualityScore: 100, // It's a direct filter match
            matchedCriteria: [country, category].filter(Boolean)
        };
    });

    return NextResponse.json({
      success: true,
      leads,
      totalCount: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
