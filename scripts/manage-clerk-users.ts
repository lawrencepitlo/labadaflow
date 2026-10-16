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

interface DemoAccount {
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER'
  password: string
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'lawrence.pitlo@urios.edu.ph',
    firstName: 'Lawrence',
    lastName: 'Pitlo',
    role: 'ADMIN',
    password: 'LabadaFlow2026!',
  },
  {
    email: 'marites.staff@labadaflow.ph',
    firstName: 'Marites',
    lastName: 'Delos Reyes',
    role: 'STAFF',
    password: 'LabadaFlow2026!',
  },
  {
    email: 'cardo.staff@labadaflow.ph',
    firstName: 'Cardo',
    lastName: 'Dalisay',
    role: 'STAFF',
    password: 'LabadaFlow2026!',
  },
  {
    email: 'juan.delacruz@labadaflow.ph',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    role: 'CUSTOMER',
    password: 'LabadaFlow2026!',
  },
  {
    email: 'labada.portal47@gmail.com',
    firstName: 'Demo',
    lastName: 'Customer',
    role: 'CUSTOMER',
    password: 'LabadaFlow2026!',
  },
]

async function main() {
  loadEnv()
  const clerkKey = process.env.CLERK_SECRET_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!clerkKey || !supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const clerkHeaders = {
    Authorization: `Bearer ${clerkKey}`,
    'Content-Type': 'application/json',
  }

  console.log('--- Provisioning Demo Users in Clerk & Supabase ---')

  for (const account of DEMO_ACCOUNTS) {
    console.log(`\nProcessing ${account.email} (${account.role})...`)

    // 1. Check Clerk
    const searchRes = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(account.email)}`,
      { headers: clerkHeaders }
    )
    const existingUsers = (await searchRes.json()) as any[]

    let clerkId: string

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      clerkId = existingUsers[0].id
      console.log(`  Found existing Clerk user: ${clerkId}`)
      // Ensure metadata role matches
      await fetch(`https://api.clerk.com/v1/users/${clerkId}/metadata`, {
        method: 'PATCH',
        headers: clerkHeaders,
        body: JSON.stringify({
          public_metadata: { role: account.role },
        }),
      })
    } else {
      console.log(`  Creating new Clerk user...`)
      const createRes = await fetch('https://api.clerk.com/v1/users', {
        method: 'POST',
        headers: clerkHeaders,
        body: JSON.stringify({
          first_name: account.firstName,
          last_name: account.lastName,
          email_address: [account.email],
          password: account.password,
          public_metadata: { role: account.role },
        }),
      })
      const created = (await createRes.json()) as any
      if (created.errors) {
        console.warn(`  Clerk creation warning: ${JSON.stringify(created.errors)}`)
        clerkId = `clerk-demo-${account.firstName.toLowerCase()}-${account.role.toLowerCase()}`
      } else {
        clerkId = created.id
        console.log(`  Created Clerk user ${clerkId}`)
      }
    }

    // 2. Sync to Supabase `users` table
    const fullName = `${account.firstName} ${account.lastName}`.trim()
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', account.email)
      .maybeSingle()

    if (dbUser) {
      await supabase
        .from('users')
        .update({
          role: account.role,
          full_name: fullName,
          clerk_user_id: clerkId,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dbUser.id)
      console.log(`  Updated Supabase users row: ${dbUser.id}`)
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from('users')
        .insert({
          clerk_user_id: clerkId,
          full_name: fullName,
          email: account.email,
          role: account.role,
          is_active: true,
        })
        .select('id')
        .single()

      if (insErr) {
        console.error(`  Error creating Supabase user: ${insErr.message}`)
      } else {
        console.log(`  Inserted into Supabase users table: ${inserted.id}`)
      }
    }

    // 3. If CUSTOMER role, link to `customers` table
    if (account.role === 'CUSTOMER') {
      const { data: existingCust } = await supabase
        .from('customers')
        .select('id')
        .eq('email', account.email)
        .maybeSingle()

      if (existingCust) {
        await supabase
          .from('customers')
          .update({
            clerk_user_id: clerkId,
            full_name: fullName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingCust.id)
        console.log(`  Linked existing customer record: ${existingCust.id}`)
      } else {
        const { data: newCust, error: custErr } = await supabase
          .from('customers')
          .insert({
            clerk_user_id: clerkId,
            full_name: fullName,
            email: account.email,
          })
          .select('id')
          .single()

        if (custErr) {
          console.error(`  Error creating customer record: ${custErr.message}`)
        } else {
          console.log(`  Created new customer record: ${newCust.id}`)
        }
      }
    }
  }

  console.log('\n--- All demo accounts ready for testing! ---')
}

main().catch(console.error)
