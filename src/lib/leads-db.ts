import type { PostgrestError, PostgrestSingleResponse } from "@supabase/supabase-js";
import type { Lead } from "@/lib/supabase-client";

export type LeadFilters = {
  country?: string | null;
  city?: string | null;
  businessType?: string | null;
};

type AnyRow = Record<string, unknown>;

export function mapLeadRow(row: AnyRow): Lead {
  const createdAt =
    (row.createdAt as string | undefined) ??
    (row.created_at as string | undefined) ??
    "";

  const updatedAt =
    (row.updatedAt as string | undefined) ??
    (row.updated_at as string | undefined) ??
    createdAt;

  return {
    id: String(row.id ?? ""),
    userId: String((row.userId as string | undefined) ?? (row.user_id as string | undefined) ?? ""),
    name: String(row.name ?? ""),
    email: (row.email as string | undefined) ?? undefined,
    phone: (row.phone as string | undefined) ?? undefined,
    address: (row.address as string | undefined) ?? undefined,
    website: (row.website as string | undefined) ?? undefined,
    socialMedia:
      (row.socialMedia as string | undefined) ??
      (row.social_media as string | undefined) ??
      undefined,
    country: String(row.country ?? ""),
    city: (row.city as string | undefined) ?? undefined,
    businessType:
      (row.businessType as string | undefined) ??
      (row.business_type as string | undefined) ??
      undefined,
    createdAt,
    updatedAt,
  };
}

function isColumnNotFoundError(error: PostgrestError | null | undefined): boolean {
  if (!error?.message) return false;
  return /column .* does not exist/i.test(error.message);
}

export async function withBusinessTypeColumnFallback<T>(
  attempt: (
    businessTypeColumn: "businessType" | "business_type"
  ) => PromiseLike<PostgrestSingleResponse<T>>
): Promise<PostgrestSingleResponse<T>> {
  const first = await attempt("businessType");
  if (!first.error) return first;

  if (!isColumnNotFoundError(first.error)) {
    return first;
  }

  return attempt("business_type");
}

export async function withTimestampColumnFallback<T>(
  attempt: (
    createdAtColumn: "createdAt" | "created_at"
  ) => PromiseLike<PostgrestSingleResponse<T>>
): Promise<PostgrestSingleResponse<T>> {
  const first = await attempt("createdAt");
  if (!first.error) return first;

  if (!isColumnNotFoundError(first.error)) {
    return first;
  }

  return attempt("created_at");
}
