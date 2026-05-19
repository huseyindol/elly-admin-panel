import { chromium, Browser, Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots')
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

// Write a dummy file to upload
const DUMMY_FILE_PATH = path.join(__dirname, 'test-file.txt')
fs.writeFileSync(
  DUMMY_FILE_PATH,
  'Hello, this is a test file for the chat system test case 8!',
)

const credentialsList = [
  {
    role: 'Super Admin',
    username: 'huseyindoldev',
    password: '123123',
    tenantId: 'tenant1',
  },
  {
    role: 'Admin',
    username: 'aslantibet',
    password: '123123',
    tenantId: 'tenant1',
  },
  {
    role: 'Editor',
    username: 'test1',
    password: '123456',
    tenantId: 'tenant1',
  },
  {
    role: 'Viewer',
    username: 'test2',
    password: '123456',
    tenantId: 'tenant1',
  },
]

interface UserSession {
  role: string
  page: Page
  userId: number | null
  lastAlert: string | null
}

async function loginUser(
  browser: Browser,
  creds: (typeof credentialsList)[0],
): Promise<UserSession> {
  const context = await browser.newContext()
  const page = await context.newPage()

  const session: UserSession = {
    role: creds.role,
    page,
    userId: null,
    lastAlert: null,
  }

  // Resilient dialog handler
  page.on('dialog', async dialog => {
    const msg = dialog.message()
    console.log(`[${creds.role} Dialog] ${dialog.type()}: "${msg}"`)
    session.lastAlert = msg
    await dialog.accept() // Accept confirmations to proceed with deletions
  })

  console.log(`[${creds.role}] Navigating to login page...`)
  await page.goto('https://admin.huseyindol.com/login')

  console.log(`[${creds.role}] Filling inputs...`)
  await page.fill('#usernameOrEmail', creds.username)
  await page.fill('#tenantId', creds.tenantId)
  await page.fill('#password', creds.password)

  console.log(`[${creds.role}] Submitting...`)
  await page.click('button[type="submit"]')

  console.log(`[${creds.role}] Waiting for dashboard...`)
  await page.waitForURL('**/dashboard', { timeout: 25000 })
  console.log(`[${creds.role}] Logged in successfully!`)

  // Wait a moment for localStorage to settle
  await page.waitForTimeout(2000)

  // Get user ID
  const storeStr = await page.evaluate(() =>
    localStorage.getItem('user-storage'),
  )
  if (storeStr) {
    try {
      const parsed = JSON.parse(storeStr)
      session.userId = parsed.state?.id ?? null
    } catch (e) {
      console.error(`[${creds.role}] Error parsing user-storage:`, e)
    }
  }
  console.log(`[${creds.role}] Extracted User ID: ${session.userId}`)

  console.log(`[${creds.role}] Navigating to chat...`)
  await page.goto('https://admin.huseyindol.com/chat')
  await page.waitForSelector('text=Konuşmalar', { timeout: 25000 })
  console.log(`[${creds.role}] Arrived at chat page.`)

  return session
}

async function createGroup(page: Page, groupName: string) {
  console.log(`Creating group "${groupName}"...`)
  await page.click('button[aria-label="Yeni grup oluştur"]')
  await page.waitForSelector('input[placeholder="Grup adı girin"]', {
    state: 'visible',
  })
  await page.fill('input[placeholder="Grup adı girin"]', groupName)
  await page.click('button:has-text("Oluştur")')

  // Wait until group list updates and group is visible in sidebar
  await page.waitForSelector(`button:has-text("${groupName}")`, {
    timeout: 15000,
  })
  console.log(`Group "${groupName}" created and visible in sidebar.`)
}

async function runTests() {
  // Launch browser with headless: false and slowMo: 800 to make the actions visible to you
  const browser = await chromium.launch({ headless: false, slowMo: 800 })
  console.log('Browser launched in headful (visible) mode.')

  const userSessions: Record<string, UserSession> = {}
  const testResults: Record<string, string> = {}

  try {
    // 1. Login all users in parallel
    const logins = await Promise.all(
      credentialsList.map(async creds => {
        try {
          return await loginUser(browser, creds)
        } catch (e) {
          console.error(`Failed to login user ${creds.role}:`, e)
          throw e
        }
      }),
    )

    for (const login of logins) {
      userSessions[login.role] = login
    }

    const saSession = userSessions['Super Admin']
    const adminSession = userSessions['Admin']
    const editorSession = userSessions['Editor']
    const viewerSession = userSessions['Viewer']

    const sa = saSession.page
    const admin = adminSession.page
    const editor = editorSession.page
    const viewer = viewerSession.page

    const suffix = Math.floor(Math.random() * 10000)
    const groupNameSA = `GroupSA_${suffix}`
    const groupNameV = `GroupV_${suffix}`
    const groupNameE = `GroupE_${suffix}`
    const groupNameA = `GroupA_${suffix}`
    const groupNameInvite = `GroupInvite_${suffix}`

    // --- CASE 1: Super Admin group isolation ---
    console.log('\n--- STARTING TEST CASE 1: Super Admin group isolation ---')
    await createGroup(sa, groupNameSA)
    await sa.screenshot({
      path: path.join(SCREENSHOT_DIR, 'case1_superadmin_created.png'),
    })

    await sa.waitForTimeout(2000) // Wait for WS broadcast
    const adminHasSA = await admin
      .locator(`button:has-text("${groupNameSA}")`)
      .count()
    const editorHasSA = await editor
      .locator(`button:has-text("${groupNameSA}")`)
      .count()
    const viewerHasSA = await viewer
      .locator(`button:has-text("${groupNameSA}")`)
      .count()

    const c1Pass = adminHasSA === 0 && editorHasSA === 0 && viewerHasSA === 0
    testResults['Case 1: Super Admin group isolation'] = c1Pass
      ? 'PASS'
      : 'FAIL'
    console.log(`Result: ${c1Pass ? 'PASS' : 'FAIL'}`)
    console.log(`- Super Admin sees: YES`)
    console.log(`- Admin sees: ${adminHasSA > 0 ? 'YES' : 'NO'}`)
    console.log(`- Editor sees: ${editorHasSA > 0 ? 'YES' : 'NO'}`)
    console.log(`- Viewer sees: ${viewerHasSA > 0 ? 'YES' : 'NO'}`)

    // --- CASE 2: Group visibility hierarchy ---
    console.log('\n--- STARTING TEST CASE 2: Group visibility hierarchy ---')

    // Viewer creates group (Level 1)
    await createGroup(viewer, groupNameV)
    await viewer.waitForTimeout(2000)
    const saHasV = await sa.locator(`button:has-text("${groupNameV}")`).count()
    const adminHasV = await admin
      .locator(`button:has-text("${groupNameV}")`)
      .count()
    const editorHasV = await editor
      .locator(`button:has-text("${groupNameV}")`)
      .count()
    const viewerHasV = await viewer
      .locator(`button:has-text("${groupNameV}")`)
      .count()

    const c2VPass =
      saHasV > 0 && adminHasV > 0 && editorHasV > 0 && viewerHasV > 0
    console.log(
      `Viewer Group Visibility (everyone should see): ${c2VPass ? 'PASS' : 'FAIL'}`,
    )

    // Editor creates group (Level 2)
    await createGroup(editor, groupNameE)
    await editor.waitForTimeout(2000)
    const saHasE = await sa.locator(`button:has-text("${groupNameE}")`).count()
    const adminHasE = await admin
      .locator(`button:has-text("${groupNameE}")`)
      .count()
    const editorHasE = await editor
      .locator(`button:has-text("${groupNameE}")`)
      .count()
    const viewerHasE = await viewer
      .locator(`button:has-text("${groupNameE}")`)
      .count()

    const c2EPass =
      saHasE > 0 && adminHasE > 0 && editorHasE > 0 && viewerHasE === 0
    console.log(
      `Editor Group Visibility (Viewer should not see, others should): ${c2EPass ? 'PASS' : 'FAIL'}`,
    )

    // Admin creates group (Level 3)
    await createGroup(admin, groupNameA)
    await admin.waitForTimeout(2000)
    const saHasA = await sa.locator(`button:has-text("${groupNameA}")`).count()
    const adminHasA = await admin
      .locator(`button:has-text("${groupNameA}")`)
      .count()
    const editorHasA = await editor
      .locator(`button:has-text("${groupNameA}")`)
      .count()
    const viewerHasA = await viewer
      .locator(`button:has-text("${groupNameA}")`)
      .count()

    const c2APass =
      saHasA > 0 && adminHasA > 0 && editorHasA === 0 && viewerHasA === 0
    console.log(
      `Admin Group Visibility (Only Admin & Super Admin should see): ${c2APass ? 'PASS' : 'FAIL'}`,
    )

    const c2Pass = c2VPass && c2EPass && c2APass
    testResults['Case 2: Group visibility hierarchy'] = c2Pass ? 'PASS' : 'FAIL'

    // --- CASE 3: Inviting other users to group ---
    console.log('\n--- STARTING TEST CASE 3: Inviting other users to group ---')
    await createGroup(admin, groupNameInvite)
    await admin.click(`button:has-text("${groupNameInvite}")`)
    await admin.waitForSelector('button:has-text("Üyeler")', { timeout: 10000 })

    // Open Members list
    await admin.click('button:has-text("Üyeler")')
    await admin.waitForSelector('input[placeholder="Kullanıcı ID"]', {
      timeout: 5000,
    })

    // Invite Viewer
    const viewerId = viewerSession.userId
    console.log(`Inviting Viewer (ID: ${viewerId}) to ${groupNameInvite}...`)
    await admin.fill('input[placeholder="Kullanıcı ID"]', String(viewerId))
    await admin.click('button:has-text("Davet")')
    await admin.waitForSelector(`text=${credentialsList[3].username}`, {
      timeout: 10000,
    })
    console.log('Viewer invited successfully.')

    // Invite Editor
    const editorId = editorSession.userId
    console.log(`Inviting Editor (ID: ${editorId}) to ${groupNameInvite}...`)
    await admin.fill('input[placeholder="Kullanıcı ID"]', String(editorId))
    await admin.click('button:has-text("Davet")')
    await admin.waitForSelector(`text=${credentialsList[2].username}`, {
      timeout: 10000,
    })
    console.log('Editor invited successfully.')

    // Invite Super Admin (Expect error/fail because of role restrictions targetLevel < myLevel)
    const saId = saSession.userId
    console.log(
      `Inviting Super Admin (ID: ${saId}) to ${groupNameInvite} (expected to fail)...`,
    )
    adminSession.lastAlert = null
    await admin.fill('input[placeholder="Kullanıcı ID"]', String(saId))
    await admin.click('button:has-text("Davet")')

    // Wait to see if alert was triggered
    await admin.waitForTimeout(2000)
    const inviteSaSuccess =
      (await admin.locator(`text=${credentialsList[0].username}`).count()) > 0

    console.log(
      `Invite Super Admin Success: ${inviteSaSuccess ? 'YES (FAIL)' : 'NO (PASS)'}`,
    )
    if (adminSession.lastAlert) {
      console.log(`Alert Message captured: "${adminSession.lastAlert}"`)
    }

    await admin.screenshot({
      path: path.join(SCREENSHOT_DIR, 'case3_admin_member_list.png'),
    })

    // Verify they see the group now
    await admin.waitForTimeout(2000)
    const viewerHasInvite = await viewer
      .locator(`button:has-text("${groupNameInvite}")`)
      .count()
    const editorHasInvite = await editor
      .locator(`button:has-text("${groupNameInvite}")`)
      .count()
    const saHasInvite = await sa
      .locator(`button:has-text("${groupNameInvite}")`)
      .count()

    console.log(`Sidebar presence:`)
    console.log(
      `- Viewer sees group: ${viewerHasInvite > 0 ? 'YES (PASS)' : 'NO (FAIL)'}`,
    )
    console.log(
      `- Editor sees group: ${editorHasInvite > 0 ? 'YES (PASS)' : 'NO (FAIL)'}`,
    )
    console.log(`- Super Admin sees group: ${saHasInvite > 0 ? 'YES' : 'NO'}`)

    const c3Pass = viewerHasInvite > 0 && editorHasInvite > 0 && inviteSaSuccess
    testResults['Case 3: All roles can invite any level user'] = c3Pass
      ? 'PASS'
      : 'FAIL (Admin cannot invite higher roles)'

    // --- CASE 4: Notification in inactive group ---
    console.log(
      '\n--- STARTING TEST CASE 4: Notification in inactive group ---',
    )
    // Editor switches to a different group (e.g. GroupV)
    console.log('Editor switching to Viewer Group...')
    await editor.click(`button:has-text("${groupNameV}")`)
    await editor.waitForTimeout(1000)

    // Admin clicks GroupInvite and sends message
    console.log('Admin sending message to Invite Group...')
    await admin.click(`button:has-text("${groupNameInvite}")`)
    await admin.waitForSelector('textarea[placeholder="Mesaj yaz..."]', {
      timeout: 5000,
    })
    await admin.fill(
      'textarea[placeholder="Mesaj yaz..."]',
      'Hello notification test!',
    )
    await admin.click('button[aria-label="Gönder"]')

    // Verify Editor sees unread count badge
    await editor.waitForTimeout(3000) // wait for socket count update

    // Take screenshot of Editor sidebar showing unread badge
    await editor.screenshot({
      path: path.join(SCREENSHOT_DIR, 'case4_editor_notification_badge.png'),
    })

    // Look for unread badge next to groupNameInvite in editor sidebar
    const badgeLocator = editor.locator(
      `button:has-text("${groupNameInvite}") >> text=1`,
    )
    const badgeCount = await badgeLocator.count()
    const c4Pass = badgeCount > 0
    testResults['Case 4: Inactive group notification'] = c4Pass
      ? 'PASS'
      : 'FAIL'
    console.log(
      `Editor unread badge visible: ${c4Pass ? 'YES (PASS)' : 'NO (FAIL)'}`,
    )

    // --- CASE 5: Delete button for group owner ---
    console.log('\n--- STARTING TEST CASE 5: Delete button for group owner ---')
    // Editor enters EditorGroup
    await editor.click(`button:has-text("${groupNameE}")`)
    await editor.waitForSelector('textarea[placeholder="Mesaj yaz..."]', {
      timeout: 10000,
    })

    // Wait for the network-bound `activeGroup` to load so `isOwner` resolves to true
    console.log(
      'Waiting for activeGroup details to load from network (resolving E2E race condition)...',
    )
    await editor.waitForTimeout(2000)

    const editorDeleteBtnCount = await editor
      .locator('button:has-text("Grubu Sil")')
      .count()
    const c5Pass = editorDeleteBtnCount > 0
    testResults['Case 5: Delete button for group owner'] = c5Pass
      ? 'PASS'
      : 'FAIL'
    console.log(
      `Editor (Owner) sees "Grubu Sil" button: ${c5Pass ? 'YES (PASS)' : 'NO (FAIL)'}`,
    )
    await editor.screenshot({
      path: path.join(SCREENSHOT_DIR, 'case5_editor_delete_button.png'),
    })

    // --- CASE 6: Delete button for Super Admin in other groups ---
    console.log(
      '\n--- STARTING TEST CASE 6: Delete button for Super Admin in other groups ---',
    )
    // Super Admin enters EditorGroup (owned by Editor)
    await sa.click(`button:has-text("${groupNameE}")`)
    await sa.waitForSelector('textarea[placeholder="Mesaj yaz..."]', {
      timeout: 10000,
    })

    // Wait a moment
    await sa.waitForTimeout(1000)

    const saDeleteBtnCount = await sa
      .locator('button:has-text("Grubu Sil")')
      .count()
    const c6Pass = saDeleteBtnCount > 0
    testResults['Case 6: Delete button for Super Admin in other groups'] =
      c6Pass ? 'PASS' : 'FAIL'
    console.log(
      `Super Admin sees "Grubu Sil" button for Editor group: ${c6Pass ? 'YES (PASS)' : 'NO (FAIL)'}`,
    )
    await sa.screenshot({
      path: path.join(SCREENSHOT_DIR, 'case6_superadmin_delete_button.png'),
    })

    // --- CASE 7: Real-time group deletion sync ---
    console.log('\n--- STARTING TEST CASE 7: Real-time group deletion sync ---')
    // Editor deletes the group
    await editor.click(`button:has-text("${groupNameE}")`)
    await editor.click('button:has-text("Grubu Sil")')
    await editor.waitForSelector('text=Bu grup kalıcı olarak silinecek', {
      timeout: 5000,
    })
    await editor.click('button:has-text("Evet, Sil")')

    console.log(
      'Editor deleted EditorGroup. Checking if group disappears for everyone...',
    )
    await editor.waitForTimeout(3000) // wait for WS signal

    const saHasEDeleted = await sa
      .locator(`button:has-text("${groupNameE}")`)
      .count()
    const adminHasEDeleted = await admin
      .locator(`button:has-text("${groupNameE}")`)
      .count()
    const editorHasEDeleted = await editor
      .locator(`button:has-text("${groupNameE}")`)
      .count()

    const c7Pass =
      saHasEDeleted === 0 && adminHasEDeleted === 0 && editorHasEDeleted === 0
    testResults['Case 7: Real-time group deletion sync'] = c7Pass
      ? 'PASS'
      : 'FAIL'
    console.log(
      `Disappeared from Editor: ${editorHasEDeleted === 0 ? 'YES' : 'NO'}`,
    )
    console.log(
      `- Disappeared from Admin: ${adminHasEDeleted === 0 ? 'YES' : 'NO'}`,
    )
    console.log(
      `- Disappeared from Super Admin: ${saHasEDeleted === 0 ? 'YES' : 'NO'}`,
    )

    await sa.screenshot({
      path: path.join(SCREENSHOT_DIR, 'case7_superadmin_post_deletion.png'),
    })
    await admin.screenshot({
      path: path.join(SCREENSHOT_DIR, 'case7_admin_post_deletion.png'),
    })

    // --- CASE 8: File upload and sending ---
    console.log('\n--- STARTING TEST CASE 8: File upload and sending ---')
    // Admin goes to GroupInvite
    await admin.click(`button:has-text("${groupNameInvite}")`)
    await admin.waitForSelector('textarea[placeholder="Mesaj yaz..."]', {
      timeout: 5000,
    })

    console.log(`Admin uploading file ${DUMMY_FILE_PATH}...`)
    await admin.setInputFiles('input[type="file"]', DUMMY_FILE_PATH)

    await admin.waitForSelector(`text=test-file.txt`, { timeout: 20000 })
    console.log('File message visible on Admin screen.')
    await admin.screenshot({
      path: path.join(SCREENSHOT_DIR, 'case8_admin_file_sent.png'),
    })

    // Check on Viewer screen
    await viewer.click(`button:has-text("${groupNameInvite}")`)
    await viewer.waitForSelector(`text=test-file.txt`, { timeout: 10000 })
    console.log('File message visible on Viewer screen.')
    await viewer.screenshot({
      path: path.join(SCREENSHOT_DIR, 'case8_viewer_file_received.png'),
    })

    const c8Pass = (await viewer.locator(`text=test-file.txt`).count()) > 0
    testResults['Case 8: File upload and sending'] = c8Pass ? 'PASS' : 'FAIL'

    console.log('\n======================================')
    console.log('FINAL E2E TEST SUMMARY RESULTS:')
    console.log('======================================')
    for (const [tName, result] of Object.entries(testResults)) {
      console.log(`${tName.padEnd(50)} : ${result}`)
    }
    console.log('======================================')
  } catch (error) {
    console.error('An error occurred during test execution:', error)
  } finally {
    // Cleanup dummy file
    if (fs.existsSync(DUMMY_FILE_PATH)) {
      fs.unlinkSync(DUMMY_FILE_PATH)
    }
    await browser.close()
    console.log('Browser closed.')
  }
}

runTests()
