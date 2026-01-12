function upload() {
  const fileInput = document.getElementById("file");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please upload a CSV file");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  fetch("http://127.0.0.1:5000/analyze", {
    method: "POST",
    body: formData
  })
    .then(res => {
      if (!res.ok) throw new Error("Backend analysis failed");
      return res.json();
    })
    .then(data => {
      console.log("📊 Analysis result:", data);
      alert("Dataset analyzed successfully");
      window.location.href = "index.html";
    })
    .catch(err => {
      console.error(err);
      alert("Backend analysis failed");
    });
}
