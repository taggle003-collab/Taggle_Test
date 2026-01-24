import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get all unique countries from leads table for this user
    const { data, error } = await supabase
      .from('leads')
      .select('country')
      .eq('userId', userId)
      .not('country', 'is', null);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Extract unique countries and sort them
    const countries = [...new Set(data?.map(item => item.country) || [])]
      .filter(Boolean)
      .sort();

    return NextResponse.json({ 
      success: true, 
      countries 
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}