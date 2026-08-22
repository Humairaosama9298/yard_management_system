# Yard Management System

Container yard management app for Karachi off-dock depot operations, built with Next.js + Supabase.

## Features
- Dashboard — live stock snapshot
- Gate-In — container arrival, damage status, EIR generation
- Gate-Out — container release, EIR generation
- Tracking — search by Container No / EIR No, full event history
- Yard Slots — block/slot layout, container stacking
- Loading Program (Bookings) — vessel booking management
- Block Container — hold/release containers per line
- Masters — shipping lines, consignees, transporters, terminals, yards
- Reports — size-wise stock report (in-yard, dispatched, damaged)

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. `.env.local` already contains your Supabase project credentials
   (project: yard-management-system, region: ap-south-1).

3. Run locally:
   ```
   npm run dev
   ```
   Open http://localhost:3000

## Database
Supabase project: `yard-management-system`
Tables: companies, terminals, yards, yard_slots, vessels, containers,
gate_entries, damage_reports, bookings, block_containers

## First-time use
1. Go to **Masters** → add your shipping lines, terminals, yards, and
   companies (consignee/shipper/transporter/clearing agent) first.
2. Then use **Gate-In** to receive containers.
3. Use **Yard Slots** to add blocks/slots and assign containers.
4. Use **Gate-Out**, **Loading Program**, **Block Container**, **Tracking**,
   and **Reports** as needed.

## Note on security
Database currently allows public read/write (no login system yet) — 
suitable for internal/testing use. Add authentication before production
use with real company data.
