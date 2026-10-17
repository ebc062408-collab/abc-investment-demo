
export async function onRequestGet({ env }) {
  if (!env.DB) {
    return Response.json(
      { success: false, message: "Database binding DB is missing." },
      { status: 500 }
    );
  }

  try {
    const result = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
    ).all();

    return Response.json({
      success: true,
      message: "ABC Investment demo database connected!",
      tables: result.results.map((row) => row.name)
    });
  } catch (error) {
    return Response.json(
      { success: false, message: "Database query failed." },
      { status: 500 }
    );
  }
}
