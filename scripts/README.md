Upload exercise images script

Purpose
- Batch upload local images to Supabase Storage and update `exercises.image_url` in the DB.

Setup
1. Install dependencies (in project root):
   npm install @supabase/supabase-js dotenv

2. Create a `.env` file in project root with these variables:
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   BUCKET_NAME=exercise-images

3. Prepare your images in `scripts/images/` (create the folder) and edit `scripts/exercise-image-map.json` to map exercises to files.
   - Prefer using `id` (uuid) for exact match. If `id` is empty, the script will attempt to match by `title` (case-insensitive, ilike).

Run
  node scripts/upload_exercise_images.js

Notes
- This script uses the Supabase "service role" key to update the database. Keep that key secret and do NOT commit it to source control.
- If your bucket is private, replace `getPublicUrl` usage with `createSignedUrl` in the script and store the signed URL or adapt your frontend to request signed URLs.
