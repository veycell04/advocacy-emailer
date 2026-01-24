import { NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Lob = require('lob');

const lob = new Lob(process.env.LOB_API_KEY as string);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // We expect the user's full info and the array of senators to send to.
    const { user, senators } = body;

    if (!user || !senators || !Array.isArray(senators) || senators.length === 0) {
        return NextResponse.json({ error: 'Invalid data for sending letters.' }, { status: 400 });
    }

    const sendPromises = senators.map((senator: any) => {
        // This is the HTML template for the letter. Lob converts this to a PDF.
        const letterHtml = `
<html>
<head>
<style>
  body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000; }
  .page { padding: 1in; }
  .date { margin-bottom: 2em; }
  .address { margin-bottom: 2em; }
  .salutation { margin-bottom: 1em; }
  .body { margin-bottom: 2em; text-align: justify; }
  .closing { margin-top: 3em; }
</style>
</head>
<body>
  <div class="page">
    <div class="date">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    
    <div class="address">
      The Honorable ${senator.name}<br>
      United States Senate<br>
      Washington, DC 20510
    </div>
    
    <div class="salutation">Dear Senator ${senator.name.split(' ').pop()},</div>
    
    <div class="body">
      ${senator.body.replace(/\n/g, '<br>')} <!-- Replace newlines with HTML breaks -->
    </div>
  </div>
</body>
</html>
        `;

        // Call the Lob API to create and mail the letter.
        return lob.letters.create({
            description: `Advocacy Letter to Sen. ${senator.name} from ${user.firstName} ${user.lastName}`,
            // --- THE FIX IS HERE ---
            use_type: 'operational', 
            to: {
                name: `Senator ${senator.name}`,
                address_line1: 'United States Senate',
                // For Senators, the zip is a unique code that routes to their DC office.
                // It's always 20510.
                address_city: 'Washington',
                address_state: 'DC',
                address_zip: '20510'
            },
            from: {
                name: `${user.firstName} ${user.lastName}`,
                address_line1: user.streetAddress,
                address_city: user.city, // We need to get city from frontend
                address_state: user.state,
                address_zip: user.zipCode
            },
            file: letterHtml,
            color: false, // Black & white is cheaper
            address_placement: 'top_first_page',
            double_sided: true
        });
    });

    // Wait for all letters to be submitted to Lob.
    await Promise.all(sendPromises);

    console.log(`Successfully submitted ${senators.length} letters to Lob.`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Lob API Error:', error);
    // If Lob fails, it returns a specific error object. We try to extract the message.
    const errorMessage = error.message || error._response?.body?.error?.message || 'Failed to send letters via Lob.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}