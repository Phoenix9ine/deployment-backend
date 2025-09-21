import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";

const form = new FormData();
form.append("file", fs.createReadStream("./package.json"));

console.log("⏳ Uploading file...");

fetch("https://deployment-backend-cu3w.onrender.com/upload", {
 method: "POST", body: form })
  .then(async (res) => {
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      console.log("✅ Server Response:");
      console.log(JSON.stringify(data, null, 2)); // Pretty-print JSON
    } catch (e) {
      console.error("⚠️ Could not parse JSON. Raw response:");
      console.log(text);
    }
  })
  .catch(err => {
    console.error("❌ Upload failed:", err);
  });
