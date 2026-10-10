# Harit-SANKALP Application Guide

This guide explains how to start the application and use its public pages and internal forestry workflow.

## 1. Start the application locally

Run the Django API and React website in separate terminals from the repository root.

### Django backend

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py check
python manage.py runserver 127.0.0.1:8000
```

The local API is served over **HTTP** at `http://127.0.0.1:8000/api/`. Django's development server does not provide HTTPS. If the browser sends HTTPS requests to this server, API calls will fail with an SSL protocol error.

### React frontend

```powershell
cd frontend
npm install
npm start
```

Open `http://localhost:3000`. The frontend uses `http://localhost:8000/api` by default. If the API is hosted elsewhere, set `REACT_APP_API_BASE_URL` for the frontend build to the API base URL, including `/api`.

For production, deploy Django behind an HTTPS-capable web server or reverse proxy and configure the frontend to use the deployed HTTPS API URL. Do not expose Django's development server as the production server.

## 2. Public pages

Use the header navigation to open the public areas:

| Page | Route | Purpose |
|---|---|---|
| Home | `/` | Introduction to Harit-SANKALP |
| Dashboard | `/dashboard` | Public nursery and plantation information |
| Advance Booking | `/advance-booking` | Submit a planting-material booking request |
| Our Nurseries | `/our-nurseries` | Browse nursery locations and details |
| FAQs | `/faqs` | Read common questions |
| User Guides | `/documentation` | Open user manuals |
| About Us | `/about-us` | Learn about the platform and its leadership |

The header's language selector provides English, Hindi, Bengali, Telugu, Tamil, Marathi, Gujarati, Kannada, and Malayalam. The selected language is saved in the browser.

Home and Dashboard totals are loaded from the active nursery, seedling-distribution, and forestry registration records and refresh once per minute. Featured nursery cards use the registered nursery name, photo, and location from the database. Choose a card or **View Details** to open its full nursery record and map.

On Dashboard, hover over a state to see its active nursery count. Select a state or a statistic card to open `/dashboard/details/...`, where the map, hierarchy rankings, 90-day progress totals, and available field reports are shown. Public visitors see aggregated rankings; individual field reports are limited to signed-in users and the report data visible to their workflow role. The Our Nurseries directory supports state/name/address search, paged results, and a separate detail view for each nursery.

## 3. Sign in to the internal workflow

Choose **Login** in the header and select the account type:

- National, State, Circle, and DFO staff use the configured PARIVESH login integration.
- Range Officer (RO) login uses the configured RO account integration.
- Silviculturist login uses an account created by National, State, Circle, or DFO staff. The account is mapped to its office in `T001_UserMaster`.

Use the account issued for your role. Internal dashboard access requires a successful sign-in and a valid access token.

### Automatic logout

Use **Log out** in the site header to end the session manually. Access tokens now last 30 minutes. When a token expires or the API rejects it, the browser clears the access token, refresh token, and saved workflow user, then returns to Home. Signing in again starts a new session. A session expiry in another browser tab also signs out the current tab.

## 4. Use the internal dashboard

After signing in as an internal workflow role, the dashboard is available at `/internal/dashboard`. It shows the modules and record counts available to the signed-in account.

Range Officers register SPA/CPT, Seed Orchards, and nurseries, and enter seed-collection, seed-processing, plant-production, and plant-disposal information for their assigned range. Silviculturists receive a separate dashboard for the modules in their technical-review scope. They record findings and select exact fields for RO correction; after the RO applies corrections, the record returns for Silviculturist re-review. A review with no requested corrections completes the technical review. Technical reviews do not replace formal office approval.

### Six-month field progress reporting

Open **Six-month field progress** from the internal dashboard. Reporting periods follow the calendar half-years (January 1–June 30 and July 1–December 31). A missed period remains the active reporting period until the required reports/reviews are completed; the internal dashboard displays an overdue popup to users in the applicable hierarchy. Range Officers can submit a late report for the immediately preceding period, then continue with the current period.

Range Officers can submit a six-month progress report only after every active reportable site in their range that requires Silviculturist review has completed its technical review, including any correction and re-review cycle. The form lists sites still awaiting review, and the API enforces the same gate. Range Officers then select a registered site in their range and submit the inspection date, per-species counts, plantation year/age, height, girth, growth since the prior report, survival, seed collection and nursery-stock figures, field issues, and a current photo. Species already linked to a Seed Production Area, Seed Orchard, nursery production/distribution record, or processing-unit batch are prefilled when that site is selected. The RO can add more rows and enter additional species names when a site has other species or no linked species yet. The browser must provide a current GPS fix with reported accuracy no worse than 100 m; the fix must be within 100 m of the registered site coordinates. Sites without registered coordinates are shown but cannot be selected for submission. Photo uploads must be valid JPEG, PNG, or WebP images no larger than 8 MB.

Silviculturists assess each submitted report as **Satisfactory**, **Needs Improvement**, or **Critical Review Required**, with reasons and recommendations. They can optionally document an on-site inspection with the same GPS and photo checks. They can also assess active, formally approved sites in their jurisdiction directly from the approved-site assessment list, even when an RO field report has not yet been submitted (including legacy approved records). This does not create or replace an RO report. Assessment history is retained independently of formal workflow approval and is visible to the relevant office hierarchy. Report details show the verified coordinates, site photo, captured location, and differences from the previous six-month report for the same site when one exists.

The dashboard exposes scoped missing-report/review alerts and the 90-day office rankings to the relevant hierarchy. The combined score gives equal weight to normalized plants planted and survival percentage; the component measures and score are displayed together. Report submissions preserve the site, office, and submitter names/IDs as they were when submitted, so later user transfers do not rewrite historical records.

Before enabling this feature in a deployment, apply the backend migrations with `python manage.py migrate`; migrations `todos.0006` through `todos.0008` create the progress-report and technical-assessment/recommendation history tables and support approved-site assessments.

### Registration modules

Use **Register** to submit records for review for:

- Seed Production Areas / Candidate Plus Trees
- Seed Orchards
- Nurseries
- Research Institutes
- Seed Processing and Treatment Units

### Operational modules

Use **Add record** to record:

- Seed collection
- Seed processing
- Nursery distribution
- Plant production
- Plant dispatch / disposal

### Enter and submit a record

1. Open the required module from the dashboard.
2. Complete the location fields. State, district, forest circle, division, range, and other options are loaded from the configured database. Some fields are limited by the signed-in user's office scope.
3. Complete the remaining required fields. Fields marked with `*` are mandatory.
4. Add any required attachment. Photo uploads accept JPG/JPEG files and require at least 50 KB; KML uploads accept KML files up to 5 MB.
5. Select **Submit for review**. The new record appears in the module's record list with its review status.
6. Use the status filter and refresh button to find records in the list.

The module's report view shows records available within the account's assigned jurisdiction.
Reports and dashboard totals only show records present in the connected database and visible to the signed-in role. A newly submitted record remains pending until an authorized reviewer approves or returns it.

Reports are paginated and can be filtered by status, search text, and the location fields supported by that module. Excel export downloads an Excel-readable `.xls` workbook with a **State-wise summary** sheet and a formatted records sheet. PDF export opens a branded print view with the Harit-SANKALP logo, a state-wise summary, and a striped report table; choose **Save as PDF** in the browser's print dialog. Select a report row to open its full detail card, map coordinates (when present), submitter, and latest recorded decision.

Records whose status is blank or outside `P`, `A`, and `R` are shown as **Existing record (not in workflow)**, not as pending review. They predate or are not tracked by this workflow; they do not appear in the pending queue. The dashboard separately counts these records. Empty module cards mean their corresponding existing database tables have no records available to the signed-in role; the application does not fabricate sample records.

### Nursery location map

Choose **Map registered nurseries** on the internal dashboard. The page lists nurseries visible to your role, places India-bounded records with valid coordinates on the map, and provides a direct map link. The map includes all mapped nurseries in your jurisdiction while the table is paginated. Click a marker to zoom to the nursery and open its photo, name, code, address, location, and record-details link. Records without India coordinates still appear in the table.

### Account and master-data administration

National, State, Circle, and DFO users can open **Manage users**. The list and available child level are limited to the signed-in user's hierarchy:

| Signed-in level | Accounts that can be created |
|---|---|
| National | State |
| State | Circle |
| Circle | Division |
| DFO / Division | Range / RO |

Choose **Admin** or **User** for the account type. New accounts are pending; approve an account before activating it. The Authenticate Users section also supports deactivation and blocking/unblocking. The Activate RO Users section lists only ordinary (`User`) accounts at Range level. State/Nodal users can reset passwords from the Reset Password section.

The administration page also lists existing designation and species masters, active/inactive status, and species-age-height combinations. It allows authorized staff to add or deactivate these records. National, State, Circle, and DFO staff can create and activate/deactivate Silviculturist credentials from **Silviculturist accounts**; creation requires an active designation and assigns the account to a state and optionally a circle/division within the administrator's jurisdiction. Directory management uses the existing Circle, Division, and Range tables and is constrained to the signed-in jurisdiction. Range Officers do not have account- or master-data administration access.

## 5. Review and approve records

Open the review queue from the internal dashboard to review pending submissions visible to your role. DFO and higher offices can approve or return submissions from lower office levels within their jurisdiction; Range Officers do not perform formal approvals. National submissions are final and are automatically approved.

Range Officers create and submit forestry records. Silviculturists do not create those records or perform formal approvals: they review relevant pending records (including seed collection, processing, nursery distribution, production, and disposal) for their assigned area. Open a pending record from its **Technical reviews** report, enter the technical recommendation, and select the exact record fields that need correction. The recommendation is visible to users in the record's jurisdiction; the workflow approval status does not change.

The submitting Range Officer can update only the fields selected by the Silviculturist. Saving those corrections does not change the approval status. The correction and recommendation are retained on the record for authorized users in that jurisdiction. After the RO submits a six-month field progress report, Silviculturists can also add the separate scientific assessment and recommendations to that report. RO progress reports and their technical assessments are available to authorized hierarchy users in the applicable jurisdiction from **Field progress**.

The workflow API applies the role and office scope when returning records and lookup options. If a form's lookup options cannot be loaded, the form can still show its fields and records while displaying a lookup error; retry after the API/database connection is available.

## 6. Language and displayed names

Navigation, page copy, form labels, workflow actions, statuses, and fixed workflow dropdown choices use the selected application language. Leadership names on the About page are displayed in the selected script.

Names supplied by the database—such as a nursery, person, location, or species—remain as stored. These are source records rather than interface labels; automatically translating them could change an official name or scientific species name.
