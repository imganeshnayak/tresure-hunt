# Treasure Hunt

A premium, mission-based treasure hunt application with a minimal dark theme and amber-gold accents.

## Structure
- `/frontend`: React + Vite application (Frontend)
- `/backend`: Node.js + Express + MongoDB (Backend)

## Features
- mission-based progression with QR code unlocking.
- Anti-cheat system (sequential level locking).
- Admin Dashboard for managing landmarks, decoys, and team progress.
- Premium UI with Framer Motion animations.

## Deployment
- **Frontend**: Hosted on Netlify
- **Backend**: Hosted on Render

## Troubleshooting
### QR Scanner Not Working?
1. **HTTPS Required**: Browser security requires the site to be served over `HTTPS` to access the camera.
2. **Camera Permissions**: Ensure you have granted camera access to the browser when prompted.
3. **Back Camera**: The scanner is optimized to use the rear-facing (environment) camera on mobile devices.
