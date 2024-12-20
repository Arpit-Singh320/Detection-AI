
const starsContainer = document.createElement("div");
starsContainer.classList.add("stars");
document.body.appendChild(starsContainer);

// Generate random stars
function createStars(count) {
    for (let i = 0; i < count; i++) {
        const star = document.createElement("div");
        star.classList.add("star");

        // Randomize star position and animation duration
        star.style.top = `${Math.random() * 100}vh`;
        star.style.left = `${Math.random() * 100}vw`;
        star.style.animationDuration = `${Math.random() * 3 + 1}s`;

        starsContainer.appendChild(star);
    }
}

// Generate 100 stars
createStars(100);


// // Function to generate random position for stars
// function randomPosition(starElement) {
//     const screenWidth = window.innerWidth;
//     const screenHeight = window.innerHeight;

//     // Random horizontal (left) and vertical (top) position
//     const randomLeft = Math.random() * screenWidth;
//     const randomTop = Math.random() * screenHeight;

//     // Apply the random positions
//     starElement.style.left = `${randomLeft}px`;
//     starElement.style.top = `${randomTop}px`;

//     // Repeat the random position every 10 seconds (or change duration as needed)
//     setTimeout(() => randomPosition(starElement), 10000);
// }

// // Create stars and apply random movement
// document.querySelectorAll('.star').forEach(star => {
//     randomPosition(star);
// });

function createMeteor() {
    const meteor = document.createElement("div");
    meteor.classList.add("meteor");
  
    // Randomize start position outside the frame
    meteor.style.top = `-${Math.random() * 300}px`; // Start well above the screen
    meteor.style.left = `${Math.random() * window.innerWidth - 300}px`; // Start slightly off-screen horizontally
  
    // Randomize animation duration for variability
    const duration = Math.random() * 2 + 3; // Between 3s and 5s
    meteor.style.animationDuration = `${duration}s`;
  
    // Append meteor to the container
    starsContainer.appendChild(meteor);
  
    // Remove meteor after animation ends
    meteor.addEventListener("animationend", () => meteor.remove());
  }
  
  function meteorShower() {
    setInterval(() => createMeteor(), 2000); // Create a meteor every 2 seconds for lower density
  }
  
  // Initialize the meteor shower
  meteorShower();
  

document.getElementById("uploadForm").addEventListener("submit", async (event) => {
    event.preventDefault();
  
    const fileInput = document.getElementById("imageUpload");
    const file = fileInput.files[0];
  
    if (!file) {
      alert("Please select an image file.");
      return;
    }
  
    // Notify user that the photo has been uploaded
    const uploadMessage = document.getElementById("uploadMessage");
    uploadMessage.textContent = "📤 Image uploaded successfully! Analyzing...";
  
    const responseContainer = document.getElementById("responseContainer");
    responseContainer.innerHTML = "";
  
    const objectCountContainer = document.getElementById("objectCount");
    objectCountContainer.innerHTML = "";
  
    const image = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
  
    const fileReader = new FileReader();
    fileReader.onload = async () => {
      image.src = fileReader.result;
      image.onload = async () => {
        // Define the maximum frame dimensions
        const maxFrameWidth = 400;
        const maxFrameHeight = 400;
  
        // Calculate the scaled dimensions while maintaining the aspect ratio
        const aspectRatio = image.width / image.height;
        if (aspectRatio > 1) {
          // Landscape orientation
          canvas.width = maxFrameWidth;
          canvas.height = maxFrameWidth / aspectRatio;
        } else {
          // Portrait orientation
          canvas.height = maxFrameHeight;
          canvas.width = maxFrameHeight * aspectRatio;
        }
  
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  
        try {
          const response = await fetch("https://api-inference.huggingface.co/models/facebook/detr-resnet-50", {
            method: "POST",
            headers: {
              Authorization: "Bearer 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",
              "Content-Type": "application/octet-stream",
            },
            body: await file.arrayBuffer(),
          });
  
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
  
          const results = await response.json();
  
          // Define a color palette for bounding boxes
          const colorPalette = [
            "#FF5733", "#33FF57", "#3357FF", "#FF33A8", "#FFD433", "#33FFF4",
            "#A833FF", "#FF8333", "#33FF91", "#FF3333",
          ];
          const categoryColors = {};
  
          // Count objects by category
          const counts = {};
          results.forEach(({ score, label, box }) => {
            if (score < 0.5) return; // Skip low-confidence results
            counts[label] = (counts[label] || 0) + 1;
  
            // Assign a unique color to each category
            if (!categoryColors[label]) {
              categoryColors[label] = colorPalette[Object.keys(categoryColors).length % colorPalette.length];
            }
  
            const scaleX = canvas.width / image.width;
            const scaleY = canvas.height / image.height;
  
            const { xmin, ymin, xmax, ymax } = box;
  
            // Scale bounding boxes to match resized canvas
            ctx.strokeStyle = categoryColors[label];
            ctx.lineWidth = 2;
            ctx.strokeRect(
              xmin * scaleX,
              ymin * scaleY,
              (xmax - xmin) * scaleX,
              (ymax - ymin) * scaleY
            );
  
            // Add labels
            ctx.fillStyle = categoryColors[label];
            ctx.font = "12px Arial";
            ctx.fillText(
              `${label} (${(score * 100).toFixed(1)}%)`,
              xmin * scaleX,
              ymin * scaleY - 5
            );
          });
  
          responseContainer.appendChild(canvas);
  
          // Display object counts
          const countDisplay = Object.entries(counts)
            .map(([label, count]) => `
              <p>
                <span style="display:inline-block; width:16px; height:16px; background:${categoryColors[label]}; margin-right:8px; border-radius:50%;"></span>
                <strong>${label}</strong>: ${count}
              </p>`)
            .join("");
          objectCountContainer.innerHTML = `<h3>Detected Objects</h3>${countDisplay}`;
        } catch (error) {
          responseContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        } finally {
          uploadMessage.textContent = ""; // Clear upload message
        }
      };
    };
  
    fileReader.readAsDataURL(file);
  });
  
