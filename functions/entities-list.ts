import { MongoClient } from "npm:mongodb@6.3.0";

const MONGODB_URI = Deno.env.get("MONGODB_URI") || "";
const DB_NAME = "bpexch";

// Map entity names to MongoDB collection names
const COLLECTION_MAP: Record<string, string> = {
  Client: "Clients",
  Clients: "Clients",
  Bet: "Bets",
  Bets: "Bets",
  Match: "Matches",
  Matches: "Matches",
  Transaction: "Transactions",
  Transactions: "Transactions",
  User: "Users",
  Users: "Users",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getDb(client: MongoClient) {
  try {
    await client.db("admin").command({ ping: 1 });
    return client.db(DB_NAME);
  } catch (e) {
    console.error("[entities-list] Connection check failed:", e.message);
    throw e;
  }
}

// Transform MongoDB _id to id for frontend compatibility
function transformDocument(doc: any) {
  if (!doc) return null;
  return {
    id: doc._id?.toString() || doc.id,
    ...doc,
    _id: undefined, // Remove MongoDB's _id to avoid duplication
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET
  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Check MongoDB URI
  if (!MONGODB_URI) {
    console.error("[entities-list] MONGODB_URI not configured");
    return json({ error: "Database not configured" }, 500);
  }

  let client: MongoClient | null = null;

  try {
    // Extract entity name from URL path
    // URL format: /api/entities/list/{entityName}
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const entityName = pathParts[pathParts.length - 1];

    if (!entityName) {
      return json({ error: "entityName required in path" }, 400);
    }

    const collectionName = COLLECTION_MAP[entityName];
    if (!collectionName) {
      return json({ error: `Unknown entity: ${entityName}` }, 400);
    }

    // Get query parameters for sorting and limiting
    const sortBy = url.searchParams.get("sort") || "-created_at";
    const limitParam = parseInt(url.searchParams.get("limit") || "500", 10);
    const limit = Math.min(Math.max(1, limitParam), 1000); // Clamp between 1 and 1000

    console.log(
      `[entities-list] Listing ${collectionName} with sort=${sortBy}, limit=${limit}`
    );

    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    await client.connect();

    const db = await getDb(client);
    const collection = db.collection(collectionName);

    // Build sort object
    let sortObj: Record<string, 1 | -1> = {};
    if (sortBy) {
      const [field, direction] = sortBy.startsWith("-")
        ? [sortBy.slice(1), -1]
        : [sortBy, 1];
      sortObj[field] = direction;
    }

    // Execute query with sorting and limit
    const results = await collection
      .find({})
      .sort(sortObj)
      .limit(limit)
      .toArray();

    const transformedResults = results.map(transformDocument);

    console.log(
      `[entities-list] Found ${transformedResults.length} documents`
    );

    return json(transformedResults, 200);
  } catch (error: any) {
    console.error("[entities-list] Error:", error.message);

    if (error.message.includes("ECONNREFUSED")) {
      return json(
        {
          error: "Database connection failed",
          details: "Cannot connect to MongoDB Atlas",
        },
        503
      );
    }

    if (error.name === "SyntaxError") {
      return json({ error: "Invalid JSON body" }, 400);
    }

    return json(
      {
        error: "List failed",
        details: error.message,
      },
      500
    );
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (e) {
        console.error(
          "[entities-list] Error closing MongoDB connection:",
          e.message
        );
      }
    }
  }
});
