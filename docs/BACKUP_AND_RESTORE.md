# Firestore backup and restore

The admin console can request a Firestore managed export to `FIRESTORE_BACKUP_BUCKET`. When `ENABLE_SCHEDULED_BACKUPS=true`, `/api/cron/backups` requests a daily export using the same controlled implementation. This requires billing, IAM import/export permissions and bucket write access. Each request is audit logged and stored in `backupRequests`.

A backup is not complete until the Google Cloud long-running operation reports success and the bucket contains the export metadata. Configure object retention/lifecycle policies and access logging.

Restoration is intentionally not exposed as a one-click browser action. Use a controlled maintenance window, a separate staging project for validation and the official Firestore import operation. Record the export URI, operator, approval, start/end time, validation results and rollback decision. Perform a restore drill before launch and at a documented interval thereafter.


Scheduled requests are not proof of completed backups. Monitor the Google Cloud long-running operation, alert on failure, verify exported objects and periodically restore into an isolated staging project. Keep `ENABLE_SCHEDULED_BACKUPS=false` until those controls exist.
