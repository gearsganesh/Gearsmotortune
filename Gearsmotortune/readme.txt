GEARSMOTORTUNE V5 - CLEAN NETLIFY DEPLOYMENT
===============================================

FIXES IN THIS VERSION
----------------------
1. Logo:
   - Converted the supplied black-background logo to a real transparent PNG.
   - Removed the visible black rectangle around the logo.
   - Kept the orange Gearsmotortune artwork.

2. Locations:
   - Removed the duplicate location cards from the Reviews section.
   - Location information now appears only in the dedicated Locations section.

3. Footer:
   - Removed the final "Services" footer column that incorrectly contained staff contacts.
   - Staff contacts remain available in the Contact section.

4. Preserved:
   - Netlify enquiry form fix.
   - Google reviews section.
   - Two location cards and Google Maps buttons.
   - Contacts and WhatsApp button.
   - Existing site design and custom domain.

DEPLOY TO NETLIFY
-----------------
1. Extract this ZIP.
2. Open the EXISTING Gearsmotortune project in Netlify.
3. Go to Deploys.
4. Drag the entire extracted folder into the deploy area.
5. Wait for the production deployment to complete.
6. Open https://www.gearsmotortune.com in an incognito/private browser.

IMPORTANT
---------
- Upload the whole folder, not only index.html.
- Do not create a new Netlify project.
- Do not change GoDaddy DNS.
- Keep index.html and gearsmotortune-logo.png in the same folder.


V6 UPDATE - ENQUIRY REFERRAL TRACKING
- Added mandatory "How did you hear about us / Referred by?" dropdown.
- Added optional "Referred by (Name / Company)" field.
- Both fields are submitted to the existing Netlify form named automotive-enquiry.
- No DNS changes are required.

MULTIPLE EMAIL RECIPIENTS
Netlify can send form notifications to more than one email recipient. In the Netlify dashboard:
Project > Project configuration > Notifications > Emails and webhooks > Form submission notifications.
Add an email notification for the automotive-enquiry form and add the desired recipient email addresses according to the current Netlify UI.
Keep Netlify Forms enabled and do not remove the existing form-name field.

After uploading this V6 deployment, submit one test enquiry and confirm the new referral fields appear in:
Project > Forms > automotive-enquiry > Submissions.


V7 additions:
- Check-engine style SVG favicon (browser tab icon).
- Subtle scanline/glow/shine/float animations.
- User-controlled synthesized engine sound using Web Audio API; no external audio file.
- Sound starts only after the visitor taps the sound button, respecting browser autoplay restrictions.

V8 changes:
- Replaced the favicon with the supplied check-engine symbol image.
- Added stronger, visible hero entrance/zoom/sweep animations.
- Added clearly visible scroll-reveal animations with staggered timing.
- Added hover lift/shine/glow effects to cards and CTAs.
- Added an "Engineering mode active" animated status badge.
- Replaced the synthetic sound with a user-triggered YouTube embed for the exact video supplied by the user:
  https://www.youtube.com/watch?v=kuI-wbTE5PU
- The sound player is opened by the floating speaker button and starts only after the visitor interacts, to comply with browser autoplay restrictions.

V8.1 changes:
- Favicon is now a circular black icon with the orange check-engine symbol centered inside.
- Replaced the incorrect floating WhatsApp appearance with a proper green WhatsApp icon/button.
- WhatsApp button opens a chat to +91 8072432675.
- Sound button is positioned separately above WhatsApp so the controls do not overlap.
