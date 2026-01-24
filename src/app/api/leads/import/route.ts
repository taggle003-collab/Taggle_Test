import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leads } = body;

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json({ success: false, error: 'Leads array is required' }, { status: 400 });
    }

    // Add userId to each lead
    const leadsWithUserId = leads.map(lead => ({
      ...lead,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('leads')
      .insert(leadsWithUserId)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      imported: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}