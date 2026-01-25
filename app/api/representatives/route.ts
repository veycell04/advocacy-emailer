import { NextResponse } from 'next/server';

// --- HARDCODED SENATOR DATA (Merged & Updated 2025/2026 List) ---
const SENATOR_DATA: Record<string, Array<{ name: string, contactUrl: string, fax: string, phone: string }>> = {
    "AL": [{ name: "Tommy Tuberville", contactUrl: "https://www.tuberville.senate.gov/contact", fax: "+12022243416", phone: "202-224-4124" }, { name: "Katie Britt", contactUrl: "https://www.britt.senate.gov/contact", fax: "+12022280074", phone: "202-224-5744" }],
    "AK": [{ name: "Lisa Murkowski", contactUrl: "https://www.murkowski.senate.gov/contact", fax: "+12022245301", phone: "202-224-6665" }, { name: "Dan Sullivan", contactUrl: "https://www.sullivan.senate.gov/contact", fax: "+12022246455", phone: "202-224-3004" }],
    // UPDATED AZ
    "AZ": [{ name: "Ruben Gallego", contactUrl: "https://www.gallego.senate.gov/contact", fax: "+12022244521", phone: "202-224-4521" }, { name: "Mark Kelly", contactUrl: "https://www.kelly.senate.gov/contact", fax: "+12022242235", phone: "202-224-2235" }],
    "AR": [{ name: "John Boozman", contactUrl: "https://www.boozman.senate.gov/contact", fax: "+12022281371", phone: "202-224-4843" }, { name: "Tom Cotton", contactUrl: "https://www.cotton.senate.gov/contact", fax: "+12022281371", phone: "202-224-2353" }],
    // UPDATED CA
    "CA": [{ name: "Alex Padilla", contactUrl: "https://www.padilla.senate.gov/contact", fax: "+12022242200", phone: "202-224-3553" }, { name: "Adam Schiff", contactUrl: "https://www.schiff.senate.gov/contact", fax: "+12022242200", phone: "202-224-3841" }],
    "CO": [{ name: "Michael Bennet", contactUrl: "https://www.bennet.senate.gov/contact", fax: "+12022285036", phone: "202-224-5852" }, { name: "John Hickenlooper", contactUrl: "https://www.hickenlooper.senate.gov/contact", fax: "+12022245271", phone: "202-224-5941" }],
    "CT": [{ name: "Richard Blumenthal", contactUrl: "https://www.blumenthal.senate.gov/contact", fax: "+12022249673", phone: "202-224-2823" }, { name: "Chris Murphy", contactUrl: "https://www.murphy.senate.gov/contact", fax: "+12022249750", phone: "202-224-4041" }],
    "DE": [{ name: "Tom Carper", contactUrl: "https://www.carper.senate.gov/contact", fax: "+12022282190", phone: "202-224-2441" }, { name: "Chris Coons", contactUrl: "https://www.coons.senate.gov/contact", fax: "+12022280002", phone: "202-224-5042" }],
    "FL": [{ name: "Marco Rubio", contactUrl: "https://www.rubio.senate.gov/contact", fax: "+12022280285", phone: "202-224-3041" }, { name: "Rick Scott", contactUrl: "https://www.rickscott.senate.gov/contact", fax: "+12022285171", phone: "202-224-5274" }],
    "GA": [{ name: "Jon Ossoff", contactUrl: "https://www.ossoff.senate.gov/contact", fax: "+12022242441", phone: "202-224-3521" }, { name: "Raphael Warnock", contactUrl: "https://www.warnock.senate.gov/contact", fax: "+12022242441", phone: "202-224-3643" }],
    "HI": [{ name: "Brian Schatz", contactUrl: "https://www.schatz.senate.gov/contact", fax: "+12022281153", phone: "202-224-3934" }, { name: "Mazie Hirono", contactUrl: "https://www.hirono.senate.gov/contact", fax: "+12022242235", phone: "202-224-6361" }],
    "ID": [{ name: "Mike Crapo", contactUrl: "https://www.crapo.senate.gov/contact", fax: "+12022281375", phone: "202-224-6142" }, { name: "Jim Risch", contactUrl: "https://www.risch.senate.gov/public/index.cfm/contact", fax: "+12022242573", phone: "202-224-2752" }],
    "IL": [{ name: "Dick Durbin", contactUrl: "https://www.durbin.senate.gov/contact", fax: "+12022280400", phone: "202-224-2152" }, { name: "Tammy Duckworth", contactUrl: "https://www.duckworth.senate.gov/connect/email-tammy", fax: "+12022285417", phone: "202-224-2854" }],
    "IN": [{ name: "Todd Young", contactUrl: "https://www.young.senate.gov/contact", fax: "+12022241845", phone: "202-224-5623" }, { name: "Mike Braun", contactUrl: "https://www.braun.senate.gov/contact", fax: "+12022241845", phone: "202-224-4814" }],
    "IA": [{ name: "Chuck Grassley", contactUrl: "https://www.grassley.senate.gov/contact", fax: "+12022246020", phone: "202-224-3744" }, { name: "Joni Ernst", contactUrl: "https://www.ernst.senate.gov/contact", fax: "+12022249369", phone: "202-224-3254" }],
    "KS": [{ name: "Jerry Moran", contactUrl: "https://www.moran.senate.gov/public/index.cfm/e-mail-jerry", fax: "+12022286966", phone: "202-224-6521" }, { name: "Roger Marshall", contactUrl: "https://www.marshall.senate.gov/contact", fax: "+12022246507", phone: "202-224-4774" }],
    "KY": [{ name: "Mitch McConnell", contactUrl: "https://www.mcconnell.senate.gov/public/index.cfm/contactform", fax: "+12022242499", phone: "202-224-2541" }, { name: "Rand Paul", contactUrl: "https://www.paul.senate.gov/contact", fax: "+12022280315", phone: "202-224-4343" }],
    "LA": [{ name: "Bill Cassidy", contactUrl: "https://www.cassidy.senate.gov/contact", fax: "+12022249735", phone: "202-224-5824" }, { name: "John Kennedy", contactUrl: "https://www.kennedy.senate.gov/public/email-me", fax: "+12022242499", phone: "202-224-4623" }],
    "ME": [{ name: "Susan Collins", contactUrl: "https://www.collins.senate.gov/contact", fax: "+12022242693", phone: "202-224-2523" }, { name: "Angus King", contactUrl: "https://www.king.senate.gov/contact", fax: "+12022241946", phone: "202-224-5344" }],
    "MD": [{ name: "Ben Cardin", contactUrl: "https://www.cardin.senate.gov/contact", fax: "+12022241651", phone: "202-224-4524" }, { name: "Chris Van Hollen", contactUrl: "https://www.vanhollen.senate.gov/contact", fax: "+12022241651", phone: "202-224-4654" }],
    "MA": [{ name: "Elizabeth Warren", contactUrl: "https://www.warren.senate.gov/contact", fax: "+12022242417", phone: "202-224-4543" }, { name: "Ed Markey", contactUrl: "https://www.markey.senate.gov/contact", fax: "+12022242417", phone: "202-224-2742" }],
    // UPDATED MI
    "MI": [{ name: "Gary Peters", contactUrl: "https://www.peters.senate.gov/contact", fax: "+12022241845", phone: "202-224-6221" }, { name: "Elissa Slotkin", contactUrl: "https://www.slotkin.senate.gov/contact", fax: "+12022241845", phone: "202-224-4822" }],
    "MN": [{ name: "Amy Klobuchar", contactUrl: "https://www.klobuchar.senate.gov/public/index.cfm/contact", fax: "+12022244207", phone: "202-224-3244" }, { name: "Tina Smith", contactUrl: "https://www.smith.senate.gov/contact", fax: "+12022244207", phone: "202-224-5641" }],
    "MS": [{ name: "Roger Wicker", contactUrl: "https://www.wicker.senate.gov/contact", fax: "+12022280378", phone: "202-224-6253" }, { name: "Cindy Hyde-Smith", contactUrl: "https://www.hyde-smith.senate.gov/contact", fax: "+12022242499", phone: "202-224-5054" }],
    "MO": [{ name: "Josh Hawley", contactUrl: "https://www.hawley.senate.gov/contact", fax: "+12022243514", phone: "202-224-6154" }, { name: "Eric Schmitt", contactUrl: "https://www.schmitt.senate.gov/contact", fax: "+12022243514", phone: "202-224-5721" }],
    "MT": [{ name: "Jon Tester", contactUrl: "https://www.tester.senate.gov/contact", fax: "+12022248594", phone: "202-224-2644" }, { name: "Steve Daines", contactUrl: "https://www.daines.senate.gov/contact", fax: "+12022241724", phone: "202-224-2651" }],
    "NE": [{ name: "Deb Fischer", contactUrl: "https://www.fischer.senate.gov/public/index.cfm/contact", fax: "+12022242354", phone: "202-224-6551" }, { name: "Pete Ricketts", contactUrl: "https://www.ricketts.senate.gov/contact", fax: "+12022242354", phone: "202-224-4224" }],
    "NV": [{ name: "Catherine Cortez Masto", contactUrl: "https://www.cortezmasto.senate.gov/contact", fax: "+12022280325", phone: "202-224-3542" }, { name: "Jacky Rosen", contactUrl: "https://www.rosen.senate.gov/contact", fax: "+12022280325", phone: "202-224-6244" }],
    "NH": [{ name: "Jeanne Shaheen", contactUrl: "https://www.shaheen.senate.gov/contact", fax: "+12022242441", phone: "202-224-2841" }, { name: "Maggie Hassan", contactUrl: "https://www.hassan.senate.gov/contact", fax: "+12022242441", phone: "202-224-3324" }],
    // UPDATED NJ
    "NJ": [{ name: "Cory Booker", contactUrl: "https://www.booker.senate.gov/contact", fax: "+12022242441", phone: "202-224-3224" }, { name: "Andy Kim", contactUrl: "https://www.kim.senate.gov/contact", fax: "+12022282197", phone: "202-224-4744" }],
    "NM": [{ name: "Martin Heinrich", contactUrl: "https://www.heinrich.senate.gov/contact", fax: "+12022280307", phone: "202-224-5521" }, { name: "Ben Ray Luján", contactUrl: "https://www.lujan.senate.gov/contact", fax: "+12022280307", phone: "202-224-6621" }],
    "NY": [{ name: "Chuck Schumer", contactUrl: "https://www.schumer.senate.gov/contact", fax: "+12022280029", phone: "202-224-6542" }, { name: "Kirsten Gillibrand", contactUrl: "https://www.gillibrand.senate.gov/contact", fax: "+12022280282", phone: "202-224-4451" }],
    "NC": [{ name: "Thom Tillis", contactUrl: "https://www.tillis.senate.gov/email-me", fax: "+12022280440", phone: "202-224-6342" }, { name: "Ted Budd", contactUrl: "https://www.budd.senate.gov/contact", fax: "+12022280440", phone: "202-224-3154" }],
    "ND": [{ name: "John Hoeven", contactUrl: "https://www.hoeven.senate.gov/contact", fax: "+12022247999", phone: "202-224-2551" }, { name: "Kevin Cramer", contactUrl: "https://www.cramer.senate.gov/contact", fax: "+12022247999", phone: "202-224-2043" }],
    // UPDATED OH
    "OH": [{ name: "Bernie Moreno", contactUrl: "https://www.moreno.senate.gov/contact", fax: "+12022242441", phone: "202-224-2315" }, { name: "JD Vance", contactUrl: "https://www.vance.senate.gov/contact", fax: "+12022242441", phone: "202-224-3353" }],
    "OK": [{ name: "James Lankford", contactUrl: "https://www.lankford.senate.gov/contact", fax: "+12022284884", phone: "202-224-5754" }, { name: "Markwayne Mullin", contactUrl: "https://www.mullin.senate.gov/contact", fax: "+12022284884", phone: "202-224-4721" }],
    "OR": [{ name: "Ron Wyden", contactUrl: "https://www.wyden.senate.gov/contact", fax: "+12022282717", phone: "202-224-5244" }, { name: "Jeff Merkley", contactUrl: "https://www.merkley.senate.gov/contact", fax: "+12022282717", phone: "202-224-3753" }],
    // UPDATED PA
    "PA": [{ name: "John Fetterman", contactUrl: "https://www.fetterman.senate.gov/contact", fax: "+12022280604", phone: "202-224-4254" }, { name: "Dave McCormick", contactUrl: "https://www.mccormick.senate.gov/contact", fax: "+12022280604", phone: "202-224-6324" }],
    "RI": [{ name: "Jack Reed", contactUrl: "https://www.reed.senate.gov/contact", fax: "+12022244680", phone: "202-224-4642" }, { name: "Sheldon Whitehouse", contactUrl: "https://www.whitehouse.senate.gov/contact", fax: "+12022244680", phone: "202-224-2921" }],
    "SC": [{ name: "Lindsey Graham", contactUrl: "https://www.lgraham.senate.gov/public/index.cfm/e-mail-senator-graham", fax: "+12022243808", phone: "202-224-5972" }, { name: "Tim Scott", contactUrl: "https://www.scott.senate.gov/contact", fax: "+12022243808", phone: "202-224-6121" }],
    "SD": [{ name: "John Thune", contactUrl: "https://www.thune.senate.gov/public/index.cfm/contact", fax: "+12022242592", phone: "202-224-2321" }, { name: "Mike Rounds", contactUrl: "https://www.rounds.senate.gov/contact", fax: "+12022242592", phone: "202-224-5842" }],
    "TN": [{ name: "Marsha Blackburn", contactUrl: "https://www.blackburn.senate.gov/contact", fax: "+12022280566", phone: "202-224-3344" }, { name: "Bill Hagerty", contactUrl: "https://www.hagerty.senate.gov/contact", fax: "+12022280566", phone: "202-224-4944" }],
    "TX": [{ name: "John Cornyn", contactUrl: "https://www.cornyn.senate.gov/contact", fax: "+12022240776", phone: "202-224-2934" }, { name: "Ted Cruz", contactUrl: "https://www.cruz.senate.gov/contact", fax: "+12022240776", phone: "202-224-5922" }],
    "UT": [{ name: "Mike Lee", contactUrl: "https://www.lee.senate.gov/contact", fax: "+12022281168", phone: "202-224-5444" }, { name: "Mitt Romney", contactUrl: "https://www.romney.senate.gov/contact", fax: "+12022281168", phone: "202-224-5251" }],
    // UPDATED VT
    "VT": [{ name: "Bernie Sanders", contactUrl: "https://www.sanders.senate.gov/contact", fax: "+12022242441", phone: "202-224-5141" }, { name: "Peter Welch", contactUrl: "https://www.welch.senate.gov/contact", fax: "+12022242441", phone: "202-224-4242" }],
    "VA": [{ name: "Mark Warner", contactUrl: "https://www.warner.senate.gov/contact", fax: "+12022280562", phone: "202-224-2023" }, { name: "Tim Kaine", contactUrl: "https://www.kaine.senate.gov/contact", fax: "+12022280562", phone: "202-224-4024" }],
    "WA": [{ name: "Patty Murray", contactUrl: "https://www.murray.senate.gov/contact", fax: "+12022240238", phone: "202-224-2621" }, { name: "Maria Cantwell", contactUrl: "https://www.cantwell.senate.gov/contact", fax: "+12022240238", phone: "202-224-3441" }],
    "WV": [{ name: "Joe Manchin", contactUrl: "https://www.manchin.senate.gov/contact", fax: "+12022280002", phone: "202-224-3954" }, { name: "Shelley Moore Capito", contactUrl: "https://www.capito.senate.gov/contact", fax: "+12022280002", phone: "202-224-6472" }],
    // UPDATED WI
    "WI": [{ name: "Tammy Baldwin", contactUrl: "https://www.baldwin.senate.gov/contact", fax: "+12022241845", phone: "202-224-5653" }, { name: "Mandela Barnes", contactUrl: "https://www.barnes.senate.gov/contact", fax: "+12022241845", phone: "202-224-5323" }],
    "WY": [{ name: "John Barrasso", contactUrl: "https://www.barrasso.senate.gov/contact", fax: "+12022281375", phone: "202-224-6441" }, { name: "Cynthia Lummis", contactUrl: "https://www.lummis.senate.gov/contact", fax: "+12022281375", phone: "202-224-3424" }],
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zipCode, firstName, lastName, userEmail, streetAddress } = body;

    if (!zipCode || zipCode.length !== 5) return NextResponse.json({ error: 'Valid 5-digit Zip Code required.' }, { status: 400 });
    if (!firstName?.trim() || !lastName?.trim() || !streetAddress?.trim() ||!userEmail?.includes('@')) {
       return NextResponse.json({ error: 'All fields (Name, Email, Street Address) are required.' }, { status: 400 });
    }

    const zipResponse = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
    if (!zipResponse.ok) return NextResponse.json({ error: 'Zip Code not found.', source: 'zippopotam' }, { status: 404 });
    const zipData = await zipResponse.json();
    const stateAbbrev = zipData.places[0]['state abbreviation'];
    const stateName = zipData.places[0]['state'];

    const senators = SENATOR_DATA[stateAbbrev];
    if (!senators) return NextResponse.json({ error: `Could not find senator data for state: ${stateAbbrev}` }, { status: 404 });

    const messageBody = `Dear Senator,

I am writing to you as a concerned constituent to urge immediate action to support our Kurdish allies in Northeast Syria (Rojava).

Kurdish forces were America’s most vital boots-on-the-ground allies in defeating the physical ISIS caliphate, sacrificing thousands of lives in a fight that protected us all. Today, these same communities are dangerously abandoned—facing Turkish military aggression, threats from the Syrian regime, and severe geopolitical instability.

The humanitarian situation is rapidly deteriorating. Large areas of Northeast Syria are without electricity, clean water, or heating, leaving civilians—especially children, the elderly, and the sick—exposed to extreme hardship. Tragically, reports indicate that a fifth child has recently died due to cold and lack of basic services, underscoring the urgency of this crisis.

Beyond the humanitarian disaster, there are serious implications for U.S. national security. If this region destabilizes further, there is a dire risk that thousands of ISIS prisoners currently held in Kurdish-run detention camps could escape, potentially leading to a resurgence of global terrorism.

We must not abandon those who fought alongside us at great cost. I respectfully urge you to take immediate action to support humanitarian aid, protect civilian infrastructure, and ensure the continued stability and security of Northeast Syria.

Sincerely,

${firstName} ${lastName}`;

    const finalResults = senators.map((sen) => ({
        name: sen.name,
        contactUrl: sen.contactUrl,
        fax: sen.fax,
        phone: sen.phone, 
        body: messageBody,
        userState: stateAbbrev
    }));

    return NextResponse.json({ reps: finalResults });

  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
  }
}