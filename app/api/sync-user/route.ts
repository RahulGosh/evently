import { NextRequest, NextResponse } from "next/server";
import { syncUser } from "@/lib/actions/user.action";

export async function POST(request: NextRequest) {
  try {
    const { clerkUserId } = await request.json();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "clerkUserId is required" },
        { status: 400 }
      );
    }

    const user = await syncUser(clerkUserId);

    return NextResponse.json({
      success: true,
      userId: user.id,
      clerkId: user.clerkId,
      message: "User synced successfully",
    });
  } catch (error: any) {
    console.error("Error syncing user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync user" },
      { status: 500 }
    );
  }
}
