import { NextResponse } from "next/server";

// Ensure these are set in your .env.local
const sinchProjectId = process.env.SINCH_PROJECT_ID;
const sinchApiKey = process.env.SINCH_API_KEY;
const sinchApiSecret = process.env.SINCH_API_SECRET;
// You need a 'From' number purchased in your Sinch dashboard
const sinchFromNumber = process.env.SINCH_FROM_NUMBER || "+12064743870"; 

export async function POST(request: Request) {
  try {
    if (!sinchProjectId || !sinchApiKey || !sinchApiSecret) {
      console.error("Missing Sinch Credentials");
      return NextResponse.json(
        { error: "Server misconfiguration for faxing." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { user, senators } = body;

    if (!senators || !Array.isArray(senators) || senators.length === 0) {
      return NextResponse.json(
        { error: "Invalid data for sending faxes." },
        { status: 400 }
      );
    }

    // Helper to format HTML content
    const createFaxHtml = (senatorName: string, messageBody: string) => `
      <html>
        <body style="font-family: 'Times New Roman', serif; font-size: 12pt; padding: 40px;">
          <p>${messageBody.replace(/\n/g, "<br>")}</p>
        </body>
      </html>
    `;

    const sendPromises = senators.map(async (senator: any) => {
      // 1. Prepare Content
      const htmlContent = createFaxHtml(senator.name, senator.body);
      
      // 2. Create Blob (Node.js compatible file)
      const blob = new Blob([htmlContent], { type: 'text/html' });

      // 3. Construct FormData
      const formData = new FormData();
      formData.append("to", senator.fax);
      formData.append("from", sinchFromNumber); // Sinch requires a 'from' number you own
      formData.append("file", blob, "letter.html"); // Filename is important

      // 4. Send to Sinch
      const authHeader = 'Basic ' + Buffer.from(`${sinchApiKey}:${sinchApiSecret}`).toString('base64');
      
      const response = await fetch(
        `https://fax.api.sinch.com/v3/projects/${sinchProjectId}/faxes`,
        {
          method: "POST",
          headers: {
            Authorization: authHeader,
            // Do NOT set 'Content-Type': 'multipart/form-data' manually here.
            // Fetch sets it automatically with the correct boundary when you pass FormData.
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Fax Failed for ${senator.name}:`, errorText);
        throw new Error(`Sinch API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    });

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