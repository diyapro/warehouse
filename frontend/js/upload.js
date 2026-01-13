function upload() {
  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");

  if (!fileInput || fileInput.files.length === 0) {
    status.innerText = "⚠️ Please select a CSV file.";
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]); // MUST be "file"

  status.innerText = "⏳ Uploading and analyzing dataset...";

  fetch("http://127.0.0.1:5000/analyze", {
    method: "POST",
    body: formData
  })
    .then(async res => {
      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        if (contentType && contentType.includes("application/json")) {
          const err = await res.json();

          let message = err.error || "Backend analysis failed";

          // ✅ SHOW MISSING COLUMNS IF PROVIDED
          if (err.missing) {
            message += "\nMissing columns: " + err.missing.join(", ");
          }

          throw new Error(message);
        } else {
          throw new Error("Server error. Please check backend logs.");
        }
      }

      return res.json();
    })
    .then(data => {
      console.log("Analysis success:", data);
      status.innerText = "✅ Analysis complete! Redirecting to dashboard...";

      setTimeout(() => {
        window.location.href = "index.html";
      }, 800);
    })
    .catch(err => {
      console.error("Upload failed:", err);
      status.innerText = "❌ " + err.message;
    });
}
