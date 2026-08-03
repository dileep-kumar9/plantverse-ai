# PlantVerse AI feature status

## Working in this codebase
- Gemini image analysis for plant, soil, land, fruit, flower, tree and pest categories
- Scene classification including road/non-growing-surface warnings
- Camera/gallery uploads, image preview and structured results
- Video upload plus narration analysis for small files
- Global voice/text assistant and context-aware follow-up chat
- Gemini-backed contextual translation and text-to-speech
- Plant Memory, saved reports, local chat history, readings, reminders and settings
- Growing-space switches: pot, terrace, field and empty land
- Soil meter manual readings and device-model verification
- Marketplace, cart, local checkout, orders and simulated tracking events
- Local community posting
- Dark mode and responsive navigation

## Requires external credentials/services for live production
- Firebase Authentication, Firestore, Storage and Cloud Messaging
- Live weather and geolocation provider
- Payment gateway, invoice/tax provider and courier webhooks
- Vendor-specific Bluetooth/Wi-Fi/cloud device protocols
- Verified agronomy database and local expert network
- Moderation, abuse prevention, analytics and monitoring

## Important technical limitations
- A photo cannot measure exact soil moisture. Use a sensor or manual meter reading.
- Universal direct connection to every soil meter is impossible without vendor protocols; manual entry remains universal.
- AI pesticide/fertilizer guidance must be checked against product labels, local law and qualified experts.
