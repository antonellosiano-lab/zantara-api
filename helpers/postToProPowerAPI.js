export async function postToProPowerAPI(prompt, result) {
  const url = process.env.PRO_POWER_API_URL;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt, result })
    });

    const responseData = await response.json().catch(() => ({}));

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/helpers/postToProPowerAPI",
        action: "forwardToProPower",
        status: response.status,
        summary: response.ok
          ? "Pro Power API call succeeded"
          : "Pro Power API call failed"
      })
    );

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        summary: "Pro Power API call failed",
        error: responseData.error || "Unknown error"
      };
    }

    return {
      success: true,
      status: response.status,
      summary: "Pro Power API call succeeded",
      data: responseData
    };
  } catch (error) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/helpers/postToProPowerAPI",
        action: "forwardToProPower",
        status: 500,
        error: error.message
      })
    );
    return {
      success: false,
      status: 500,
      summary: "Pro Power API call failed",
      error: error.message
    };
  }
}
