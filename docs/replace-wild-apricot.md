# Bring your Wild Apricot member history

Source checked 26 September 2026: [Wild Apricot: exporting members and contacts](https://gethelp.wildapricot.com/en/articles/152-exporting-members-and-contacts).

1. In Wild Apricot, go to Members, Summary, Export all. For other contacts, use Contacts, List, Export. Choose CSV and include User ID, First name, Last name, Organization, Email, Membership enabled, Membership level, Membership status, Member since, Renewal due, Archived, Subscribed to emails and Opt-in status. Include custom fields you want to retain.
2. Keep the untouched export. Select ISO dates if available in your organisation settings. Otherwise pass the actual date order explicitly. Do not guess whether 03/04 means March or April.
3. Use a fresh DATA_DIR, then `npm run migrate`. Do not seed your real installation.
4. Test the export: `npm run membership -- import wild-apricot members.csv --dry-run --date-order=DMY`.
5. Import it: `npm run membership -- import wild-apricot members.csv --date-order=DMY`.
6. Compare member counts, levels and renewal dates with Wild Apricot. Set each imported level's actual annual fee, currency and CPD policy. Review consent and committee records before a renewal run.

| Export field | Destination |
|---|---|
| User ID | Stable external_id; repeat imports update that source record |
| First name, Last name | Member name; organisation used for organisation-only contacts |
| Organization, Email | Organisation and email |
| Membership level | Level record, initially zero fee until reviewed |
| Membership status | Active, lapsed, pending or suspended; all three Pending variants map to pending |
| Membership enabled, Archived | Non-members become contacts; archived wins |
| Member since, Renewal due | Validated dates |
| Subscribed to emails plus Opt-in status | Marketing consent only when both affirm permission |
| Every original column | source_data for later mapping |

Unknown statuses, duplicate IDs, duplicate headers, invalid dates and malformed CSV reject the whole file without partial writes. Names never replace the stable source ID. Reimport refreshes the fields above from the source, so take a backup before reimporting after local edits. Locally entered membership consent and contact notes are retained. Empty renewal dates are retained as unknown, including lifetime memberships; they are not invented.

The free importer handles the standard contact/member CSV in one command. XLS and XML need conversion to CSV. It does not invent invoice history from the Balance column or individual gifts from Total donated. Those columns, bundle links, groups and custom fields remain in source_data until mapped into operational records. Events, registrations, invoices, receipts and donations need separate exports and mapping. The fixture is a synthetic example using the vendor's documented headers, not a customer export.

Website pages, passwords, recurring payment authority, automated emails, photographs and file attachments do not transfer through this importer. Attachment columns contain vendor file IDs, not the files. Enterprise DNA can map separate exports and build the joining forms, member portal and payment-provider connections into your version. Keep payment processing with your provider. Reconcile totals with your accountant before retiring the old system.

`npm run membership -- export backup.json` exports every domain record, source column and audit entry as a consistent JSON snapshot. This is a portable archive, not an automatic restore command. Test the installation's database backup and restore procedure separately.
