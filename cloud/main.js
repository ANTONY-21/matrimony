/**
 * MatrimonyAI - Back4App Cloud Functions
 * AI-Powered Matchmaking with Groq/Llama 3.2
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY_HERE';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// AI Chat with RAG - Main matchmaking function
Parse.Cloud.define("aiChat", async (request) => {
  const { userId, message, sessionId } = request.params;
  
  try {
    // Get user profile and conversation history
    const userQuery = new Parse.Query(Parse.User);
    const user = await userQuery.get(userId, { useMasterKey: true });
    
    const profileQuery = new Parse.Query("UserProfile");
    profileQuery.equalTo("userId", user);
    const userProfile = await profileQuery.first({ useMasterKey: true });
    
    const conversationQuery = new Parse.Query("AIConversation");
    conversationQuery.equalTo("userId", user);
    let conversation = await conversationQuery.first({ useMasterKey: true });
    
    if (!conversation) {
      conversation = new Parse.Object("AIConversation");
      conversation.set("userId", user);
      conversation.set("messages", []);
      conversation.set("extractedPreferences", {});
      conversation.set("personalityInsights", {});
    }
    
    // Build context from previous messages
    const messages = conversation.get("messages") || [];
    const conversationHistory = messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Create system prompt for matrimony matchmaker
    const systemPrompt = `You are an expert AI matrimony matchmaker. Your role is to:
1. Understand the user's preferences through natural conversation
2. Ask relevant questions about their ideal life partner
3. Extract both explicit and implicit preferences
4. Provide thoughtful match recommendations
5. Be empathetic, culturally sensitive, and professional

Current user context:
${userProfile ? `
- Name: ${userProfile.get('fullName') || 'Unknown'}
- Age: ${userProfile.get('dateOfBirth') ? calculateAge(userProfile.get('dateOfBirth')) : 'Unknown'}
- Occupation: ${userProfile.get('occupation') || 'Not specified'}
- Location: ${userProfile.get('city') || 'Not specified'}
` : 'New user - profile not yet created'}

Guidelines:
- Ask open-ended questions to understand values and personality
- Be conversational and warm
- Gradually build a complete picture of preferences
- Suggest matches only when you have sufficient information
- Respect cultural and religious preferences`;

    // Call Groq API with Llama 3.2
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.2-90b-text-preview', // or 'llama-3.2-11b-text-preview' for faster responses
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Update conversation history
    messages.push({ role: 'user', content: message, timestamp: new Date() });
    messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });
    conversation.set("messages", messages);
    conversation.set("lastUpdated", new Date());
    
    // Extract preferences using NLP (simple version)
    const extractedPrefs = await extractPreferences(message, aiResponse, conversation);
    conversation.set("extractedPreferences", extractedPrefs);
    
    await conversation.save(null, { useMasterKey: true });
    
    // Update user's partner preferences based on conversation
    await updatePartnerPreferences(userId, extractedPrefs);
    
    return {
      success: true,
      message: aiResponse,
      conversationId: conversation.id,
      extractedPreferences: extractedPrefs
    };
    
  } catch (error) {
    console.error("AI Chat Error:", error);
    return {
      success: false,
      error: error.message,
      message: "I apologize, I'm having trouble connecting right now. Please try again."
    };
  }
});

// Helper function to extract preferences from conversation
async function extractPreferences(userMessage, aiResponse, conversation) {
  const existingPrefs = conversation.get("extractedPreferences") || {};
  const newPrefs = { ...existingPrefs };
  
  const message = userMessage.toLowerCase();
  
  // Age preferences
  if (message.match(/(\d+)\s*(?:to|-)?\s*(\d+)?\s*years?/)) {
    const ageMatch = message.match(/(\d+)\s*(?:to|-)?\s*(\d+)?\s*years?/);
    newPrefs.ageMin = parseInt(ageMatch[1]);
    newPrefs.ageMax = ageMatch[2] ? parseInt(ageMatch[2]) : parseInt(ageMatch[1]) + 5;
  }
  
  // Height preferences
  if (message.match(/(\d+)'(\d+)"|(\d+)\s*feet/)) {
    newPrefs.heightPreference = true;
  }
  
  // Location preferences
  const cities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'hyderabad', 'pune', 'kolkata', 'ahmedabad'];
  cities.forEach(city => {
    if (message.includes(city)) {
      newPrefs.cities = newPrefs.cities || [];
      if (!newPrefs.cities.includes(city)) {
        newPrefs.cities.push(city);
      }
    }
  });
  
  // Religion preferences
  const religions = ['hindu', 'muslim', 'christian', 'sikh', 'buddhist', 'jain'];
  religions.forEach(religion => {
    if (message.includes(religion)) {
      newPrefs.religion = newPrefs.religion || [];
      if (!newPrefs.religion.includes(religion)) {
        newPrefs.religion.push(religion);
      }
    }
  });
  
  // Profession preferences
  const professions = ['doctor', 'engineer', 'teacher', 'business', 'it', 'software', 'ca', 'lawyer'];
  professions.forEach(profession => {
    if (message.includes(profession)) {
      newPrefs.occupation = newPrefs.occupation || [];
      if (!newPrefs.occupation.includes(profession)) {
        newPrefs.occupation.push(profession);
      }
    }
  });
  
  // Personality traits
  const traits = ['family oriented', 'ambitious', 'traditional', 'modern', 'educated', 'caring', 'understanding'];
  traits.forEach(trait => {
    if (message.includes(trait)) {
      newPrefs.personalityTraits = newPrefs.personalityTraits || [];
      if (!newPrefs.personalityTraits.includes(trait)) {
        newPrefs.personalityTraits.push(trait);
      }
    }
  });
  
  return newPrefs;
}

// Update partner preferences in database
async function updatePartnerPreferences(userId, extractedPrefs) {
  const userQuery = new Parse.Query(Parse.User);
  const user = await userQuery.get(userId, { useMasterKey: true });
  
  const prefsQuery = new Parse.Query("PartnerPreferences");
  prefsQuery.equalTo("userId", user);
  let preferences = await prefsQuery.first({ useMasterKey: true });
  
  if (!preferences) {
    preferences = new Parse.Object("PartnerPreferences");
    preferences.set("userId", user);
  }
  
  // Update preferences
  if (extractedPrefs.ageMin) preferences.set("ageMin", extractedPrefs.ageMin);
  if (extractedPrefs.ageMax) preferences.set("ageMax", extractedPrefs.ageMax);
  if (extractedPrefs.cities) preferences.set("cities", extractedPrefs.cities);
  if (extractedPrefs.religion) preferences.set("religion", extractedPrefs.religion);
  if (extractedPrefs.occupation) preferences.set("occupation", extractedPrefs.occupation);
  
  await preferences.save(null, { useMasterKey: true });
}

// Calculate age from date of birth
function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// AI-Powered Matchmaking Algorithm
Parse.Cloud.define("findMatches", async (request) => {
  const { userId, limit = 10 } = request.params;
  
  try {
    const userQuery = new Parse.Query(Parse.User);
    const user = await userQuery.get(userId, { useMasterKey: true });
    
    // Get user profile
    const profileQuery = new Parse.Query("UserProfile");
    profileQuery.equalTo("userId", user);
    const userProfile = await profileQuery.first({ useMasterKey: true });
    
    if (!userProfile) {
      return { success: false, message: "Please complete your profile first" };
    }
    
    // Get user preferences
    const prefsQuery = new Parse.Query("PartnerPreferences");
    prefsQuery.equalTo("userId", user);
    const preferences = await prefsQuery.first({ useMasterKey: true });
    
    // Query potential matches
    const matchQuery = new Parse.Query("UserProfile");
    matchQuery.notEqualTo("userId", user);
    matchQuery.equalTo("isVerified", true);
    
    // Apply filters based on preferences
    if (preferences) {
      const userAge = calculateAge(userProfile.get('dateOfBirth'));
      const userGender = userProfile.get('gender');
      
      // Gender filter (opposite gender for straight matches)
      matchQuery.notEqualTo("gender", userGender);
      
      // Age filter
      if (preferences.get('ageMin') && preferences.get('ageMax')) {
        const today = new Date();
        const maxDate = new Date(today.getFullYear() - preferences.get('ageMin'), today.getMonth(), today.getDate());
        const minDate = new Date(today.getFullYear() - preferences.get('ageMax'), today.getMonth(), today.getDate());
        matchQuery.lessThan("dateOfBirth", maxDate);
        matchQuery.greaterThan("dateOfBirth", minDate);
      }
      
      // Religion filter
      if (preferences.get('religion') && preferences.get('religion').length > 0) {
        matchQuery.containedIn("religion", preferences.get('religion'));
      }
      
      // Location filter
      if (preferences.get('cities') && preferences.get('cities').length > 0) {
        matchQuery.containedIn("city", preferences.get('cities'));
      }
    }
    
    matchQuery.limit(limit * 2); // Get more to calculate scores
    const potentialMatches = await matchQuery.find({ useMasterKey: true });
    
    // Calculate compatibility scores
    const scoredMatches = potentialMatches.map(match => {
      const score = calculateCompatibilityScore(userProfile, match, preferences);
      return {
        profile: match,
        score: score.total,
        reasons: score.reasons
      };
    });
    
    // Sort by score and return top matches
    scoredMatches.sort((a, b) => b.score - a.score);
    const topMatches = scoredMatches.slice(0, limit);
    
    // Save matches to database
    for (const match of topMatches) {
      const matchObj = new Parse.Object("Matches");
      matchObj.set("userId", user);
      matchObj.set("matchedUserId", match.profile.get('userId'));
      matchObj.set("compatibilityScore", match.score);
      matchObj.set("matchingReasons", match.reasons);
      matchObj.set("status", "suggested");
      matchObj.set("lastInteraction", new Date());
      await matchObj.save(null, { useMasterKey: true });
    }
    
    return {
      success: true,
      matches: topMatches.map(m => ({
        profileId: m.profile.id,
        userId: m.profile.get('userId').id,
        name: m.profile.get('fullName'),
        age: calculateAge(m.profile.get('dateOfBirth')),
        occupation: m.profile.get('occupation'),
        city: m.profile.get('city'),
        religion: m.profile.get('religion'),
        education: m.profile.get('education'),
        photo: m.profile.get('profilePhoto')?.url(),
        compatibilityScore: Math.round(m.score),
        matchReasons: m.reasons
      }))
    };
    
  } catch (error) {
    console.error("Find Matches Error:", error);
    return { success: false, error: error.message };
  }
});

// Calculate compatibility score between two profiles
function calculateCompatibilityScore(userProfile, matchProfile, preferences) {
  let totalScore = 0;
  const reasons = [];
  
  // Age compatibility (20 points)
  const userAge = calculateAge(userProfile.get('dateOfBirth'));
  const matchAge = calculateAge(matchProfile.get('dateOfBirth'));
  const ageDiff = Math.abs(userAge - matchAge);
  if (ageDiff <= 2) {
    totalScore += 20;
    reasons.push("Similar age");
  } else if (ageDiff <= 5) {
    totalScore += 15;
    reasons.push("Compatible age");
  } else if (ageDiff <= 8) {
    totalScore += 10;
  }
  
  // Religion compatibility (20 points)
  if (userProfile.get('religion') === matchProfile.get('religion')) {
    totalScore += 20;
    reasons.push("Same religion");
  }
  
  // Education level (15 points)
  const educationLevels = ['High School', 'Bachelor', 'Master', 'PhD'];
  const userEduLevel = educationLevels.indexOf(userProfile.get('education')) || 1;
  const matchEduLevel = educationLevels.indexOf(matchProfile.get('education')) || 1;
  if (Math.abs(userEduLevel - matchEduLevel) <= 1) {
    totalScore += 15;
    reasons.push("Similar education");
  } else if (Math.abs(userEduLevel - matchEduLevel) <= 2) {
    totalScore += 10;
  }
  
  // Location compatibility (15 points)
  if (userProfile.get('city') === matchProfile.get('city')) {
    totalScore += 15;
    reasons.push("Same city");
  } else if (userProfile.get('state') === matchProfile.get('state')) {
    totalScore += 10;
    reasons.push("Same state");
  } else if (userProfile.get('country') === matchProfile.get('country')) {
    totalScore += 5;
  }
  
  // Professional compatibility (15 points)
  const professionalFields = {
    'IT': ['Software Engineer', 'Data Scientist', 'Developer'],
    'Medical': ['Doctor', 'Nurse', 'Pharmacist'],
    'Education': ['Teacher', 'Professor', 'Tutor'],
    'Business': ['Manager', 'Consultant', 'Entrepreneur']
  };
  
  let userField = '';
  let matchField = '';
  for (const [field, occupations] of Object.entries(professionalFields)) {
    if (occupations.some(occ => userProfile.get('occupation')?.includes(occ))) userField = field;
    if (occupations.some(occ => matchProfile.get('occupation')?.includes(occ))) matchField = field;
  }
  
  if (userField && userField === matchField) {
    totalScore += 15;
    reasons.push("Similar profession");
  }
  
  // Lifestyle compatibility (15 points)
  if (userProfile.get('eatingHabits') === matchProfile.get('eatingHabits')) {
    totalScore += 5;
  }
  if (userProfile.get('drinkingHabits') === matchProfile.get('drinkingHabits')) {
    totalScore += 5;
  }
  if (userProfile.get('smokingHabits') === matchProfile.get('smokingHabits')) {
    totalScore += 5;
  }
  
  if (totalScore >= 70) {
    reasons.push("Highly compatible");
  } else if (totalScore >= 50) {
    reasons.push("Good match");
  }
  
  return { total: totalScore, reasons };
}

// User Registration with OTP
Parse.Cloud.define("sendOTP", async (request) => {
  const { phone, type = 'registration' } = request.params;
  
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Save OTP to database (expires in 10 minutes)
  const OTPObject = Parse.Object.extend("OTPVerification");
  const otpRecord = new OTPObject();
  otpRecord.set("phone", phone);
  otpRecord.set("otp", otp);
  otpRecord.set("type", type);
  otpRecord.set("expiresAt", new Date(Date.now() + 10 * 60 * 1000));
  otpRecord.set("verified", false);
  await otpRecord.save(null, { useMasterKey: true });
  
  // In production, integrate with SMS gateway (Twilio, MSG91, etc.)
  console.log(`OTP for ${phone}: ${otp}`);
  
  return {
    success: true,
    message: "OTP sent successfully",
    // Remove this in production
    otp: process.env.NODE_ENV === 'development' ? otp : undefined
  };
});

// Verify OTP
Parse.Cloud.define("verifyOTP", async (request) => {
  const { phone, otp } = request.params;
  
  const query = new Parse.Query("OTPVerification");
  query.equalTo("phone", phone);
  query.equalTo("otp", otp);
  query.equalTo("verified", false);
  query.greaterThan("expiresAt", new Date());
  
  const otpRecord = await query.first({ useMasterKey: true });
  
  if (otpRecord) {
    otpRecord.set("verified", true);
    await otpRecord.save(null, { useMasterKey: true });
    
    return { success: true, message: "OTP verified successfully" };
  }
  
  return { success: false, message: "Invalid or expired OTP" };
});

// Save user activity for behavioral analysis
Parse.Cloud.define("trackActivity", async (request) => {
  const { userId, activityType, targetUserId, metadata } = request.params;
  
  const userQuery = new Parse.Query(Parse.User);
  const user = await userQuery.get(userId, { useMasterKey: true });
  
  const activity = new Parse.Object("UserActivity");
  activity.set("userId", user);
  activity.set("activityType", activityType);
  
  if (targetUserId) {
    const targetQuery = new Parse.Query(Parse.User);
    const target = await targetQuery.get(targetUserId, { useMasterKey: true });
    activity.set("targetUserId", target);
  }
  
  activity.set("metadata", metadata || {});
  activity.set("timestamp", new Date());
  
  await activity.save(null, { useMasterKey: true });
  
  return { success: true };
});

console.log("MatrimonyAI Cloud Functions loaded successfully!");
