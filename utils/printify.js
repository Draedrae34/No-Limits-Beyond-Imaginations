export const PRINTIFY_API_KEY = "YOUR_API_KEY";
export const SHOP_ID = "YOUR_SHOP_ID";

export async function createProduct(productData) {
    const response = await fetch(`https://api.printify.com/v1/shops/${SHOP_ID}/products.json`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${PRINTIFY_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(productData)
    });

    return response.json();
}

export async function getProducts() {
    const response = await fetch(`https://api.printify.com/v1/shops/${SHOP_ID}/products.json`, {
        headers: {
            "Authorization": `Bearer ${PRINTIFY_API_KEY}`
        }
    });

    return response.json();
}
