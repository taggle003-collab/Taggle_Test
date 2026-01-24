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

    if (!country) {
      return NextResponse.json({ success: false, error: 'Country parameter is required' }, { status: 400 });
    }

    // Get all unique cities for the specified country and user
    const { data, error } = await supabase
      .from('leads')
      .select('city')
      .eq('userId', userId)
      .eq('country', country)
      .not('city', 'is', null);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Extract unique cities and sort them
    const cities = [...new Set(data?.map(item => item.city) || [])]
      .filter(Boolean)
      .sort();

    return NextResponse.json({ 
      success: true, 
      cities 
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}