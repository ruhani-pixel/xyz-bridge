/**
 * Professional MSG91 API Service
 * Handles real-world WhatsApp outbound messages, credential verification, and template management.
 */

// Primary API Base URL for MSG91 WhatsApp Services
const BASE_URL = 'https://control.msg91.com/api/v5/whatsapp';

/**
 * Sends a free-form session message (Service Message).
 * Only works within the 24-hour window from the last customer message.
 */
export async function sendMSG91Reply(phoneNumber: string, content: string, config: any) {
  const url = `${BASE_URL}/outbound/bulk/`;
  
  const payload = {
    integrated_number: config.msg91_integrated_number,
    content_type: 'text',
    payload: {
      messaging_product: 'whatsapp',
      type: 'text',
      to: phoneNumber,
      text: {
        body: content,
      },
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: config.msg91_authkey || '',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`MSG91 API error: ${errorData}`);
  }

  return await response.json();
}

/**
 * Sends a pre-approved template message to initiate or re-open a session.
 * Essential for messaging customers outside the 24-hour window.
 */
export async function sendMSG91Template(phoneNumber: string, templateName: string, config: any, variables: string[] = []) {
  const url = `${BASE_URL}/outbound/bulk/`;

  const payload = {
    integrated_number: config.msg91_integrated_number,
    content_type: 'template',
    payload: {
      messaging_product: 'whatsapp',
      type: 'template',
      to: phoneNumber,
      template: {
        name: templateName,
        language: { code: 'en' }, // Default to English, can be dynamic if needed
        components: variables.length > 0 ? [{
          type: 'body',
          parameters: variables.map(v => ({ type: 'text', text: v }))
        }] : []
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: config.msg91_authkey || '',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`MSG91 Template Error: ${errorData}`);
  }

  return await response.json();
}

/**
 * Fetches all Meta-approved templates linked to the integrated number.
 */
export async function getMSG91Templates(integratedNumber: string, authkey: string) {
  const url = `https://control.msg91.com/api/v5/whatsapp/get-templates/${integratedNumber}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      authkey: authkey,
    },
  });

  if (!response.ok) {
     const error = await response.text();
     throw new Error(`Failed to fetch templates: ${error}`);
  }

  return await response.json();
}

/**
 * Verifies if the MSG91 AuthKey is valid by fetching the prepaid balance.
 */
export async function verifyMSG91(authkey: string) {
  const url = 'https://control.msg91.com/api/v5/subscriptions/fetchPrepaidBalance';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'Authkey': authkey,
      },
      body: JSON.stringify({
        service: 'whatsapp'
      })
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, balance: data.balance || 0 };
    }
    
    // Attempt to parse error JSON or text
    let errorText = '';
    try {
      const errJson = await response.json();
      errorText = JSON.stringify(errJson);
    } catch {
      errorText = await response.text();
    }
    
    return { success: false, error: errorText };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
