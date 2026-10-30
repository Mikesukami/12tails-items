# 12 Tails Item Database

Approved in chat on 2026-10-30: implement now. Owner manages items; partner views the shared link. Viewing is public to link holders (not confidential or invitation restricted).

## Intent
Replace a paper price notebook with a small Thai-language responsive board: item thumbnail, name, notes, manual Gold and THB prices, name search, and edit/delete for the owner. No automatic conversion, marketplace, or public signup.

## Approach
Chosen by user: Netlify static frontend and Supabase PostgreSQL, Auth and Storage. React + Vite is the implementation choice. A separate custom backend adds unnecessary maintenance; local-only storage would not share updates between devices.

## Access and data
Public SELECT on items and public image bucket. Password login; admin UUID allowlist controls all writes through RLS. Only database operator can change allowlist. Visitors and signed-in non-admins are read-only. No privileged key in frontend. Disable public signup in Supabase settings.

Items: UUID, trimmed name (1–120), description (max 2000), nonnegative numeric Gold/THB (max 999999999999.99, two decimals), optional storage object path, server timestamps. Images: JPEG/PNG/WebP, max 2 MiB; UUID filenames, no arbitrary URLs or SVG. Deleting/replacing an image attempts cleanup; database persistence determines success.

## Experience and failure behavior
Dark teal notebook/collection design, Thai labels, responsive cards, visible last update, sort, search, empty/error/loading states, explicit refresh. Accessible native dialogs for login and editor; delete confirmation. Missing configuration shows clearly labeled read-only sample data, never pretends to save. Keep entered form values if a write fails. Upload first then save record; clean uploaded image if record save fails. Cleanup failure is a warning, not a fake save failure.

## Delivery and constraints
Source, SQL bootstrap, tests, Netlify configuration, .env.example and Thai step-by-step README. Actual Supabase project and Netlify account are not connected; do not claim production deployed. Owner creates project/user, runs SQL, fills two public environment values and deploys. No secrets requested in chat.

## Verification
Node unit tests for numeric/image validation, search, auth/role writes and failed write cleanup; React interaction tests for visitor/search/editor; production build. SQL RLS integration script supplied for execution on owner's Supabase project; local runtime may lack PostgreSQL/browser. Explicitly report what cannot run.
