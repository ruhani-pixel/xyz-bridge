nbyv folg iojz zlwi

PRD v2.0 — XYZ Bridge: AI-Powered Multi-User WhatsApp Communication Platform
Executive Summary
Transform XYZ Bridge from a single-tenant MSG91↔Chatwoot bridge into a multi-user AI-powered WhatsApp communication platform. Each user gets their own private chat workspace — like Chatwoot, but built directly into the panel — with per-contact AI toggle, LLM API key management, and a full agent-chat interface.

1. THE BIG PICTURE: Two Modes of Operation
When a new user signs up → gets Pending → Superadmin Approves → User goes through Onboarding where they choose:

┌─────────────────────────────────────────────────────────┐
│                    ONBOARDING FLOW                       │
│                                                         │
│    "Aap XYZ Bridge kaise use karna chahte hain?"        │
│                                                         │
│    ┌──────────────────┐    ┌──────────────────────┐     │
│    │  🔗 BUILD BRIDGE │    │  💬 USE OUR SYSTEM   │     │
│    │                  │    │                      │     │
│    │  "Me apna MSG91  │    │  "Mujhe full chat    │     │
│    │   + Chatwoot     │    │   workspace chahiye  │     │
│    │   connect karna  │    │   AI ke saath, bina  │     │
│    │   hai"           │    │   Chatwoot ke"       │     │
│    └──────────────────┘    └──────────────────────┘     │
└─────────────────────────────────────────────────────────┘
Mode A: BUILD BRIDGE (Current System)
Existing flow: MSG91 → XYZ → Chatwoot → Agent Reply → MSG91 → User
User provides own MSG91 keys + Chatwoot keys
Dashboard shows analytics, logs, conversations as-is
Already built ✅
Mode B: USE OUR SYSTEM (NEW — The Big Feature)
User provides own MSG91 keys (they still need MSG91 for WhatsApp)
User provides own AI LLM API Key (OpenAI or Google Gemini)
No Chatwoot needed — our panel IS the agent interface
Full WhatsApp-like chat workspace built into the dashboard
Per-contact AI ON/OFF toggle
Agent can manually chat too when AI is OFF
2. COMPLETE MESSAGE FLOW (Mode B: Use Our System)
User → WhatsApp → MSG91
         ↓ (webhook hits XYZ Bridge)
    ┌─────────────────────────────────────────────┐
    │            XYZ BRIDGE PROCESSOR              │
    │                                             │
    │  1. Identify which tenant/user owns this    │
    │     MSG91 number                            │
    │  2. Save message to Firestore               │
    │  3. Check: Is AI ON for this contact?       │
    │                                             │
    │     ┌─────────────┐    ┌─────────────────┐  │
    │     │  AI ON  ✅  │    │  AI OFF  ❌     │  │
    │     │             │    │                 │  │
    │     │ Call OpenAI │    │ Show message in │  │
    │     │ or Gemini   │    │ agent's chat    │  │
    │     │ API with    │    │ panel. Wait for │  │
    │     │ user's key  │    │ manual reply.   │  │
    │     │             │    │                 │  │
    │     │ Auto-reply  │    │ Agent types →   │  │
    │     │ via MSG91   │    │ Send via MSG91  │  │
    │     └─────────────┘    └─────────────────┘  │
    └─────────────────────────────────────────────┘
         ↓
    MSG91 → User gets WhatsApp reply
3. MULTI-TENANT ARCHITECTURE
3.1 User Registration & Approval Flow
1. User visits xyz-bridge.vercel.app → Login page
2. Signs in with Google → Firebase Auth creates user
3. Firestore: users/{uid} created with:
   - isApproved: false
   - role: "user"           ← NEW ROLE
   - accountType: null      ← Not yet chosen
   - onboardingComplete: false
4. User sees: "Pending Approval" screen
5. Superadmin panel → Approves user (isApproved: true)
6. Real-time sync → User's screen instantly changes
7. User redirected to → ONBOARDING FLOW
8. User selects Mode A or Mode B
9. Mode B selected → Setup wizard:
   - Enter MSG91 Auth Key + Integrated Number
   - Enter OpenAI / Gemini API Key
   - Select default AI model
   - Done → Chat Workspace opens
3.2 Updated Firestore: users Collection
users/{firebaseUID}
{
  // -- Identity --
  uid: string,
  email: string,
  name: string,
  photoURL: string,
  
  // -- Access Control --
  role: 'user' | 'agent' | 'admin' | 'superadmin',
  isApproved: boolean,
  
  // -- Onboarding --
  accountType: 'bridge' | 'platform' | null,
  onboardingComplete: boolean,
  
  // -- MSG91 Config (per-user, encrypted at rest) --
  msg91_authkey: string (encrypted),
  msg91_integrated_number: string,
  
  // -- Chatwoot Config (only for bridge mode) --
  chatwoot_base_url: string,
  chatwoot_api_token: string (encrypted),
  chatwoot_account_id: string,
  chatwoot_inbox_id: string,
  
  // -- AI Config (only for platform mode) --
  ai_provider: 'openai' | 'google',     // Only these two allowed
  ai_api_key: string (encrypted),
  ai_model: string,                      // e.g. 'gpt-4o', 'gpt-3.5-turbo', 'gemini-2.5-flash'
  ai_system_prompt: string,              // Custom system prompt
  ai_default_enabled: boolean,           // New contacts → AI auto ON?
  ai_max_tokens: number,                 // Token limit per response
  ai_temperature: number,               // 0-1 creativity slider
  
  // -- Timestamps --
  createdAt: Timestamp,
  lastLoginAt: Timestamp
}
3.3 New Firestore: contacts Collection (Multi-tenant)
contacts/{autoId}
{
  ownerId: string,                  // Firebase UID of the tenant
  phoneNumber: string,
  name: string,
  
  // -- AI Settings (PER CONTACT) --
  aiEnabled: boolean,               // 🔥 KEY FEATURE: AI ON/OFF per contact
  
  // -- Conversation Data --
  lastMessage: string,
  lastMessageAt: Timestamp,
  totalMessages: number,
  unreadCount: number,
  status: 'active' | 'archived' | 'blocked',
  
  // -- Bridge-mode specific --
  chatwootContactId: number | null,
  chatwootConversationId: number | null,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
3.4 New Firestore: chat_messages Collection
chat_messages/{autoId}
{
  ownerId: string,                  // tenant UID
  contactPhone: string,             // WhatsApp user's number
  direction: 'inbound' | 'outbound',
  sender: 'user' | 'agent' | 'ai', // Who sent this message
  content: string,
  contentType: 'text' | 'image' | 'document',
  aiModel: string | null,           // If AI replied, which model
  status: 'sent' | 'delivered' | 'failed' | 'read',
  timestamp: Timestamp,
  createdAt: Timestamp
}
4. NEW PAGES & COMPONENTS
4.1 Onboarding Page (NEW)
Path: app/onboarding/page.tsx

┌──────────────────────────────────────────────────────┐
│                                                      │
│              🎯 Welcome to XYZ Bridge                │
│                                                      │
│   Choose how you want to use the platform:           │
│                                                      │
│   ┌────────────────────┐  ┌────────────────────────┐ │
│   │   🔗 Bridge Mode   │  │   💬 Platform Mode     │ │
│   │                    │  │                        │ │
│   │ Connect your own   │  │ Get a full WhatsApp    │ │
│   │ MSG91 & Chatwoot   │  │ chat workspace with    │ │
│   │ for a custom       │  │ AI auto-reply built    │ │
│   │ bridge setup.      │  │ right into this panel. │ │
│   │                    │  │                        │ │
│   │   [Select]         │  │   [Select]             │ │
│   └────────────────────┘  └────────────────────────┘ │
│                                                      │
│   Next: Configure your MSG91 + AI keys               │
│                                                      │
└──────────────────────────────────────────────────────┘
4.2 Setup Wizard (NEW)
Path: app/onboarding/setup/page.tsx

Multi-step form:

Step 1: Enter MSG91 Auth Key + Integrated Number
Step 2 (Platform mode only): Choose AI Provider → Enter API Key
Step 3 (Platform mode only): Select Model + Set System Prompt
Step 4: Confirm + Launch
4.3 Chat Workspace (NEW — THE MAIN FEATURE)
Path: app/(dashboard)/inbox/page.tsx

┌─────────────────────────────────────────────────────────────────┐
│  🔍 Search contacts...                    [AI: All ON] [Filter]│
├──────────────────┬──────────────────────────────────────────────┤
│                  │                                              │
│  CONTACTS LIST   │  CHAT WINDOW                                 │
│                  │                                              │
│ ┌──────────────┐ │  ┌──────────────────────────────────────┐   │
│ │ 📱 Rahul S.  │ │  │  Rahul Sharma  +919876543210         │   │
│ │ "Help chahiye│ │  │  🤖 AI: ON  [Toggle]                 │   │
│ │ 2 min ago    │ │  │──────────────────────────────────────│   │
│ │ 🤖 AI ON    │ │  │                                      │   │
│ └──────────────┘ │  │  ← Hello, mujhe help chahiye         │   │
│ ┌──────────────┐ │  │                                      │   │
│ │ 📱 Priya M.  │ │  │       AI: Haan bilkul, kaise →      │   │
│ │ "Thanks"     │ │  │       help kar sakta hoon?            │   │
│ │ 5 min ago    │ │  │                                      │   │
│ │ ❌ AI OFF   │ │  │  ← Pricing batao                     │   │
│ └──────────────┘ │  │                                      │   │
│ ┌──────────────┐ │  │       AI: Humare plans              →│   │
│ │ 📱 Amit K.   │ │  │       Rs 499, Rs 999...              │   │
│ │ "Order kab"  │ │  │                                      │   │
│ │ 10 min ago   │ │  │──────────────────────────────────────│   │
│ │ 🤖 AI ON    │ │  │  [ Type a message...        ] [Send] │   │
│ └──────────────┘ │  │  [📎 Attach] [🤖 Let AI Reply]       │   │
│                  │  └──────────────────────────────────────┘   │
│ [+ New Chat]     │                                              │
├──────────────────┴──────────────────────────────────────────────┤
│  Contact Details Sidebar (expandable →)                         │
│  Name, Phone, AI Status, Total Messages, Created, Block btn     │
└─────────────────────────────────────────────────────────────────┘
4.4 AI Settings Panel (NEW)
Path: app/(dashboard)/ai-config/page.tsx

┌──────────────────────────────────────────────────────────┐
│  🤖 AI CONFIGURATION                                     │
│                                                          │
│  Provider:  [OpenAI ▼]     Model: [gpt-4o ▼]            │
│                                                          │
│  API Key:   [••••••••••••••••]  [Test Connection]        │
│                                                          │
│  System Prompt:                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ You are a helpful customer support agent for      │   │
│  │ RD Models. You help customers with product        │   │
│  │ inquiries, pricing, and order status...           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Temperature: ──●────── 0.7                              │
│  Max Tokens:  [1000]                                     │
│  Default AI for new contacts: [ON ✅]                    │
│                                                          │
│  ⚡ BULK AI CONTROLS                                     │
│  [Turn AI ON for ALL contacts]                           │
│  [Turn AI OFF for ALL contacts]                          │
│                                                          │
│  [SAVE CONFIGURATION]                                    │
└──────────────────────────────────────────────────────────┘
5. API ROUTES (NEW + MODIFIED)
5.1 Modified: POST /api/msg91-webhook
Critical change: Must now identify which tenant owns the MSG91 number.

Request comes in →
  1. Extract integratedNumber from payload
  2. Query Firestore: users where msg91_integrated_number == integratedNumber
  3. Get the tenant (ownerId)
  4. Check tenant's accountType:
     - "bridge" → existing flow (forward to Chatwoot)
     - "platform" → new flow:
       a. Save message to chat_messages
       b. Update contact unreadCount
       c. Check: contact.aiEnabled?
          YES → Call AI API → Get reply → Send via MSG91 → Save AI reply
          NO  → Just save. Agent will see in real-time panel.
5.2 New: POST /api/ai/generate
Internal API for AI reply generation.

typescript
// Input
{
  ownerId: string,         // tenant
  contactPhone: string,    // for conversation history
  userMessage: string,     // latest message
}
// Logic
1. Get user's AI config from Firestore (provider, key, model, prompt)
2. Get last 10 messages for this contact (context window)
3. Build messages array with system prompt + history + new message
4. Call OpenAI or Gemini API
5. Return AI response text
// Output
{ reply: "AI generated response text" }
5.3 New: POST /api/chat/send
Agent sends manual reply from the panel.

typescript
// Input
{
  ownerId: string,
  contactPhone: string,
  content: string,
}
// Logic
1. Get tenant's MSG91 config
2. Send message via MSG91 API
3. Save to chat_messages (sender: 'agent')
4. Update contact.lastMessage
5.4 New: PATCH /api/contacts/:id/ai-toggle
Toggle AI ON/OFF for a specific contact.

5.5 New: POST /api/contacts/bulk-ai
Bulk AI toggle — turn AI on/off for all contacts or selective contacts.

6. SUPPORTED AI PROVIDERS
IMPORTANT

Only two AI providers are allowed. Users cannot bring any other LLM.

Provider	Models Available	API Format
OpenAI	gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo	Chat Completions API
Google	gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash	Generative AI API
AI Call Logic
typescript
async function generateAIReply(config, history, newMessage) {
  if (config.ai_provider === 'openai') {
    // Call OpenAI Chat Completions
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      headers: { Authorization: `Bearer ${config.ai_api_key}` },
      body: JSON.stringify({
        model: config.ai_model,
        messages: [
          { role: 'system', content: config.ai_system_prompt },
          ...history,
          { role: 'user', content: newMessage }
        ],
        max_tokens: config.ai_max_tokens,
        temperature: config.ai_temperature,
      })
    });
  } else if (config.ai_provider === 'google') {
    // Call Google Generative AI
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.ai_model}:generateContent?key=${config.ai_api_key}`, {
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: config.ai_system_prompt }] },
        contents: [...history, { role: 'user', parts: [{ text: newMessage }] }],
        generationConfig: {
          maxOutputTokens: config.ai_max_tokens,
          temperature: config.ai_temperature,
        }
      })
    });
  }
}
7. REAL-TIME ARCHITECTURE
Chat workspace uses Firebase real-time listeners:
useEffect(() => {
  // Listen to contacts list (sorted by lastMessageAt)
  const unsubContacts = onSnapshot(
    query(
      collection(db, 'contacts'),
      where('ownerId', '==', currentUser.uid),
      orderBy('lastMessageAt', 'desc')
    ),
    (snapshot) => setContacts(snapshot.docs)
  );
  // Listen to messages for selected contact
  const unsubMessages = onSnapshot(
    query(
      collection(db, 'chat_messages'),
      where('ownerId', '==', currentUser.uid),
      where('contactPhone', '==', selectedContact),
      orderBy('timestamp', 'asc')
    ),
    (snapshot) => setMessages(snapshot.docs)
  );
}, [selectedContact]);
8. SECURITY CONSIDERATIONS
CAUTION

API Keys Storage: User API keys (MSG91, OpenAI, Gemini) are sensitive. They must be:

Stored encrypted in Firestore (use AES-256 encryption)
Never exposed to the client-side
Only decrypted server-side in API route handlers
API calls to OpenAI/Gemini happen ONLY on server-side
Route Protection Matrix
Route	Who Can Access
/login	Everyone
/not-authorized	Unapproved users
/onboarding	Approved but not onboarded
/dashboard	All approved + onboarded
/inbox (chat)	Platform mode users only
/ai-config	Platform mode users only
/settings	Superadmin only
9. UPDATED SIDEBAR NAVIGATION
BRIDGE MODE users see:          PLATFORM MODE users see:
├── Dashboard                   ├── Dashboard  
├── Conversations               ├── 💬 Inbox (Chat Workspace) ← NEW
├── Messages Log                ├── 🤖 AI Config ← NEW
├── Analytics                   ├── Messages Log
├── System Logs (admin+)        ├── Analytics
├── Settings (superadmin)       ├── System Logs (admin+)
                                ├── Settings (superadmin)
10. IMPLEMENTATION PHASES
IMPORTANT

This is a massive feature. Recommended implementation order:

Phase 1: Multi-User Foundation
Updated users collection with accountType, onboardingComplete
Onboarding page + Setup wizard
Per-user MSG91 key storage
Multi-tenant webhook routing
Phase 2: Chat Workspace (Inbox)
Contact list sidebar with search
Chat window with real-time messages
Manual agent reply from panel
Contact detail sidebar
Phase 3: AI Integration
AI config page (key, model, prompt settings)
Per-contact AI toggle
OpenAI integration
Google Gemini integration
AI auto-reply in webhook flow
Phase 4: Advanced Controls
Bulk AI toggle (all ON, all OFF, selective)
Contact blocking
Chat export
AI conversation analytics
11. FEASIBILITY ANALYSIS
Feature	Feasibility	Notes
Multi-user auth + onboarding	✅ Easy	Firebase Auth already set up
Per-user MSG91 keys	✅ Easy	Store in Firestore, decrypt server-side
Multi-tenant webhook routing	⚠️ Medium	Need to match integratedNumber → user
Chat Workspace (Inbox)	⚠️ Medium	New UI, but Firebase real-time makes it smooth
AI Integration (OpenAI)	✅ Easy	Standard Chat Completions API
AI Integration (Gemini)	✅ Easy	Standard Generative AI API
Per-contact AI toggle	✅ Easy	Boolean field on contact doc
Bulk AI toggle	✅ Easy	Firestore batch update
Encrypted key storage	⚠️ Medium	Need AES encryption lib
Real-time chat sync	✅ Easy	Firebase onSnapshot already used
Vercel serverless for AI	⚠️ Care needed	10s timeout — AI responses under 8s
Firebase Free Tier Impact
Each AI conversation = 2 reads (user config + contact) + 2 writes (message + contact update)
With 20K writes/day → supports ~5,000 AI conversations per day on free tier
Can upgrade to Blaze plan (pay-as-you-go) for unlimited
12. OPEN QUESTIONS FOR USER
WARNING

Need your input on these before I start building:

MSG91 Number Sharing: Should multiple platform-mode users be able to share the same MSG91 integrated number, or does each user need their own number?

AI History Window: How many past messages should be sent to AI as context? (More = better replies, but higher API cost). Suggested: Last 10 messages.

AI Response Time: If AI takes more than 5-6 seconds to respond, MSG91 webhook might timeout. Should we:

(a) Respond to webhook immediately, process AI async, then send reply separately?
(b) Accept the risk of slow models?
Encryption Key Management: For encrypting user API keys, where should we store the master encryption key? Options:

(a) Vercel environment variable (simple)
(b) Google Cloud KMS (more secure, but complex)
Next Step: Once you approve this PRD, I'll start building Phase 1 (Multi-User Foundation + Onboarding). Bata do bhai! 🚀