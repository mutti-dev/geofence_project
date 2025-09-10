export async function sendPush(token, title, message) {
  if (!token) {
    console.log("sendPush: no token provided");
    return;
  }

  const serverKey = process.env.FCM_SERVER_KEY;
  if (!serverKey) {
    console.log("sendPush: FCM_SERVER_KEY not configured. Skipping push.");
    console.log({ token, title, message });
    return;
  }

  try {
    const payload = {
      to: token,
      notification: { title, body: message },
      data: { title, message },
    };

    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${serverKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("sendPush result:", data);
    return data;
  } catch (err) {
    console.error("sendPush error:", err);
    return null;
  }
}
