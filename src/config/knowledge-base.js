/**
 * Civitra Knowledge Base — Indian Election Process
 *
 * Comprehensive reference data used as context grounding for the AI assistant.
 * This acts as a lightweight RAG layer — injected into the conversation context
 * to ensure accurate, hallucination-resistant responses.
 */

export const KNOWLEDGE_BASE = `
## INDIAN ELECTION SYSTEM — REFERENCE DATA

### 1. VOTER ELIGIBILITY
- **Minimum Age**: 18 years as on the qualifying date
- **Qualifying Dates**: January 1, April 1, July 1, or October 1 of the year of electoral roll revision
- **Citizenship**: Must be a citizen of India
- **Residency**: Must be an "ordinary resident" of the constituency where registration is sought
- **Disqualifications**: Persons of unsound mind (as declared by competent court), persons convicted of certain electoral offenses, non-citizens

### 2. VOTER REGISTRATION

#### Online Registration
1. Visit https://voters.eci.gov.in/ OR use the Voter Helpline App (Android/iOS)
2. Create account using mobile number
3. Select "New Voter Registration"
4. Fill Form 6
5. Upload required documents
6. Submit and note the reference number for tracking

#### Offline Registration
1. Download Form 6 from https://eci.gov.in or collect from local ERO/BLO
2. Fill in details with recent passport-size photo
3. Attach self-attested copies of required documents
4. Submit to local Booth Level Officer (BLO) or Electoral Registration Officer (ERO)

#### Required Documents
| Document Type | Accepted Proofs |
|--------------|----------------|
| **Age Proof** | Aadhaar card, PAN card, Birth certificate, Class X/XII marksheet, Indian passport |
| **Address Proof** | Aadhaar card, Utility bills (water/electricity/gas), Bank passbook, Registered rent agreement |
| **Identity Proof** | Aadhaar card, PAN card, Driving license, Passport |

### 3. IMPORTANT FORMS
| Form | Purpose |
|------|---------|
| **Form 6** | New voter registration |
| **Form 6A** | Overseas (NRI) voter registration |
| **Form 6B** | Aadhaar linking with voter ID |
| **Form 7** | Objection to inclusion of a name in electoral roll |
| **Form 8** | Correction of entries / shifting of residence / replacement of EPIC |
| **Form 8A** | Transposition of entry within same constituency |

### 4. VOTER ID CARD (EPIC)
- **Full Name**: Elector's Photo Identity Card
- **Issuing Authority**: Election Commission of India
- **Contains**: Name, photo, father's/mother's/husband's name, age, gender, constituency, part number, serial number, EPIC number
- **Not mandatory to vote**: Voters can use 12 alternative photo ID documents at the polling booth
- **Alternative IDs accepted**: Aadhaar, MNREGA job card, Passbook with photo, PAN card, Driving license, Indian passport, Smart card by RGI, Pension document with photo, Service ID of govt employees, Student ID (for students), Health insurance card, Official ID by MP/MLA/MLC

### 5. TYPES OF ELECTIONS
| Election Type | Scope | Term | Conducted By |
|--------------|-------|------|-------------|
| **Lok Sabha** (General) | National — 543 constituencies | 5 years | ECI |
| **Vidhan Sabha** (State Assembly) | State level | 5 years | ECI with State EC |
| **Rajya Sabha** | Upper House — elected by MLAs | 6 years (1/3 retire every 2 years) | ECI |
| **Panchayat** | Village/Block/District level | 5 years | State Election Commission |
| **Municipal** | City/Town level | 5 years | State Election Commission |
| **By-elections** | Single constituency vacancy | Remainder of term | ECI |

### 6. VOTING PROCESS — ELECTION DAY

#### Before Voting
1. Check your name on the electoral roll at https://voters.eci.gov.in/
2. Locate your polling booth (same website or Voter Helpline App)
3. Carry a valid photo ID document

#### At the Polling Booth
1. Queue at assigned polling station (7 AM to 6 PM typically, may vary)
2. Election official verifies identity with photo ID
3. Index finger marked with indelible ink
4. Proceed to voting compartment
5. Press the button next to your chosen candidate/party symbol on the EVM (Electronic Voting Machine)
6. VVPAT (Voter Verifiable Paper Audit Trail) displays your choice for 7 seconds
7. Verify your vote on the VVPAT slip
8. Exit the booth

#### EVM Facts
- EVMs have been used in India since 1998 (full deployment from 2004)
- Each EVM can record up to 2,000 votes
- EVMs are standalone — not connected to any network or internet
- VVPAT provides paper trail verification
- EVMs have a "close" button pressed after polling ends — no more votes can be cast

### 7. NOTA (None Of The Above)
- Available since 2013 (Supreme Court ruling in PUCL v. Union of India)
- NOTA is always the LAST button on the EVM
- NOTA votes are counted but currently do not invalidate the election
- Even if NOTA gets the most votes, the candidate with most votes still wins
- NOTA is a form of negative voting / protest vote

### 8. SPECIAL PROVISIONS

#### NRI Voters
- Can register using Form 6A
- Must be Indian citizen who has NOT acquired citizenship of another country
- Passport is the primary document
- Must vote in person at the assigned polling station in India (currently no overseas postal/electronic voting for general elections)

#### Persons with Disabilities (PwD)
- Wheelchair ramps and accessible polling booths
- Braille-enabled EVMs (Braille signage on balloting unit)
- Companion assistance allowed (companion must be 18+, can accompany only one PwD voter)
- Priority entry at polling stations
- Sign language interpreters at some stations

#### Senior Citizens (80+)
- Eligible for postal ballot (Absentee Voter facility since 2019)
- Must apply in advance using Form 12D
- Priority entry at polling stations

#### Service Voters
- Armed forces personnel, diplomatic staff posted abroad
- Eligible for postal ballot or Electronically Transmitted Postal Ballot System (ETPBS)
- Register as service voter through Form 2/3

#### Transgender Voters
- "Third Gender" / "Others" option available in voter registration forms since 2014
- Same rights and process as any other voter

### 9. ELECTION TIMELINE (Typical)
1. **Announcement**: Election Commission announces election schedule
2. **Model Code of Conduct (MCC)**: Comes into effect immediately upon announcement
3. **Nomination Filing**: Candidates file nominations (usually 1 week window)
4. **Scrutiny**: Nominations are scrutinized (1-2 days after last date)
5. **Withdrawal**: Last date to withdraw candidature (2 days after scrutiny)
6. **Campaigning**: Political parties campaign (ends 48 hours before polling)
7. **Silent Period**: 48 hours before polling — no campaigning
8. **Polling Day**: Voting takes place
9. **Counting Day**: Votes counted (usually 2-3 days after polling for general elections)
10. **Results**: Winners declared, gazette notification issued

### 10. MODEL CODE OF CONDUCT (MCC)
- Voluntary code agreed upon by political parties, enforced by ECI
- In effect from date of election announcement to date of results
- Key provisions:
  - No party shall appeal to caste or communal feelings for votes
  - Mosques, churches, temples shall not be used for election propaganda
  - Government machinery shall not be used by ruling party for campaigning
  - Ministers shall not combine official visits with election work
  - No new government schemes/projects to be announced after MCC

### 11. ELECTION COMMISSION OF INDIA (ECI)
- **Established**: 25 January 1950 (celebrated as National Voters' Day)
- **Constitutional Body**: Article 324 of the Indian Constitution
- **Composition**: Chief Election Commissioner (CEC) + Election Commissioners (currently multi-member)
- **Headquarters**: Nirvachan Sadan, New Delhi
- **Website**: https://eci.gov.in/
- **Voter Services Portal**: https://voters.eci.gov.in/
- **Helpline**: 1950 (toll-free)
- **App**: Voter Helpline (Android & iOS)

### 12. ELECTION MYTH BUSTERS
- **Myth**: EVMs can be hacked via Bluetooth or Wi-Fi.
- **Fact**: EVMs are standalone machines with no radio frequency transmission capabilities and are not connected to any network.
- **Myth**: If NOTA gets the highest votes, the election is cancelled.
- **Fact**: NOTA is a protest vote. The candidate with the most votes (excluding NOTA) still wins.
- **Myth**: NRI voters can vote online.
- **Fact**: NRIs must be physically present at their registered polling station in India to vote.
- **Myth**: You need a Voter ID card to vote.
- **Fact**: You need to be on the electoral roll. You can use 12 other photo IDs (like Aadhaar or Passport) to vote.

### 13. IMPORTANT LINKS
- Voter Registration: https://voters.eci.gov.in/
- Check Electoral Roll: https://electoralsearch.eci.gov.in/
- Download Forms: https://eci.gov.in/
- Voter Helpline App: Available on Google Play Store and Apple App Store
- ECI Twitter/X: @ABORECI
- National Voters' Day: January 25th every year
`;

export default KNOWLEDGE_BASE;
