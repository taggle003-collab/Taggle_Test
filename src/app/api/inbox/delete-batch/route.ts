import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const { batchId } = await request.json();
    
    if (!batchId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Batch ID is required' 
        },
        { status: 400 }
      );
    }
    
    // In a real app, this would delete from database
    // For now, deletion is handled client-side in localStorage
    
    return NextResponse.json({
      success: true,
      message: 'Batch deletion endpoint available',
      data: { batchId },
    });
  } catch (error) {
    console.error('Error in delete-batch API:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete batch',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}