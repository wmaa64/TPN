// lib/db.js

import sql from "mssql";

const sqlConfig = {
  server: process.env.SQL_SERVER,
  port: Number(process.env.SQL_PORT || 1433),

  database: process.env.SQL_DATABASE,

  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,

  options: {
    encrypt: true,
    trustServerCertificate: true,
  },

  connectionTimeout: 30000,
  requestTimeout: 30000,

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// tedious (used by mssql) calls this ES2024 API when opening a connection.
// The app may run on Node 20 releases that predate Promise.withResolvers.
if (typeof Promise.withResolvers !== "function") {
  Promise.withResolvers = function withResolvers() {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
      resolve = resolvePromise;
      reject = rejectPromise;
    });
    return { promise, resolve, reject };
  };
}


// --------------------------------------------------
// Keep one connection pool during Next.js development
// --------------------------------------------------

let cached = global.sqlServer;

if (!cached) {
  cached = global.sqlServer = {
    conn: null,
    promise: null,
  };
}


// --------------------------------------------------
// Connect to SQL Server
// --------------------------------------------------

const connectDB = async () => {

  // Already connected
  if (cached.conn) {
    return cached.conn;
  }


  // Connection is currently being established
  if (!cached.promise) {

    cached.promise = sql.connect(sqlConfig)
      .then((pool) => {
        console.log("Connected to SQL Server");

        return pool;
      })
      .catch((error) => {

        // Allow another connection attempt after failure
        cached.promise = null;

        console.error(
          "SQL Server connection failed:",
          error.message
        );

        throw error;
      });
  }


  // Wait for the connection
  cached.conn = await cached.promise;

  return cached.conn;
};


export { sql };

export default connectDB;
