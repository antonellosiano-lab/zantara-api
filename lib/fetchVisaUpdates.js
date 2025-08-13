export async function fetchVisaUpdates(visaType) {
  const baseUrl = process.env.VISA_UPDATES_URL || 'https://example.com/updates';
  const url = new URL(baseUrl);
  if (visaType) {
    url.searchParams.set('visa_type', visaType);
  }
  const response = await fetch(url.toString());
  const data = await response.json();
  return { status: response.status, data };
}
