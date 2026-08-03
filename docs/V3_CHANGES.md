# PlantVerse v3 changes

## Smart Scan

- Analysis category is chosen once; all category cards disappear after selection.
- One evidence control offers camera, photos/gallery, this device, video, web link, and public Google Drive link.
- Camera view supports front/rear switching, microphone on/off, still capture, and video recording.
- Captured and selected images begin the selected Gemini inspection automatically.
- Voice recognition automatically submits after the final transcript is recognized.
- Video capture/upload automatically runs the video inspection endpoint.
- The selected category is included in every image, video, and voice request.
- The progress stepper uses four clear stages and suppresses browser list numbering.

## Dashboard

- Removed the second floating assistant from the home page; the global assistant is the single persistent assistant.
- Balanced Garden Health spacing and stat cards.
- Replaced repetitive Quick Action descriptions with task-specific guidance.
- Kept a single Recent Activity section.

## Global assistant

- Replaced the plain microphone button with a PlantVerse AI sparkle button.
- Shows an animated waveform while listening.
- Automatically searches after speech recognition completes.
- Provides voice, camera, typing, send, and read-aloud controls.

## External-service notes

- Private Google Drive Picker browsing still requires Google OAuth and Picker credentials. Public Drive links work through the image import endpoint.
- Browser camera, microphone, and speech recognition depend on HTTPS, browser support, and user permission.
- Direct Bluetooth meter connectivity still requires each vendor's protocol; manual readings remain universal.
