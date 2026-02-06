const fs = require("fs").promises;
const path = require("path");

const storeDir = path.join(process.cwd(), "data");
const storePath = path.join(storeDir, "orders.json");

async function ensureStore() {
    try {
        await fs.mkdir(storeDir, { recursive: true });
        await fs.access(storePath);
    } catch {
        await fs.writeFile(storePath, JSON.stringify([], null, 2));
    }
}

async function readOrders() {
    await ensureStore();
    const raw = await fs.readFile(storePath, "utf8").catch(() => "[]");
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

async function writeOrders(orders) {
    await fs.writeFile(storePath, JSON.stringify(orders, null, 2));
    return orders;
}

async function upsertOrder(order) {
    const orders = await readOrders();
    const index = orders.findIndex((o) => o.id === order.id);
    if (index >= 0) {
        orders[index] = { ...orders[index], ...order, updatedAt: new Date().toISOString() };
    } else {
        orders.push({ ...order, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    await writeOrders(orders);
    return index >= 0 ? orders[index] : orders[orders.length - 1];
}

async function getOrder(id) {
    const orders = await readOrders();
    return orders.find((order) => order.id === id) || null;
}

async function listOrders() {
    const orders = await readOrders();
    return orders;
}

module.exports = {
    upsertOrder,
    getOrder,
    listOrders,
};
