# Notice Board Firestore rules

The complete merged rules supplied for this dev package are in
`firestore.rules` at the package root.

The previous project rules used this path and field schema:

- `groups/{groupId}/notices/{noticeId}`
- `createdBy`, `createdByName`

The current app uses:

- `groups/{groupId}/reminders/{noticeId}`
- `senderId`, `senderName`, `isPinned`, `updatedAt`

The Notice Board block has therefore been replaced with a `reminders` match
that validates the exact app schema. Do not keep the old `notices` block as an
alternative broad write path.

## Permission behavior

- Missing or false `noticeBoardMemberAccess`: only the authoritative group
  admin in `groups/{groupId}.adminId` can post, edit, unpin, or delete.
- True `noticeBoardMemberAccess`: members can post and can unpin or delete only
  notices whose `senderId` is their own UID.
- A member can never edit notice text or transfer ownership.
- An admin can edit, unpin, or delete any group notice.
- Every group member can read the board.

The merged file also adds read-only access to the signed-in user's own
`groups/{groupId}/members` collection. The Settings page queries that
collection before rendering Admin Controls; without this read rule the Notice
Board toggle can remain hidden because the members query is denied. This does
not add create, update, or delete permission for member documents.

## Deploy

From the project root, after reviewing the merged file:

```powershell
firebase deploy --only firestore:rules
```

Firestore rules apply to both development and production clients that point at
the same Firebase project. Running `npm run dev` does not bypass them.

## Existing-rule security note

The existing `users/{userId}` update rule still lets a signed-in user update
most fields in their own user document, including `groupId` and `isAdmin`.
This package preserves that behavior to avoid breaking the project's current
join/leave/profile flows. Group-level Notice Board admin authorization does not
trust `users/{uid}.isAdmin`; it uses `groups/{groupId}.adminId` instead.

Before a public production launch, the user-document update rule and the
group-membership lifecycle should be hardened together and tested against
signup, join, leave, removal, and admin-transfer flows.
