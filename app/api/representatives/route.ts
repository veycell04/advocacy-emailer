import { NextResponse } from 'next/server';

// --- HARDCODED SENATOR DATA (With Fax Numbers) ---
// Maps State Abbreviation -> Array of Senators with contactUrl and fax.
const SENATOR_DATA: Record<string, Array<{ name: string, contactUrl: string, fax: string }>> = {
    "AL": [{ name: "Tommy Tuberville", contactUrl: "https://www.tuberville.senate.gov/contact", fax: "+12022243416" }, { name: "Katie Britt", contactUrl: "https://www.britt.senate.gov/contact", fax: "+12022280074" }],
    "AK": [{ name: "Lisa Murkowski", contactUrl: "https://www.murkowski.senate.gov/contact", fax: "+12022245301" }, { name: "Dan Sullivan", contactUrl: "https://www.sullivan.senate.gov/contact", fax: "+12022246455" }],
    "AZ": [{ name: "Kyrsten Sinema", contactUrl: "https://www.sinema.senate.gov/contact", fax: "+12022283997" }, { name: "Mark Kelly", contactUrl: "https://www.kelly.senate.gov/contact", fax: "+12022242235" }],
    "AR": [{ name: "John Boozman", contactUrl: "https://www.boozman.senate.gov/public/index.cfm/contact", fax: "+12022281371" }, { name: "Tom Cotton", contactUrl: "https://www.cotton.senate.gov/contact", fax: "+12022281371" }],
    "CA": [{ name: "Alex Padilla", contactUrl: "https://www.padilla.senate.gov/contact/contact-form/", fax: "+12022242200" }, { name: "Laphonza Butler", contactUrl: "https://www.butler.senate.gov/contact", fax: "+12022242200" }],
    "CO": [{ name: "Michael Bennet", contactUrl: "https://www.bennet.senate.gov/public/index.cfm/contact", fax: "+12022285036" }, { name: "John Hickenlooper", contactUrl: "https://www.hickenlooper.senate.gov/contact", fax: "+12022245271" }],
    "CT": [{ name: "Richard Blumenthal", contactUrl: "https://www.blumenthal.senate.gov/contact", fax: "+12022249673" }, { name: "Chris Murphy", contactUrl: "https://www.murphy.senate.gov/contact", fax: "+12022249750" }],
    "DE": [{ name: "Tom Carper", contactUrl: "https://www.carper.senate.gov/public/index.cfm/email-senator-carper", fax: "+12022282190" }, { name: "Chris Coons", contactUrl: "https://www.coons.senate.gov/contact", fax: "+12022280002" }],
    "FL": [{ name: "Marco Rubio", contactUrl: "https://www.rubio.senate.gov/public/index.cfm/contact", fax: "+12022280285" }, { name: "Rick Scott", contactUrl: "https://www.rickscott.senate.gov/contact", fax: "+12022285171" }],
    "GA": [{ name: "Jon Ossoff", contactUrl: "https://www.ossoff.senate.gov/contact", fax: "+12022242441" }, { name: "Raphael Warnock", contactUrl: "https://www.warnock.senate.gov/contact", fax: "+12022242441" }],
    "HI": [{ name: "Brian Schatz", contactUrl: "https://www.schatz.senate.gov/contact", fax: "+12022281153" }, { name: "Mazie Hirono", contactUrl: "https://www.hirono.senate.gov/contact", fax: "+12022242235" }],
    "ID": [{ name: "Mike Crapo", contactUrl: "https://www.crapo.senate.gov/contact", fax: "+12022281375" }, { name: "Jim Risch", contactUrl: "https://www.risch.senate.gov/public/index.cfm/contact", fax: "+12022242573" }],
    "IL": [{ name: "Dick Durbin", contactUrl: "https://www.durbin.senate.gov/contact", fax: "+12022280400" }, { name: "Tammy Duckworth", contactUrl: "https://www.duckworth.senate.gov/contact", fax: "+12022285417" }],
    "IN": [{ name: "Todd Young", contactUrl: "https://www.young.senate.gov/contact", fax: "+12022241845" }, { name: "Mike Braun", contactUrl: "https://www.braun.senate.gov/contact", fax: "+12022241845" }],
    "IA": [{ name: "Chuck Grassley", contactUrl: "https://www.grassley.senate.gov/contact", fax: "+12022246020" }, { name: "Joni Ernst", contactUrl: "https://www.ernst.senate.gov/contact", fax: "+12022249369" }],
    "KS": [{ name: "Jerry Moran", contactUrl: "https://www.moran.senate.gov/public/index.cfm/e-mail-jerry", fax: "+12022286966" }, { name: "Roger Marshall", contactUrl: "https://www.marshall.senate.gov/contact", fax: "+12022246507" }],
    "KY": [{ name: "Mitch McConnell", contactUrl: "https://www.mcconnell.senate.gov/public/index.cfm/contactform", fax: "+12022242499" }, { name: "Rand Paul", contactUrl: "https://www.paul.senate.gov/contact", fax: "+12022280315" }],
    "LA": [{ name: "Bill Cassidy", contactUrl: "https://www.cassidy.senate.gov/contact", fax: "+12022249735" }, { name: "John Kennedy", contactUrl: "https://www.kennedy.senate.gov/public/email-me", fax: "+12022242499" }],
    "ME": [{ name: "Susan Collins", contactUrl: "https://www.collins.senate.gov/contact", fax: "+12022242693" }, { name: "Angus King", contactUrl: "https://www.king.senate.gov/contact", fax: "+12022241946" }],
    "MD": [{ name: "Ben Cardin", contactUrl: "https://www.cardin.senate.gov/contact", fax: "+12022241651" }, { name: "Chris Van Hollen", contactUrl: "https://www.vanhollen.senate.gov/contact", fax: "+12022241651" }],
    "MA": [{ name: "Elizabeth Warren", contactUrl: "https://www.warren.senate.gov/contact", fax: "+12022242417" }, { name: "Ed Markey", contactUrl: "https://www.markey.senate.gov/contact", fax: "+12022242417" }],
    "MI": [{ name: "Debbie Stabenow", contactUrl: "https://www.stabenow.senate.gov/contact", fax: "+12022280325" }, { name: "Gary Peters", contactUrl: "https://www.peters.senate.gov/contact", fax: "+12022241845" }],
    "MN": [{ name: "Amy Klobuchar", contactUrl: "https://www.klobuchar.senate.gov/public/index.cfm/contact", fax: "+12022244207" }, { name: "Tina Smith", contactUrl: "https://www.smith.senate.gov/contact", fax: "+12022244207" }],
    "MS": [{ name: "Roger Wicker", contactUrl: "https://www.wicker.senate.gov/contact", fax: "+12022280378" }, { name: "Cindy Hyde-Smith", contactUrl: "https://www.hyde-smith.senate.gov/contact", fax: "+12022242499" }],
    "MO": [{ name: "Josh Hawley", contactUrl: "https://www.hawley.senate.gov/contact", fax: "+12022243514" }, { name: "Eric Schmitt", contactUrl: "https://www.schmitt.senate.gov/contact", fax: "+12022243514" }],
    "MT": [{ name: "Jon Tester", contactUrl: "https://www.tester.senate.gov/contact", fax: "+12022248594" }, { name: "Steve Daines", contactUrl: "https://www.daines.senate.gov/contact", fax: "+12022241724" }],
    "NE": [{ name: "Deb Fischer", contactUrl: "https://www.fischer.senate.gov/public/index.cfm/contact", fax: "+12022242354" }, { name: "Pete Ricketts", contactUrl: "https://www.ricketts.senate.gov/contact", fax: "+12022242354" }],
    "NV": [{ name: "Catherine Cortez Masto", contactUrl: "https://www.cortezmasto.senate.gov/contact", fax: "+12022280325" }, { name: "Jacky Rosen", contactUrl: "https://www.rosen.senate.gov/contact", fax: "+12022280325" }],
    "NH": [{ name: "Jeanne Shaheen", contactUrl: "https://www.shaheen.senate.gov/contact", fax: "+12022242441" }, { name: "Maggie Hassan", contactUrl: "https://www.hassan.senate.gov/contact", fax: "+12022242441" }],
    "NJ": [{ name: "Bob Menendez", contactUrl: "https://www.menendez.senate.gov/contact", fax: "+12022282197" }, { name: "Cory Booker", contactUrl: "https://www.booker.senate.gov/contact", fax: "+12022242441" }],
    "NM": [{ name: "Martin Heinrich", contactUrl: "https://www.heinrich.senate.gov/contact", fax: "+12022280307" }, { name: "Ben Ray Luján", contactUrl: "https://www.lujan.senate.gov/contact", fax: "+12022280307" }],
    "NY": [{ name: "Chuck Schumer", contactUrl: "https://www.schumer.senate.gov/contact/email-chuck", fax: "+12022280029" }, { name: "Kirsten Gillibrand", contactUrl: "https://www.gillibrand.senate.gov/contact/email-me", fax: "+12022280282" }],
    "NC": [{ name: "Thom Tillis", contactUrl: "https://www.tillis.senate.gov/email-me", fax: "+12022280440" }, { name: "Ted Budd", contactUrl: "https://www.budd.senate.gov/contact", fax: "+12022280440" }],
    "ND": [{ name: "John Hoeven", contactUrl: "https://www.hoeven.senate.gov/contact", fax: "+12022247999" }, { name: "Kevin Cramer", contactUrl: "https://www.cramer.senate.gov/contact", fax: "+12022247999" }],
    "OH": [{ name: "Sherrod Brown", contactUrl: "https://www.brown.senate.gov/contact", fax: "+12022242441" }, { name: "JD Vance", contactUrl: "https://www.vance.senate.gov/contact", fax: "+12022242441" }],
    "OK": [{ name: "James Lankford", contactUrl: "https://www.lankford.senate.gov/contact", fax: "+12022284884" }, { name: "Markwayne Mullin", contactUrl: "https://www.mullin.senate.gov/contact", fax: "+12022284884" }],
    "OR": [{ name: "Ron Wyden", contactUrl: "https://www.wyden.senate.gov/contact", fax: "+12022282717" }, { name: "Jeff Merkley", contactUrl: "https://www.merkley.senate.gov/contact", fax: "+12022282717" }],
    "PA": [{ name: "Bob Casey Jr.", contactUrl: "https://www.casey.senate.gov/contact", fax: "+12022280604" }, { name: "John Fetterman", contactUrl: "https://www.fetterman.senate.gov/contact", fax: "+12022280604" }],
    "RI": [{ name: "Jack Reed", contactUrl: "https://www.reed.senate.gov/contact", fax: "+12022244680" }, { name: "Sheldon Whitehouse", contactUrl: "https://www.whitehouse.senate.gov/contact", fax: "+12022244680" }],
    "SC": [{ name: "Lindsey Graham", contactUrl: "https://www.lgraham.senate.gov/public/index.cfm/e-mail-senator-graham", fax: "+12022243808" }, { name: "Tim Scott", contactUrl: "https://www.scott.senate.gov/contact", fax: "+12022243808" }],
    "SD": [{ name: "John Thune", contactUrl: "https://www.thune.senate.gov/public/index.cfm/contact", fax: "+12022242592" }, { name: "Mike Rounds", contactUrl: "https://www.rounds.senate.gov/contact", fax: "+12022242592" }],
    "TN": [{ name: "Marsha Blackburn", contactUrl: "https://www.blackburn.senate.gov/contact", fax: "+12022280566" }, { name: "Bill Hagerty", contactUrl: "https://www.hagerty.senate.gov/contact", fax: "+12022280566" }],
    "TX": [{ name: "John Cornyn", contactUrl: "https://www.cornyn.senate.gov/contact", fax: "+12022240776" }, { name: "Ted Cruz", contactUrl: "https://www.cruz.senate.gov/contact", fax: "+12022240776" }],
    "UT": [{ name: "Mike Lee", contactUrl: "https://www.lee.senate.gov/contact", fax: "+12022281168" }, { name: "Mitt Romney", contactUrl: "https://www.romney.senate.gov/contact", fax: "+12022281168" }],
    "VT": [{ name: "Bernie Sanders", contactUrl: "https://www.sanders.senate.gov/contact", fax: "+12022242441" }, { name: "Peter Welch", contactUrl: "https://www.welch.senate.gov/contact", fax: "+12022242441" }],
    "VA": [{ name: "Mark Warner", contactUrl: "https://www.warner.senate.gov/contact", fax: "+12022280562" }, { name: "Tim Kaine", contactUrl: "https://www.kaine.senate.gov/contact", fax: "+12022280562" }],
    "WA": [{ name: "Patty Murray", contactUrl: "https://www.murray.senate.gov/contact", fax: "+12022240238" }, { name: "Maria Cantwell", contactUrl: "https://www.cantwell.senate.gov/contact", fax: "+12022240238" }],
    "WV": [{ name: "Joe Manchin", contactUrl: "https://www.manchin.senate.gov/contact", fax: "+12022280002" }, { name: "Shelley Moore Capito", contactUrl: "https://www.capito.senate.gov/contact", fax: "+12022280002" }],
    "WI": [{ name: "Ron Johnson", contactUrl: "https://www.ronjohnson.senate.gov/contact", fax: "+12022241845" }, { name: "Tammy Baldwin", contactUrl: "https://www.baldwin.senate.gov/contact", fax: "+12022241845" }],
    "WY": [{ name: "John Barrasso", contactUrl: "https://www.barrasso.senate.gov/contact", fax: "+12022281375" }, { name: "Cynthia Lummis", contactUrl: "https://www.lummis.senate.gov/contact", fax: "+12022281375" }],
};

// Use Zippopotam to get state, then look up local data.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zipCode, firstName, lastName, userEmail, streetAddress } = body;

    if (!zipCode || zipCode.length !== 5) return NextResponse.json({ error: 'Valid 5-digit Zip Code required.' }, { status: 400 });
    if (!firstName?.trim() || !lastName?.trim() || !streetAddress?.trim() ||!userEmail?.includes('@')) {
       return NextResponse.json({ error: 'All fields (Name, Email, Street Address) are required.' }, { status: 400 });
    }

    // 1. Zippopotam: Get State from Zip
    const zipResponse = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
    if (!zipResponse.ok) return NextResponse.json({ error: 'Zip Code not found.', source: 'zippopotam' }, { status: 404 });
    const zipData = await zipResponse.json();
    const stateAbbrev = zipData.places[0]['state abbreviation'];
    const stateName = zipData.places[0]['state'];

    // 2. Look up Senators from hardcoded list
    const senators = SENATOR_DATA[stateAbbrev];
    if (!senators) return NextResponse.json({ error: `Could not find senator data for state: ${stateAbbrev}` }, { status: 404 });

    // 3. Generate the message body (Standardized for all channels)
    const messageBody = `Dear Senator,

I am writing to you as a concerned constituent to urge immediate action to support our Kurdish allies in Northeast Syria (Rojava).

Kurdish forces were America’s most vital boots-on-the-ground allies in defeating the physical ISIS caliphate, sacrificing thousands of lives in a fight that protected us all. Today, these same communities are dangerously abandoned—facing Turkish military aggression, threats from the Syrian regime, and severe geopolitical instability.

The humanitarian situation is rapidly deteriorating. Large areas of Northeast Syria are without electricity, clean water, or heating, leaving civilians—especially children, the elderly, and the sick—exposed to extreme hardship. Tragically, reports indicate that a fifth child has recently died due to cold and lack of basic services, underscoring the urgency of this crisis.

Beyond the humanitarian disaster, there are serious implications for U.S. national security. If this region destabilizes further, there is a dire risk that thousands of ISIS prisoners currently held in Kurdish-run detention camps could escape, potentially leading to a resurgence of global terrorism.

We must not abandon those who fought alongside us at great cost. I respectfully urge you to take immediate action to support humanitarian aid, protect civilian infrastructure, and ensure the continued stability and security of Northeast Syria.

Sincerely,

${firstName} ${lastName}
${streetAddress}
${stateName}, ${zipCode}
Email: ${userEmail}`;

    // Return the data needed for the frontend to display options
    const finalResults = senators.map((sen) => ({
        name: sen.name,
        contactUrl: sen.contactUrl,
        fax: sen.fax,
        body: messageBody,
        userState: stateAbbrev
    }));

    return NextResponse.json({ reps: finalResults });

  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
  }
}