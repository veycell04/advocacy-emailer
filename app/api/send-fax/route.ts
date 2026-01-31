import { NextResponse } from "next/server";

// 1. Get Credentials
const sinchProjectId = process.env.SINCH_PROJECT_ID;
const sinchApiKey = process.env.SINCH_API_KEY;
const sinchApiSecret = process.env.SINCH_API_SECRET;
// IMPORTANT: You must have a number purchased in your Sinch dashboard to send from.
const sinchFromNumber = process.env.SINCH_FROM_NUMBER; 

export async function POST(request: Request) {
  try {
    // 2. Validate Config
    if (!sinchProjectId || !sinchApiKey || !sinchApiSecret || !sinchFromNumber) {
      console.error("Missing Sinch configuration. Check .env variables.");
      return NextResponse.json(
        { error: "Server misconfiguration for faxing." },
        { status: 500 }
      );
    }

    // 3. Parse Request
    const body = await request.json();
    const { senators } = body; // We only really need the senators array

    if (!senators || !Array.isArray(senators) || senators.length === 0) {
      return NextResponse.json(
        { error: "Invalid data for sending faxes." },
        { status: 400 }
      );
    }

    // 4. Helper to create HTML string
    const createFaxHtml = (messageBody: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: 'Times New Roman', serif; font-size: 12pt; padding: 40px; line-height: 1.5;">
          <div style="white-space: pre-wrap;">${messageBody}</div>
        </body>
      </html>
    `;

    // 5. Loop through Senators and Send
    const sendPromises = senators.map(async (senator: any) => {
      
      // A. Generate HTML Content
      const htmlContent = createFaxHtml(senator.body);
      
      // B. Convert HTML string to Base64 (Standard Node.js approach)
      const base64File = Buffer.from(htmlContent, 'utf-8').toString('base64');

      // C. Construct the JSON Payload for Sinch
      // Reference: "SendFileAsFaxJson" in the API docs you provided
      const payload = {
        to: senator.fax,          // Ensure this is E.164 format (e.g. +12022241234)
        from: sinchFromNumber,    // Required field
        files: [
          {
            file: base64File,
            fileType: "HTML"      // Explicitly tell Sinch this is HTML content
          }
        ],
        headerPageNumbers: true,  // Adds "Page 1 of X" at the top
        imageConversionMethod: "HALFTONE"
      };

      // D. Send Request
      const response = await fetch(
        `https://fax.api.sinch.com/v3/projects/${sinchProjectId}/faxes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Basic Auth: base64(keyId:secret)
            Authorization: `Basic ${Buffer.from(`${sinchApiKey}:${sinchApiSecret}`).toString("base64")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      // E. Check Response
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Fax Failed for ${senator.name}:`, errorText);
        throw new Error(`Sinch Error: ${response.status} - ${errorText}`);
      }

      return response.json();
    });

    // 6. Wait for all faxes
    const results = await Promise.all(sendPromises);

    return NextResponse.json({
      success: true,
      faxIds: results.map((r: any) => r.id),
    });

  } catch (error: any) {
    console.error("Fax Sending Critical Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send faxes." },
      { status: 500 }
    );
  }
}