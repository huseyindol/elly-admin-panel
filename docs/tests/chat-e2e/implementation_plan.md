# Chat System End-to-End Test Plan

We will test the Chat / WebSocket system on `https://admin.huseyindol.com/login` for all 4 user roles concurrently using Playwright multi-context browser automation. This will run 4 independent, isolated browser sessions representing the 4 user accounts, allowing us to perform real-time interactions, verify role-based visibility, delete buttons, notifications, and file sharing.

## Credentials & Roles

| Username        | Password | Tenant ID | Login Type | Role        | Level |
| :-------------- | :------- | :-------- | :--------- | :---------- | :---- |
| `huseyindoldev` | `123123` | `tenant1` | `admin`    | Super Admin | 4     |
| `aslantibet`    | `123123` | `tenant1` | `admin`    | Admin       | 3     |
| `test1`         | `123456` | `tenant1` | `admin`    | Editor      | 2     |
| `test2`         | `123456` | `tenant1` | `admin`    | Viewer      | 1     |

---

## Test Cases & Scenarios

### Case 1: Super Admin Group Visibility (Role-Based Isolation)

- **Action**: Super Admin creates a group named `SuperAdminPrivateGroup`.
- **Expected**:
  - Super Admin sees `SuperAdminPrivateGroup` in their sidebar.
  - Admin, Editor, and Viewer **do not** see the group in their sidebars.

### Case 2: Group Visibility Hierarchy

- **Action**:
  1. Viewer creates `ViewerGroup`.
  2. Editor creates `EditorGroup`.
  3. Admin creates `AdminGroup`.
- **Expected**:
  - Viewer can see `ViewerGroup`. Editor, Admin, Super Admin (higher levels) can also see it.
  - Editor can see `EditorGroup` and `ViewerGroup`. Viewer (lower level) **cannot** see `EditorGroup`.
  - Admin can see `AdminGroup`, `EditorGroup`, and `ViewerGroup`. Editor and Viewer (lower levels) **cannot** see `AdminGroup`.
  - Super Admin can see all of these groups.

### Case 3: Inviting All Levels to a Group

- **Action**: Admin creates a group `AdminInviteGroup` and invites Super Admin, Editor, and Viewer to it.
- **Expected**:
  - Invitation is successful.
  - All invited users receive the invitation and see the group in their sidebar.

### Case 4: Inactive Group Notifications

- **Action**:
  1. Super Admin and Admin are in `AdminInviteGroup`.
  2. Admin is looking at a different group (e.g. `ViewerGroup`).
  3. Super Admin sends a message `"Notification Test Message"` to `AdminInviteGroup`.
- **Expected**:
  - Admin receives a real-time notification (e.g. unread count badge increment or toast notification) for `AdminInviteGroup` since it is inactive on their screen.

### Case 5: Delete Button for Group Owner

- **Action**: Editor enters the chat for `EditorGroup` (which they created/own).
- **Expected**:
  - A "Delete" (Sil) button is visible to Editor.

### Case 6: Delete Button for Super Admin in All Groups

- **Action**: Super Admin enters the chat for `EditorGroup` (owned by Editor).
- **Expected**:
  - A "Delete" (Sil) button is visible to Super Admin even though they do not own the group.

### Case 7: Real-Time Deletion Synchronization

- **Action**: Editor deletes `EditorGroup`.
- **Expected**:
  - `EditorGroup` disappears from Super Admin, Admin, and Editor screens instantly.

### Case 8: File Upload & Transmission

- **Action**: Admin sends a file (e.g. a small text file or dummy image) in `AdminInviteGroup`.
- **Expected**:
  - The file is successfully uploaded and sent.
  - Other group members (e.g., Viewer) can view, download, or see the file attachment.

---

## Verification Plan

### Automated Execution via Playwright Script

We will write a Node.js script `chat-test.js` in the scratch directory `/Users/huseyindol/.gemini/antigravity-ide/brain/77be9afd-da3c-4322-8d37-0097b038114f/scratch/` that:

1. Initializes Playwright.
2. Logins into `https://admin.huseyindol.com/login` for the 4 users simultaneously.
3. Steps through the test cases sequentially.
4. Captures screenshots for each scenario to document UI state.
5. Saves logs of actions and assertions.

### Execution Command

```bash
# In the scratch directory
npm init -y
npm install playwright
node chat-test.js
```
