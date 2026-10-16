import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  const path = resolve(process.cwd(), '.env.local')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([^#=]+)=(.*)\s*$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
    }
  }
}

const ADMIN_ACCOUNTS = [
  'lawrence.pitlo@urios.edu.ph',
  'lawrencepitlo06@gmail.com',
  'michael.banas@urios.edu.ph',
  'maykelbanas.sch@gmail.com',
  'kennnnnnnnnneth1@gmail.com',
  'labada.admin47@gmail.com',
]

async function main() {
  loadEnv()
  const clerkKey = process.env.CLERK_SECRET_KEY!
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(url, serviceKey)

  const headers = {
    Authorization: `Bearer ${clerkKey}`,
    'Content-Type': 'application/json',
  }

  console.log('--- Ensuring All Developer Accounts are ADMIN in Clerk & Supabase ---')

  const res = await fetch('https://api.clerk.com/v1/users?limit=50', { headers })
  const clerkUsers = (await res.json()) as Array<{
    id: string
    first_name?: string
    last_name?: string
    email_addresses?: Array<{ email_address: string }>
  }>

  for (const email of ADMIN_ACCOUNTS) {
    const found = clerkUsers.find(u =>
      u.email_addresses?.some((e: { email_address: string }) => e.email_address?.toLowerCase() === email.toLowerCase())
    )

    if (found) {
      console.log(`Found Clerk user for ${email}: ${found.id}`)
      // Update Clerk public_metadata
      await fetch(`https://api.clerk.com/v1/users/${found.id}/metadata`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ public_metadata: { role: 'ADMIN' } }),
      })
      console.log(`  Updated Clerk metadata to ADMIN`)

      // Update or insert into Supabase `users`
      const fullName = `${found.first_name || ''} ${found.last_name || ''}`.trim() || email
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', found.id)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('users')
          .update({
            role: 'ADMIN',
            full_name: fullName,
            email,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
        console.log(`  Updated existing Supabase user ${existing.id} to ADMIN`)
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from('users')
          .insert({
            clerk_user_id: found.id,
            full_name: fullName,
            email,
            role: 'ADMIN',
            is_active: true,
          })
          .select('id')
          .single()

        if (insErr) {
          console.error(`  Error inserting ${email} into Supabase:`, insErr.message)
        } else {
          console.log(`  Inserted new Supabase user ${inserted.id} as ADMIN`)
        }
      }
    } else {
      console.log(`Clerk user not yet created for ${email}`)
    }
  }

  console.log('\n--- Complete! ---')
}

main().catch(console.error)
