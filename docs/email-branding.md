# Zayt W Mouneh email branding

## Purpose

This folder provides the production-ready visual treatment for Zayt W Mouneh authentication emails. The templates intentionally use email-safe table markup, inline styles, a hosted raster logo, and one clear call to action.

## Brand treatment

- Sender display name: **Zayt W Mouneh**
- Preferred sender mailbox: a dedicated Zayt W Mouneh mailbox on the verified sending domain
- Logo used inside email: `https://zaytwmouneh.com/assets/email-logo.jpg`
- Palette: deep green `#082d13`, brand green `#0f4a20`, gold `#d3a323`, cream `#f7f0e2`, paper `#fffaf0`
- Layout width: 620px maximum, fluid on mobile
- Templates: confirmation, recovery, magic link, email change, invite

## Recommended subjects

- Confirmation: **Confirm your Zayt W Mouneh email**
- Recovery: **Reset your Zayt W Mouneh password**
- Magic link: **Your secure Zayt W Mouneh sign-in link**
- Email change: **Confirm your new Zayt W Mouneh email**
- Invite: **You’re invited to Zayt W Mouneh**

## Hosted Supabase activation

The production Supabase project was created after the June 3, 2026 Free-tier email-template restriction. On Free tier, custom Auth templates require a custom SMTP provider instead of Supabase's default sender.

After a free custom SMTP sender is connected in Supabase Auth:

1. Set the sender display name to **Zayt W Mouneh**.
2. Set the sender address to the dedicated Zayt W Mouneh mailbox.
3. Paste each file in `supabase/templates/` into its matching Auth template and use the subject above.
4. Send real confirmation and recovery tests to Gmail and at least one non-Gmail inbox.
5. Verify desktop and mobile rendering, button links, spam placement, and sender identity.

## Sender profile picture / inbox avatar

The avatar shown beside a message is not controlled by email HTML. It is controlled by the sending identity and the receiving email client.

For a Google/Gmail sender, set the Zayt W Mouneh logo as the Google Account profile photo of the actual automated sender account. If a domain mailbox is used instead, authenticated domain branding such as BIMI may be added later where supported, but it is not required for the HTML email design.

Do not treat the in-body logo as a substitute for configuring the sender identity.
