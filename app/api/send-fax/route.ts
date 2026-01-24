import { NextResponse } from "next/server";

const sinchProjectId = process.env.SINCH_PROJECT_ID;
const sinchApiKey = process.env.SINCH_API_KEY;
const sinchApiSecret = process.env.SINCH_API_SECRET;

export async function POST(request: Request) {
  try {
    if (!sinchProjectId || !sinchApiKey || !sinchApiSecret) {
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

    const createFaxHtml = (senatorName: string, messageBody: string) => `
      <html>
        <body style="font-family: Times New Roman; font-size: 12pt;">
          <p>${messageBody.replace(/\n/g, "<br>")}</p>
        </body>
      </html>
    `;

    // ✅ senators exists HERE
    const sendPromises = senators.map(async (senator: any) => {
      const html = createFaxHtml(senator.name, senator.body);

      const file = new File(
        [html],
        `fax-${senator.name.replace(/\s+/g, "-")}.html`,
        { type: "text/html" }
      );

      const formData = new FormData();
      formData.append("to", senator.fax);
      formData.append("file", file);

      const response = await fetch(
        `https://fax.api.sinch.com/v3/projects/${sinchProjectId}/faxes`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer
              .from(`${sinchApiKey}:${sinchApiSecret}`)
              .toString("base64")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Fax failed");
      }

      return response.json();
    });

    const results = await Promise.all(sendPromises);

    return NextResponse.json({
      success: true,
      faxIds: results.map((r) => r.id),
    });

  } catch (error: any) {
    console.error("Fax Sending Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send faxes." },
      { status: 500 }
    );
  }
}
