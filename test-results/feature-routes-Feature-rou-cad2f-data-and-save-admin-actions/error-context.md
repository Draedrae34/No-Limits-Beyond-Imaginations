# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: feature-routes.spec.js >> Feature route smoke checks >> private workshop panels render backend data and save admin actions
- Location: feature-routes.spec.js:188:3

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('.tab-btn[data-tab="messages"]')
    - locator resolved to <button data-tab="messages" class="nav-item tab-btn">Messages</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div id="order-modal" aria-hidden="false" class="panel active">…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div id="order-modal" aria-hidden="false" class="panel active">…</div> intercepts pointer events
    - retrying click action
      - waiting 100ms
    114 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <div id="order-modal" aria-hidden="false" class="panel active">…</div> intercepts pointer events
      - retrying click action
        - waiting 500ms
    - waiting for element to be visible, enabled and stable

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - heading "Silent Spirits Workshop" [level=1] [ref=e6]
        - paragraph [ref=e7]: No Limits Beyond Limitations
      - navigation [ref=e8]:
        - button "Overview" [ref=e9] [cursor=pointer]
        - button "Lil Mystic" [ref=e10] [cursor=pointer]
        - button "Music Studio" [ref=e11] [cursor=pointer]
        - button "Design Lab" [ref=e12] [cursor=pointer]
        - button "Eternal Heart" [ref=e13] [cursor=pointer]
        - button "Orders" [ref=e14] [cursor=pointer]
        - button "Catalog" [ref=e15] [cursor=pointer]
        - button "Messages" [ref=e16] [cursor=pointer]
        - button "Gallery" [ref=e17] [cursor=pointer]
      - button "Logout & Return" [ref=e18] [cursor=pointer]
    - main [ref=e19]:
      - generic [ref=e20]:
        - heading "Frontline Presence" [level=2] [ref=e21]
        - generic [ref=e26]:
          - generic [ref=e27]:
            - generic [ref=e28]:
              - heading "Lil Mystic" [level=3] [ref=e29]
              - paragraph [ref=e30]: Your private creative AI.
            - generic [ref=e31]:
              - generic [ref=e32]: AI READY
              - generic [ref=e33]: "Memory: 0"
          - generic [ref=e34]:
            - generic [ref=e35]: "[1:59:01 AM] Lil Mystic hologram online."
            - generic [ref=e36]: "[1:59:02 AM] Creation Studio & Emotional Engine Online."
            - generic [ref=e37]: "[1:59:02 AM] Initializing Heart & Subsystems..."
            - generic [ref=e38]: "[1:59:02 AM] Synchronizing holographic sub-systems..."
            - generic [ref=e39]: "[1:59:03 AM] Silent Spirits Legacy — Online."
          - generic [ref=e40]:
            - generic [ref=e41]:
              - generic [ref=e42]:
                - heading "Memory Status" [level=4] [ref=e43]
                - paragraph [ref=e44]: Runtime snapshots Lil Mystic has captured.
              - button "Clear Memory" [ref=e45] [cursor=pointer]
            - generic [ref=e46]:
              - searchbox "Search memory..." [ref=e47]
              - combobox "Memory timeline order" [ref=e48]:
                - option "Newest first" [selected]
                - option "Oldest first"
            - generic [ref=e49]: 0 of 0 snapshots shown - newest to oldest.
            - generic [ref=e50]: No snapshots yet. Tell Lil Mystic to remember something.
            - button "Recall latest" [ref=e52] [cursor=pointer]
          - generic [ref=e53]:
            - textbox "Ask Lil Mystic anything..." [ref=e54]
            - button "Send" [ref=e55] [cursor=pointer]
      - generic [ref=e56]:
        - heading "Orders Pipeline" [level=2] [ref=e57]
        - generic [ref=e58]: Loaded 1 order.
        - button "Refresh Sync" [ref=e59] [cursor=pointer]
        - table [ref=e60]:
          - rowgroup [ref=e61]:
            - row "ID Product Amount Buyer Email Status Date Actions" [ref=e62]:
              - columnheader "ID" [ref=e63]
              - columnheader "Product" [ref=e64]
              - columnheader "Amount" [ref=e65]
              - columnheader "Buyer" [ref=e66]
              - columnheader "Email" [ref=e67]
              - columnheader "Status" [ref=e68]
              - columnheader "Date" [ref=e69]
              - columnheader "Actions" [ref=e70]
          - rowgroup [ref=e71]:
            - row "9001 mock-hoodie $64.99 Aundrae Test aundrae@example.com Pending 6/22/2026, 12:00:00 PM Details Mark Fulfilled" [ref=e72]:
              - cell "9001" [ref=e73]
              - cell "mock-hoodie" [ref=e74]
              - cell "$64.99" [ref=e75]
              - cell "Aundrae Test" [ref=e76]
              - cell "aundrae@example.com" [ref=e77]
              - cell "Pending" [ref=e78]
              - cell "6/22/2026, 12:00:00 PM" [ref=e79]
              - cell "Details Mark Fulfilled" [ref=e80]:
                - button "Details" [ref=e81] [cursor=pointer]
                - button "Mark Fulfilled" [ref=e82] [cursor=pointer]
  - generic [ref=e84]:
    - 'heading "Order #9001" [level=2] [ref=e85]'
    - generic [ref=e86]:
      - generic [ref=e87]: Order ID9001
      - generic [ref=e88]: PayPal Order IDPAYPAL-MOCK-9001
      - generic [ref=e89]: Productmock-hoodie
      - generic [ref=e90]: Amount$64.99
      - generic [ref=e91]: BuyerAundrae Test
      - generic [ref=e92]: Emailaundrae@example.com
      - generic [ref=e93]: Created6/22/2026, 12:00:00 PM
      - generic [ref=e94]: Fulfilled AtN/A
    - generic [ref=e95]:
      - generic [ref=e96]: Status
      - combobox [ref=e97]:
        - option "Pending" [selected]
        - option "Fulfilled"
      - textbox "Log internal insights..." [ref=e98]: Pack with care.
      - generic [ref=e100]:
        - button "Update" [active] [ref=e101] [cursor=pointer]
        - button "Close" [ref=e102] [cursor=pointer]
  - generic [ref=e103]:
    - generic [ref=e104]: MOODNEUTRAL
    - generic [ref=e105]: RESONANCE
    - generic [ref=e106]: INTEGRITY
    - generic [ref=e107]: PULSESTABLE
    - generic [ref=e108]: SPIRITONLINE
```

# Test source

```ts
  107 |       });
  108 |     });
  109 | 
  110 |     await page.route('**/api/products/**', async (route) => {
  111 |       calls.push({ endpoint: 'product-detail', method: route.request().method() });
  112 |       await route.fulfill({
  113 |         status: 200,
  114 |         contentType: 'application/json',
  115 |         body: JSON.stringify({ success: true, product: mockProduct }),
  116 |       });
  117 |     });
  118 | 
  119 |     await page.route('**/api/products', async (route) => {
  120 |       calls.push({ endpoint: 'products', method: route.request().method() });
  121 |       await route.fulfill({
  122 |         status: 200,
  123 |         contentType: 'application/json',
  124 |         body: JSON.stringify({ success: true, products: [mockProduct] }),
  125 |       });
  126 |     });
  127 |   }
  128 | 
  129 |   test('shop exposes catalog controls and checkout entry points', async ({ page }) => {
  130 |     await page.goto(`${BASE_URL}/shop.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  131 | 
  132 |     await expect(page.locator('#shop-grid')).toHaveCount(1);
  133 |     await expect(page.locator('#product-search')).toHaveCount(1);
  134 |     await expect(page.locator('#category-filters')).toHaveCount(1);
  135 |     await expect(page.locator('#paypal-checkout-panel')).toHaveCount(1);
  136 |     await expect(page.locator('.paypal-buy-now-btn').first()).toBeAttached({ timeout: 60000 });
  137 |   });
  138 | 
  139 |   test('message wall exposes tribute composer and rendering grid', async ({ page }) => {
  140 |     await page.goto(`${BASE_URL}/message-wall.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  141 | 
  142 |     await expect(page.locator('#tribute-name')).toHaveCount(1);
  143 |     await expect(page.locator('#tribute-text')).toHaveCount(1);
  144 |     await expect(page.locator('#tribute-preview')).toHaveCount(1);
  145 |     await expect(page.locator('#submit-tribute')).toHaveCount(1);
  146 |     await expect(page.locator('#honor-grid')).toHaveCount(1);
  147 |   });
  148 | 
  149 |   test('monitor and status pages expose operational panels', async ({ page }) => {
  150 |     await page.goto(`${BASE_URL}/monitor.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  151 | 
  152 |     await expect(page.locator('#agent-status')).toHaveCount(1);
  153 |     await expect(page.locator('#shop-status')).toHaveCount(1);
  154 |     await expect(page.locator('#messages-status')).toHaveCount(1);
  155 |     await expect(page.locator('#paypal-test-log')).toHaveCount(1);
  156 | 
  157 |     await page.goto(`${BASE_URL}/status.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  158 | 
  159 |     await expect(page.locator('#shop-status')).toHaveCount(1);
  160 |     await expect(page.locator('#paypal-status')).toHaveCount(1);
  161 |     await expect(page.locator('#printify-status')).toHaveCount(1);
  162 |     await expect(page.locator('#agent-status')).toHaveCount(1);
  163 |     await expect(page.locator('#orders-status')).toHaveCount(1);
  164 | 
  165 |     const statusSource = fs.readFileSync(new URL('./public/status.html', import.meta.url), 'utf8');
  166 |     expect(statusSource).toContain("method: 'POST'");
  167 |   });
  168 | 
  169 |   test('private workshop entry and portal overlay anchors are present', async ({ page }) => {
  170 |     await grantWorkshopAccess(page);
  171 |     await page.route('**/api/auth**', async (route) => {
  172 |       await route.fulfill({
  173 |         status: 200,
  174 |         contentType: 'application/json',
  175 |         body: JSON.stringify({ authenticated: true, success: true }),
  176 |       });
  177 |     });
  178 | 
  179 |     await page.goto(`${BASE_URL}/private.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  180 |     await expect(page).toHaveURL(/\/workshop\.html/);
  181 | 
  182 |     await page.goto(`${BASE_URL}/workshop.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  183 |     await expect(page.locator('#cosmic-intro')).toHaveCount(1);
  184 |     await expect(page.locator('#starfield')).toHaveCount(1);
  185 |     await expect(page.locator('.workshop-shell')).toHaveCount(1);
  186 |   });
  187 | 
  188 |   test('private workshop panels render backend data and save admin actions', async ({ page }) => {
  189 |     const calls = [];
  190 |     await grantWorkshopAccess(page);
  191 |     await mockWorkshopApis(page, calls);
  192 | 
  193 |     await page.goto(`${BASE_URL}/workshop.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  194 |     await expect(page.locator('#cosmic-intro')).toHaveClass(/hidden/, { timeout: 10000 });
  195 | 
  196 |     await expect(page.locator('#orders-status')).toHaveText(/Loaded 1 order/, { timeout: 30000 });
  197 |     await page.locator('.tab-btn[data-tab="orders"]').click();
  198 |     await expect(page.locator('#orders')).toHaveClass(/active/);
  199 |     await expect(page.locator('#orders-table tbody')).toContainText('mock-hoodie');
  200 |     await page.locator('.order-detail-btn').first().click();
  201 |     await expect(page.locator('#order-modal')).toHaveClass(/active/);
  202 |     await expect(page.locator('#order-modal-title')).toHaveText('Order #9001');
  203 |     await page.locator('#order-fulfillment-status').selectOption('fulfilled');
  204 |     await page.locator('#order-fulfillment-save').click();
  205 |     await expect.poll(() => calls.some((call) => call.endpoint === 'orders' && call.method === 'PUT')).toBe(true);
  206 | 
> 207 |     await page.locator('.tab-btn[data-tab="messages"]').click();
      |                                                         ^ Error: locator.click: Test timeout of 120000ms exceeded.
  208 |     await expect(page.locator('#messages')).toHaveClass(/active/);
  209 |     await expect(page.locator('#messages-table tbody')).toContainText('Legacy Friend');
  210 |     await page.locator('#messages-table button[data-action="view"]').first().click();
  211 |     await expect(page.locator('#message-modal')).toHaveClass(/active/);
  212 |     await page.locator('#modal-message-approved').check();
  213 |     await page.locator('#modal-message-save').click();
  214 |     await expect.poll(() => calls.some((call) => call.endpoint === 'messages' && call.method === 'PUT')).toBe(true);
  215 | 
  216 |     await page.locator('.tab-btn[data-tab="gallery"]').click();
  217 |     await expect(page.locator('#gallery')).toHaveClass(/active/);
  218 |     await expect(page.locator('#gallery-items')).toContainText('Mock remembrance image');
  219 |     await expect(page.locator('#gallery-admin')).toContainText('tribute');
  220 | 
  221 |     await page.locator('.tab-btn[data-tab="products"]').click();
  222 |     await expect(page.locator('#products')).toHaveClass(/active/);
  223 |     await expect(page.locator('#products-table tbody')).toContainText('Mock Cosmic Hoodie');
  224 |     await page.locator('.prod-edit').first().click();
  225 |     await expect(page.locator('#prod-name')).toHaveValue('Mock Cosmic Hoodie');
  226 |     await expect(page.locator('#prod-status')).toContainText('Editing product #201');
  227 |   });
  228 | });
  229 | 
```