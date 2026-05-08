const { createClient } = require('@sanity/client');

// Load environment variables from .env file
try {
    require('dotenv').config({ path: ".env.local" });
} catch (err) {
    console.error('Error loading .env.local', err);
}

console.log('projectid', process.env.SANITY_PROJECT_ID);
const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET,
    useCdn: process.env.SANITY_USE_CDN === 'true',
    token: process.env.SANITY_TOKEN,
    apiVersion: process.env.SANITY_API_VERSION || 'vX',
});

// Structured and colorful logging utility
const log = {
    info: (msg, ...args) => console.log(`\x1b[34m[INFO]\x1b[0m ${msg}`, ...args),
    success: (msg, ...args) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`, ...args),
    warn: (msg, ...args) => console.warn(`\x1b[33m[WARN]\x1b[0m ${msg}`, ...args),
    error: (msg, ...args) => console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`, ...args),
    step: (num, desc) => console.log(`\n\x1b[35m=== STEP ${num}: ${desc} ===\x1b[0m`),
};

async function runTest() {
    log.info('Starting Sanity integration test...');

    // 1. Create Root and Top-Level Directories
    log.step(1, 'Create Root and Top-Level Directories');

    log.info('Creating root tree node "Main Nav" using deterministic ID...');
    const root = await client.createIfNotExists({
        _id: 'root-tree',
        _type: 'sanity.tree',
        title: 'Main Nav'
    });
    log.success(`Created root tree node: ID = ${root._id}, Title = "${root.title}"`);

    log.info('Creating directory "Products" referring to root parent...');
    const productsDir = await client.create({
        _type: 'sanity.directory',
        name: 'Products',
        parent: { _type: 'reference', _ref: root._id }
    });
    log.success(`Created "Products" directory: ID = ${productsDir._id}`);

    log.info('Creating directory "About" referring to root parent...');
    const aboutDir = await client.create({
        _type: 'sanity.directory',
        name: 'About',
        parent: { _type: 'reference', _ref: root._id }
    });
    log.success(`Created "About" directory: ID = ${aboutDir._id}`);

    // 2. Create Subdirectory under Products
    log.step(2, 'Create Subdirectory under Products');

    log.info(`Creating directory "Footwear" under Products (${productsDir._id})...`);
    const footwearDir = await client.create({
        _type: 'sanity.directory',
        name: 'Footwear',
        parent: { _type: 'reference', _ref: productsDir._id }
    });
    log.success(`Created "Footwear" directory: ID = ${footwearDir._id}`);

    // Query direct children of Products
    log.info(`Fetching direct children of Products (${productsDir._id})...`);
    const directChildren = await client.fetch(
        `*[_type == "sanity.directory" && parent._ref == $parentId]`,
        { parentId: productsDir._id }
    );
    log.success('Direct children of Products fetched:', directChildren.map(d => d.name || d.title));

    // 3. Create a Page under Footwear
    log.step(3, 'Create a Page under Footwear');

    log.info(`Creating page "Sneakers" under Footwear (${footwearDir._id})...`);
    const sneakersPage = await client.create({
        _type: 'page',
        title: 'Sneakers',
        parent: { _type: 'reference', _ref: footwearDir._id }
    });
    log.success(`Created "Sneakers" page: ID = ${sneakersPage._id}`);

    // Query all pages under Products (including nested)
    log.info(`Fetching all pages referencing Products (${productsDir._id})...`);
    const allNestedPages = await client.fetch(`
    *[_type == "page" && references($topDirId)]`,
        { topDirId: productsDir._id }
    );
    log.success('All pages under Products hierarchy fetched:', allNestedPages.map(p => p.title));

    // 4. Move "Footwear" to "About"
    log.step(4, 'Move "Footwear" to "About"');

    log.info(`Patching Footwear (${footwearDir._id}) to set parent to About (${aboutDir._id})...`);
    await client
        .patch(footwearDir._id)
        .set({ parent: { _type: 'reference', _ref: aboutDir._id } })
        .commit();
    log.success('Footwear successfully moved to About!');

    // 5. Deletion Logic
    log.step(5, 'Test Deletion Logic');

    try {
        log.info(`Attempting to delete Products (${productsDir._id}) - should fail if active references exist...`);
        await client.delete(productsDir._id);
        log.success('Products deleted successfully (unexpected if references existed!).');
    } catch (err) {
        log.warn('Delete failed as expected (or due to schema constraints). Error details:', err.message || err);
    }

    // Correct Deletion: Delete children first (or nullify references)
    log.info(`Querying children of Products (${productsDir._id}) to clean up...`);
    const childrenToClean = await client.fetch(`*[parent._ref == $id]._id`, { id: productsDir._id });
    log.info(`Found ${childrenToClean.length} children to clean:`, childrenToClean);

    log.info('Executing transaction to delete children and Products...');
    const transaction = client.transaction();
    childrenToClean.forEach(id => {
        log.info(`Adding delete operation for child ID: ${id}`);
        transaction.delete(id);
    });
    log.info(`Adding delete operation for Products ID: ${productsDir._id}`);
    transaction.delete(productsDir._id);

    log.info('Committing transaction...');
    try {
        await transaction.commit();
        log.success('Transaction committed successfully! Children and Products deleted.');
    } catch (err) {
        if (err.responseBody) {
            log.error(`Transaction commit FAILED with Response Body: ${err.responseBody}`);
        } else {
            log.error('Transaction commit FAILED!', err);
        }
        throw err;
    }

    // 6. Draft a change in a Release
    log.step(6, 'Draft a change in a Release');

    log.info('Creating "Spring Reorganization" release...');
    const release = await client.create({
        _type: 'sanity.release',
        title: 'Spring Reorganization'
    });
    log.success(`Created release: ID = ${release._id}, Title = "${release.title}"`);

    // Move "About" to a new location within the release context
    const releaseDocId = `versions.${release._id}.${aboutDir._id}`;
    log.info(`Creating a draft of About (${aboutDir._id}) inside the release context with ID: ${releaseDocId}...`);

    await client.create({
        ...aboutDir,
        _id: releaseDocId,
        name: 'About Us (Updated)'
    });
    log.success(`Created draft document: ID = ${releaseDocId}`);

    // Verify the update (In a real scenario, you'd use the 'perspective' header)
    log.info(`Fetching draft document to verify: ID = ${releaseDocId}...`);
    const releaseView = await client.fetch(
        `*[_id == $id][0]`,
        { id: releaseDocId }
    );
    if (releaseView) {
        log.success(`Successfully verified release draft! Name = "${releaseView.name || releaseView.title}"`);
    } else {
        log.warn(`Draft document with ID ${releaseDocId} not found.`);
    }
}

runTest().catch(err => {
    log.error('Test execution failed!');
    if (err.responseBody) {
        log.error(`Server Error Details: ${err.responseBody}`);
    } else {
        log.error(err);
    }
});
