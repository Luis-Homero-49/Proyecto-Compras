const db = require('./db'); db.query('DROP TABLE IF EXISTS shopping_list_items CASCADE').then(() => { console.log('Dropped'); process.exit(0); }).catch(console.error);
