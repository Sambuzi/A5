/*
Batch uploader for exercise images to Supabase Storage and DB.

Usage:
  1. Install dependencies: `npm install @supabase/supabase-js dotenv`
  2. Set env vars in a `.env` file or export in shell:
     SUPABASE_URL=<your supabase url>
     SUPABASE_SERVICE_ROLE_KEY=<your service role key (required to update DB)>
     BUCKET_NAME=exercise-images
  3. Edit `scripts/exercise-image-map.json` to map exercise `id` (or `title`) to a local file path.
  4. Run: `node scripts/upload_exercise_images.js` from project root.

Notes:
- This script requires the Supabase service role key to update the `exercises` table.
- It uploads each file to `BUCKET_NAME/{exerciseId}/{filename}` and then updates `exercises.image_url` with the public URL.
- If your bucket is private, you can modify the script to create signed URLs instead of public URLs.
*/

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = process.env.BUCKET_NAME || 'exercise-images'

if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY){
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const mapFile = path.join(__dirname, 'exercise-image-map.json')
if(!fs.existsSync(mapFile)){
  console.error('Mapping file not found:', mapFile)
  process.exit(1)
}

const mappings = JSON.parse(fs.readFileSync(mapFile, 'utf8'))

async function uploadOne(entry){
  // entry: { id: 'uuid' , title: 'Push-up', file: './images/pushup.jpg' }
  const localPath = path.resolve(path.join(__dirname, entry.file))
  if(!fs.existsSync(localPath)){
    console.warn('File not found, skipping:', localPath)
    return
  }
  const filename = path.basename(localPath)
  const destPath = `${entry.id || sanitize(entry.title)}/${Date.now()}_${filename}`

  console.log('Uploading', localPath, '->', destPath)
  try{
    const fileBuffer = fs.readFileSync(localPath)
    const { data: uploadData, error: uploadError } = await supabase.storage.from(BUCKET).upload(destPath, fileBuffer, { cacheControl: '3600', upsert: false })
    if(uploadError){
      console.error('Upload error for', localPath, uploadError.message)
      return
    }
    // get public URL
    const { data: urlData, error: urlErr } = supabase.storage.from(BUCKET).getPublicUrl(destPath)
    if(urlErr){ console.warn('getPublicUrl error', urlErr.message) }
    const publicUrl = urlData?.publicUrl || ''

    // update exercises table (prefer id, fallback to title)
    if(entry.id){
      const { error: dbErr } = await supabase.from('exercises').update({ image_url: publicUrl }).eq('id', entry.id)
      if(dbErr) console.error('DB update error for id', entry.id, dbErr.message)
      else console.log('Updated exercise', entry.id)
    }else if(entry.title){
      const { error: dbErr } = await supabase.from('exercises').update({ image_url: publicUrl }).ilike('title', entry.title).limit(1)
      if(dbErr) console.error('DB update error for title', entry.title, dbErr.message)
      else console.log('Updated exercise by title', entry.title)
    }
  }catch(e){
    console.error('Unexpected error uploading', localPath, e.message)
  }
}

function sanitize(s){
  return String(s || '').toLowerCase().replace(/[^a-z0-9-_]/g,'-').replace(/-+/g,'-')
}

;(async ()=>{
  for(const entry of mappings){
    // small validation
    if(!entry.file){ console.warn('Skipping mapping without file', entry); continue }
    await uploadOne(entry)
  }
  console.log('Done')
})()
