// consent.js
export async function checkConsentForAds(vendorId = "755") {
  return new Promise((resolve) => {
    if (typeof window.__tcfapi === 'function') {
      window.__tcfapi('getTCData', 2, (tcData, success) => {
        if (success && tcData && tcData.vendor && tcData.vendor.consents) {
          resolve(tcData.vendor.consents[vendorId] === true);
        } else {
          resolve(false);
        }
      });
    } else {
      // If the CMP API is not available, default to no consent.
      resolve(false);
    }
  });
}
