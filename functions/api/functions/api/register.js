
export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return Response.json(
      { success: false, message: "Database binding DB is missing." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return Response.json(
        {
          success: false,
          message: "Username must be 3–30 characters using letters, numbers, or underscores."
        },
        { status: 400 }
      );
    }

    if (password.length < 12 || password.length > 128) {
      return Response.json(
        {
          success: false,
          message: "Password must be between 12 and 128 characters."
        },
        { status: 400 }
      );
    }

    const existing = await env.DB.prepare(
      "SELECT id FROM members WHERE username = ?"
    ).bind(username).first();

    if (existing) {
      return Response.json(
        { success: false, message: "Username is already taken." },
        { status: 409 }
      );
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const derived = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 310000,
        hash: "SHA-256"
      },
      key,
      256
    );

    const toHex = (bytes) =>
      Array.from(bytes, (b) =>
        b.toString(16).padStart(2, "0")
      ).join("");

    const passwordHash =
      `pbkdf2-sha256$310000$${toHex(salt)}$${toHex(new Uint8Array(derived))}`;

    await env.DB.prepare(
      "INSERT INTO members (username, password_hash) VALUES (?, ?)"
    ).bind(username, passwordHash).run();

    return Response.json(
      { success: true, message: "Demo account created." },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { success: false, message: "Registration failed. Check the database schema and server logs." },
      { status: 500 }
    );
  }
}
