# MSG91 ko Chatwoot se WhatsApp ke liye integrate kaise karein

## Overview
MSG91 ka WhatsApp Business API campaigns, templates aur webhooks deta hai, lekin Chatwoot ke docs mein MSG91 ka direct built‑in connector nahi diya gaya; Chatwoot WhatsApp channel officially WhatsApp Cloud API aur Twilio jaise providers ko support karta hai, MSG91 ka naam yahan nahi aata. Iska matlab hai ki MSG91 ko Chatwoot ke "best inbox" ke tarah use karne ke liye ek custom bridge/middleware banana padega jo Chatwoot ke API channel aur MSG91 ke WhatsApp API + webhook ke beech mein kaam kare.[1][2][3][4][5][6]

## Architecture idea

1. **Chatwoot side (UI + Inbox):**
   - Chatwoot mein ek **API channel inbox** banaya jata hai jisme aap ek callback webhook URL dete ho; Chatwoot us URL par events (naye messages, conversations, etc.) POST karta hai.[7][4]
   - Chatwoot REST APIs se aap contacts, conversations aur messages create/update kar sakte ho, jisse koi bhi external system (yahan MSG91) ko connect karna possible ho jata hai.[3][8][9]

2. **MSG91 side (WhatsApp provider):**
   - MSG91 WhatsApp ke liye outbound APIs deta hai jaise `Send WhatsApp Template`, `Send Message (once Session Started)` etc., jinhe aap HTTPS POST ke through call kar sakte ho.[5][10][11]
   - MSG91 dashboard mein **Webhook (New)** ke under aap callback URL configure kar sakte ho jahan **inbound** (customer replies) aur **outbound** (delivery reports, events) ka JSON payload bheja jata hai; WhatsApp ke liye events `On Inbound Request Received`, `On Inbound Report Received`, `On Outbound Report Received` etc. diye gaye hain.[12][6]

3. **Middleware/Bridge service (aapka Node/Express ya Next.js server):**
   - **Endpoint 1 (MSG91 → Chatwoot):** MSG91 se aane wale WhatsApp inbound webhooks receive kare, payload se customerNumber + text nikaale, aur Chatwoot APIs ko call karke corresponding contact, conversation aur incoming message create kare.[6][9][13]
   - **Endpoint 2 (Chatwoot → MSG91):** Chatwoot API inbox ka callback webhook receive kare, agent ka outgoing reply text nikaale, aur MSG91 ke WhatsApp send API ko call karke actual WhatsApp number par message bheje.[4][8][5]

Is tarah aapko UI sirf Chatwoot ka milega, aur WhatsApp transport layer MSG91 handle karega.

## Step 1: Chatwoot mein API channel inbox banana

1. Chatwoot panel mein **Settings → Inboxes → Add Inbox** par jao.[7][4]
2. Channel list se **API** select karo; yeh woh generic channel hai jisse "any platform" ya custom use cases connect kiye ja sakte hain.[3][7]
3. Form mein:
   - **Name:** jaise `WhatsApp via MSG91`.  
   - **Callback URL:** aapke middleware ka public URL, jaise `https://yourdomain.com/chatwoot/webhook` (yahin Chatwoot outgoing/agent messages push karega).[4]
4. Inbox create karne ke baad **Add agents** screen aayegi; yahan apne support agents ko add karo taaki woh isi inbox se chat handle kar saken.[7]

Chatwoot docs clearly batate hain ki API channel ka setup basically ek inbox + callback URL hota hai, jisse baad mein aap REST API aur webhooks ke saath integrate kar sakte ho.[3][4]

### Chatwoot API token

1. Chatwoot profile page par jao, **Access Token** section se `api_access_token` generate karo; isi token ko aap API calls mein header `api_access_token: <api-key>` ke roop mein use karoge.[14][7]
2. Messages create karne ke liye Chatwoot ke developer docs example deta hai:

```bash
curl --request POST \
  --url https://app.chatwoot.com/api/v1/accounts/{account_id}/conversations/{conversation_id}/messages \
  --header 'Content-Type: application/json' \
  --header 'api_access_token: <api-key>' \
  --data '{
    "content": "Hello, how can I help you?",
    "message_type": "outgoing",
    "private": false
  }'
```

Yahi endpoint middleware se use kiya ja sakta hai agent ke reply ko conversation mein push karne ke liye ya MSG91 inbound ko `incoming` message ke roop mein create karne ke liye.[8][15]

## Step 2: MSG91 WhatsApp setup confirm karna

1. MSG91 docs ke hisaab se WhatsApp channel use karne ke liye aapko Meta side par WABA/number configure karna hota hai, phir MSG91 panel se WhatsApp API enable karni hoti hai.[16][17]
2. `docs.msg91.com/whatsapp` par WhatsApp ke multiple endpoints listed hain: `Send WhatsApp Template`, `Send Message (once Session Started)`, `Get Templates`, `To Fetch Whatsapp Number` etc., jo sab WhatsApp conversations ko handle karne ke liye use hote hain.[10][5]
3. Ek concrete example OTP/Template send ka help doc mein diya gaya hai jahan POST request `https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/` par bheji jati hai, headers mein `authkey` aur body mein `integrated_number`, `content_type: template` etc. pass kiya jata hai.[18]

Yehi pattern aapko Chatwoot → MSG91 outbound messages ke liye use karna hoga.

## Step 3: MSG91 Webhook (New) configure karna – inbound aur logs

MSG91 WhatsApp ke detailed webhook doc ke mutabik aap webhook ko New interface se configure kar sakte ho:

1. MSG91 dashboard par jao **WhatsApp → Webhook (New) → Create Webhook**.[6]
2. Webhook ko ek naam do, phir **Service: WhatsApp** select karo; uske baad **Event Type** select kar sakte ho:
   - **For Inbound:** `On Inbound Request Received`, `On Inbound Report Received` – yeh customer ke WhatsApp reply aate hi JSON payload aapke callback URL par post karte hain.
   - **For Outbound:** `On Outbound Report Received`, `On Delivered Event`, `On Failed Event` etc. jo delivery reports bhejte hain.[6]
3. **Step 3: Enter Your Webhook (Callback) URL** – yahan aap apne middleware ka endpoint daaloge, jaise `https://yourdomain.com/msg91/inbound`.[6]
4. Content type **JSON** hota hai, aur sample payload mein fields jaise `customerNumber`, `direction` (0 = inbound, 1 = outbound), `text`, `integratedNumber`, `templateName` etc. diye gaye hain.[6]

Purane "Webhook (old)" section ke doc mein bhi simpler steps diye hain: WhatsApp panel ke Webhook option mein inbound/outbound ke liye callback URL post karna, jisse inbound/outbound messages ka data aapke server ko milta hai.[12]

## Step 4: Middleware – MSG91 inbound ko Chatwoot conversation mein daalna

Ab ek chhota Node.js/Express (ya aapke stack ka) service banaana hoga jo do kaam kare.

### 4.1 Route: `/msg91/inbound` (MSG91 → Chatwoot)

1. MSG91 webhook se aata hua JSON payload parse karo; example fields:
   - `customerNumber` – customer ka WhatsApp number.
   - `direction` – 0 hone par inbound message.
   - `content` / `text` – actual message text (note: doc mein example diya hai ki inbound case mein `content` ke andar stringified JSON hota hai jisme `text` aata hai).[6]
2. **Chatwoot mein contact ensure karo:**
   - Chatwoot developer docs contact create endpoint dete hain: `POST /api/v1/accounts/{account_id}/contacts` jisme aap `phone_number` aur `inbox_id` (API channel inbox ka id) pass kar sakte ho.[19][7]
   - Response mein `id` aur `contact_inboxes` milte hain, jisse aapko ek stable `contact_identifier` mil jayega.[19][7]
3. **Conversation create/update:**
   - Agar customer ke liye koi open conversation nahi hai to `POST /public/api/v1/inboxes/{inbox_identifier}/contacts/{contact_identifier}/conversations` se naya conversation open kar sakte ho; Chatwoot docs iska example dete hain.[9]
   - Agar conversation exist karta hai to uska `conversation_id` reuse karo.
4. **Incoming message create karo:**
   - Conversation id milne ke baad messages API se ek `incoming` message create karo.

Example idea (Chatwoot docs ke format par based):

```bash
POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/messages
Header: api_access_token: <api-key>
Body: {
  "content": "ustomer message>",
  "message_type": "incoming",
  "private": false
}
```

Messages API ke example mein `message_type` `outgoing` dikhaya gaya hai, lekin available options mein `incoming` bhi allowed hai, jisse aap MSG91 se aaya hua text Chatwoot UI mein customer message ke roop mein dikha sakte ho.[15][8]

### 4.2 Number mapping

- MSG91 payload se jo `customerNumber` aata hai usi ko Chatwoot contact ke `phone_number` ya `identifier` mein store karo taaki baad mein Chatwoot → MSG91 direction mein isi key se mapping ho sake.[19][6]

## Step 5: Middleware – Chatwoot agent reply ko MSG91 se WhatsApp par bhejna

Ab doosra flow configure karna hai jahan Chatwoot se agent reply de, aur woh MSG91 ke through WhatsApp par chala jaye.

### 5.1 Chatwoot API channel callback handle karna

1. Jab aapne API channel inbox banate waqt callback URL diya tha, Chatwoot docs ke mutabik woh URL par har naye message ya event ki webhook request bhejega.[20][4]
2. Webhook payload mein at least conversation, message content aur contact ka info hota hai; aapko yahan se:
   - `message_type` check karna hai ki yeh agent ka `outgoing` message hai.
   - `content` nikaalna hai jo actual reply text hai.
   - Contact ke custom attributes ya `phone_number` se WhatsApp number nikaalna hai (yeh aapne Step 4 mein map kiya hoga).[8][7]

### 5.2 MSG91 WhatsApp API call

1. MSG91 WhatsApp docs ke hisaab se outbound messages ke liye aap `Send WhatsApp Template` ya `Send Message (once Session Started)` endpoints use kar sakte ho; ye sab `docs.msg91.com/whatsapp` mein listed hain.[5][10]
2. Ek concrete JSON example OTP doc mein diya gaya hai jahan WhatsApp message `https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/` par body ke andar `integrated_number`, `content_type`, aur template/object structure ke saath bheja jata hai.[18]
3. Agar aap simple text/session messages bhejna chahte ho (non‑template, within an active 24h session), to `Send Message (once Session Started)` endpoint ka use kar sakte ho jo WhatsApp section mein separately mention hai.[10][5]
4. Middleware ko Chatwoot webhook se aaya hua content dekh kar appropriate MSG91 API call fire karni hogi, sample pattern:

```bash
POST https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/
Headers:
  authkey: <MSG91_AUTHKEY>
  Content-Type: application/json
Body:
{
  "integrated_number": "<your_whatsapp_number>",
  "content_type": "session",          // ya "template" use case ke hisaab se
  "payload": {
    "to": ["ustomer_whatsapp_number>"],
    "text": "<agent reply from Chatwoot>"
  }
}
```

Exact fields aapko MSG91 ke WhatsApp API reference se align karne honge, lekin high‑level pattern docs mein clearly diya gaya hai ki outbound messages POST request ke through JSON body ke saath jate hain.[5][18][10]

## Limitations and gotchas

- **Direct "Msg91" provider option Chatwoot UI mein nahi hai:** WhatsApp channel docs explicitly sirf WhatsApp Cloud API/Twilio jaise providers describe karte hain, isliye MSG91 ko directly "WhatsApp provider" ke roop mein choose karna possible nahi hai; custom API integration hi raasta hai.[2][1][3]
- **Webhook reliability:** MSG91 Webhook (old) doc mention karta hai ki agar aapka webhook 5 seconds mein respond nahi karta to request drop ho sakti hai, aur events store nahi kiye jate; isliye middleware ko fast response (200 OK) dena zaroori hai.[12][6]
- **Payload formats:** MSG91 inbound payload mein kuch fields stringified JSON hote hain, aur Chatwoot APIs specific fields expect karte hain (`message_type`, `content`, etc.); proper parsing/validation likhna hoga.[8][6]
- **Template restrictions:** Agar aap marketing/OTP type template messages bhej rahe ho to WhatsApp template approval aur category (UTILITY, AUTHENTICATION, MARKETING) ka dhyan rakhna padega jo MSG91 docs mein describe hai.[17][5]

## High-level implementation checklist for a developer

1. **Chatwoot:**
   - API channel inbox create karo + callback webhook URL set karo.[4][7]
   - API access token generate karo aur safe jagah store karo.[14][7]
2. **MSG91:**
   - WhatsApp number + templates setup complete karo, `authkey` identify karo.[21][17][5]
   - Webhook (New) mein inbound + outbound events ke liye webhook URLs set karo (`/msg91/inbound`, optionally `/msg91/status`).[12][6]
3. **Middleware service:**
   - Route `/msg91/inbound`: MSG91 inbound JSON → Chatwoot contact + conversation + incoming message API calls.[9][19][8][6]
   - Route `/chatwoot/webhook`: Chatwoot outgoing webhook → MSG91 WhatsApp send API call.[4][5][8]
   - Number mapping layer maintain karo (WhatsApp number ↔ Chatwoot contact/inbox mapping).

Iss design se bina MSG91 UI open kiye, saare WhatsApp conversations Chatwoot ke single inbox mein aa sakte hain, jabki sending/receiving actual WhatsApp layer MSG91 handle karega, jo dono products ke official docs ke upar based hai.