export interface SavedICPProfile {
  id: string;
  name: string;
  industry?: string[];
  companySize?: string[];
  location?: string[];
  jobTitles?: string[];
  annualRevenue?: string;
  fundingStage?: string[];
  customICP?: string;
  qualityScore?: number;
  createdAt: Date;
  usageCount: number;
}

const STORAGE_KEY = "taggle_saved_icp_profiles";

// Save ICP profile to localStorage
export const saveICPProfile = (profile: Omit<SavedICPProfile, 'id' | 'createdAt' | 'usageCount'>): SavedICPProfile => {
  if (typeof window === 'undefined') {
    throw new Error('localStorage is not available on the server');
  }

  const newProfile: SavedICPProfile = {
    ...profile,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    usageCount: 0,
  };

  const profiles = getAllICPProfiles();
  profiles.push(newProfile);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  
  return newProfile;
};

// Update existing ICP profile
export const updateICPProfile = (id: string, updates: Partial<SavedICPProfile>): SavedICPProfile | null => {
  if (typeof window === 'undefined') {
    throw new Error('localStorage is not available on the server');
  }

  const profiles = getAllICPProfiles();
  const index = profiles.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  profiles[index] = { ...profiles[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  
  return profiles[index];
};

// Load saved ICP profile by ID
export const loadICPProfile = (id: string): SavedICPProfile | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const profiles = getAllICPProfiles();
  return profiles.find(p => p.id === id) || null;
};

// Get all saved ICP profiles for user
export const getAllICPProfiles = (): SavedICPProfile[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const profiles = JSON.parse(data);
    // Convert date strings back to Date objects
    return profiles.map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt),
    }));
  } catch (error) {
    console.error('Error loading ICP profiles:', error);
    return [];
  }
};

// Delete ICP profile
export const deleteICPProfile = (id: string): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const profiles = getAllICPProfiles();
  const filtered = profiles.filter(p => p.id !== id);
  
  if (filtered.length === profiles.length) return false; // Profile not found
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
};

// Duplicate ICP profile
export const duplicateICPProfile = (id: string): SavedICPProfile | null => {
  const profile = loadICPProfile(id);
  if (!profile) return null;
  
  const { id: _, createdAt: __, usageCount: ___, ...rest } = profile;
  return saveICPProfile({
    ...rest,
    name: `${profile.name} (Copy)`,
  });
};

// Increment usage count
export const incrementProfileUsage = (id: string): void => {
  const profile = loadICPProfile(id);
  if (!profile) return;
  
  updateICPProfile(id, {
    usageCount: profile.usageCount + 1,
  });
};

// Validate ICP data based on plan level
export const validateICP = (
  data: any,
  level: "basic" | "advanced"
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check if custom ICP or structured fields are provided
  const hasCustomICP = data.customICP && data.customICP.trim().length > 0;
  
  if (level === "basic") {
    // Basic validation: need custom ICP OR all basic fields
    const hasBasicFields = data.industry && data.companySize && data.location && data.jobTitles?.length > 0;
    
    if (!hasCustomICP && !hasBasicFields) {
      errors.push("Please provide either a custom ICP description or fill in all basic fields (industry, company size, location, job titles)");
    }
    
    // Validate job titles limit for Lite plan
    if (data.jobTitles && data.jobTitles.length > 3) {
      errors.push("Lite plan allows up to 3 job titles. Upgrade to Solo for more.");
    }
    
    // Check for advanced fields (should not be used in basic)
    if (data.annualRevenue || data.fundingStage || data.qualityScore) {
      errors.push("Advanced criteria (revenue, funding, quality score) require Solo or Pro plan");
    }
  } else {
    // Advanced validation: need custom ICP OR at least one field
    const hasAnyField = data.industry || data.companySize || data.location || 
                        data.jobTitles?.length > 0 || data.annualRevenue || data.fundingStage;
    
    if (!hasCustomICP && !hasAnyField) {
      errors.push("Please provide either a custom ICP description or at least one search criterion");
    }
    
    // Validate job titles limit for Solo plan
    if (data.jobTitles && data.jobTitles.length > 10) {
      errors.push("Maximum 10 job titles allowed");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Calculate match quality score (for Pro users)
export const calculateMatchQuality = (lead: any, icp: SavedICPProfile): number => {
  let score = 0;
  let maxScore = 0;

  // Industry match (20 points)
  if (icp.industry && icp.industry.length > 0) {
    maxScore += 20;
    if (icp.industry.includes(lead.industry)) {
      score += 20;
    }
  }

  // Company size match (20 points)
  if (icp.companySize && icp.companySize.length > 0) {
    maxScore += 20;
    if (icp.companySize.includes(lead.companySize)) {
      score += 20;
    }
  }

  // Location match (15 points)
  if (icp.location && icp.location.length > 0) {
    maxScore += 15;
    if (icp.location.some(loc => lead.location.toLowerCase().includes(loc.toLowerCase()))) {
      score += 15;
    }
  }

  // Job title match (25 points)
  if (icp.jobTitles && icp.jobTitles.length > 0) {
    maxScore += 25;
    if (icp.jobTitles.some(title => lead.title.toLowerCase().includes(title.toLowerCase()))) {
      score += 25;
    }
  }

  // Annual revenue match (10 points)
  if (icp.annualRevenue && lead.annualRevenue) {
    maxScore += 10;
    if (lead.annualRevenue === icp.annualRevenue) {
      score += 10;
    }
  }

  // Funding stage match (10 points)
  if (icp.fundingStage && icp.fundingStage.length > 0 && lead.fundingStage) {
    maxScore += 10;
    if (icp.fundingStage.includes(lead.fundingStage)) {
      score += 10;
    }
  }

  // Calculate percentage (0-100)
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
};
