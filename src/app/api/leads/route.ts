import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const city = searchParams.get('city');
    const businessType = searchParams.get('businessType');

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('userId', userId);

    if (country) {
      query = query.eq('country', country);
    }

    if (city) {
      query = query.eq('city', city);
    }

    if (businessType) {
      query = query.ilike('businessType', `%${businessType}%`);
    }

    const { data, error, count } = await query.order('createdAt', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: data || [], 
      count: count || 0 
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}