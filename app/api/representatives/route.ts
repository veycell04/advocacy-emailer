import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zipCode, firstName, lastName, userEmail } = body;

    // 1. Strict Validation of Mandatory Fields
    if (!zipCode || zipCode.length !== 5) {
      return NextResponse.json({ error: 'Valid 5-digit Zip Code is required.' }, { status: 400 });
    }
    // Ensure all user details are present for the formal sign-off
    if (!firstName?.trim() || !lastName?.trim() || !userEmail?.trim() || !userEmail.includes('@')) {
       return NextResponse.json({ error: 'All name and valid email fields are mandatory for a formal constituent request.' }, { status: 400 });
    }

    console.log(`Looking up state for zip: ${zipCode}...`);

    // 2. Call Zippopotam API to convert Zip -> State Name
    const zipResponse = await fetch(`https://api.zippopotam.us/us/${zipCode}`);

    if (!zipResponse.ok) {
        console.error("Zippopotam error:", zipResponse.status);
        // Add a source tag so frontend knows it's a zip issue
        return NextResponse.json({ error: 'Zip Code not found.', source: 'zippopotam' }, { status: 404 });
    }

    const zipData = await zipResponse.json();
    const stateName = zipData.places[0]['state'];
    const stateAbbrev = zipData.places[0]['state abbreviation'];

    console.log(`Zip resolved to: ${stateName}. Asking OpenAI to draft detailed emails...`);

    // 3. Updated OpenAI prompt with historical context, ISIS threat, and formal sign-off
    const prompt = `
      You are an expert political advocacy writer.
      
      Task 1: Identify the two current US Senators representing the state of "${stateName}" (${stateAbbrev}).
      Task 2: Find their public contact email addresses.
      Task 3: Write a powerful, urgent, and formal 6-8 sentence email body to them.

      **Email Content Requirements:**
      - **Opening:** State that you are a concerned constituent urging immediate support for the Kurds in Northeast Syria (Rojava).
      - **Historical Context (Crucial):** Explicitly remind the Senator that Kurdish forces were America's most reliable and effective allies on the ground in the fight against ISIS, sacrificing thousands of lives to destroy the physical caliphate.
      - **Current Threat:** Highlight that they are now in severe danger due to being abandoned to changing geopolitical dynamics and threats from the Syrian government and other regional actors.
      - **The ISIS Risk:** Emphasize that destabilizing the Kurdish administration risks the escape of thousands of ISIS prisoners currently under their guard, leading to a resurgence of global terror.
      - **Tone:** Urgent, respectful, professional, and firm. No subject line in the body.

      **Formal Sign-off requirement (Mandatory):**
      You must end the email body exactly with this structure, inserting the provided user data:

      "Sincerely,

      ${firstName} ${lastName}
      Zip Code: ${zipCode}, ${stateName}
      Contact: ${userEmail}"

      **Output Format:**
      Respond ONLY with a raw JSON array of two objects.
      Example: [ {"name": "Sen X", "email": "...", "subject": "Urgent: Support Syrian Kurds & Prevent ISIS Resurgence", "body": "...full text..."} ]
    `;

    // Using gpt-4o for high quality writing and instruction following
    const openAIResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4, // Slightly higher for better persuasive writing qualities
    });

    const content = openAIResponse.choices[0].message.content;
    if (!content) throw new Error("OpenAI returned empty.");

    const cleanJson = content.replace(/```json\n|\n```/g, '').trim();
    const parsedData = JSON.parse(cleanJson);
    
    if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error("Could not find senators format.");
    }

    console.log(`Successfully generated detailed emails for ${parsedData.length} senators.`);

    return NextResponse.json({ reps: parsedData });

  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'An error occurred while drafting the emails. Please try again.' }, { status: 500 });
  }
}