document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const notificationDiv = document.getElementById("notification");
  const downloadCsvButton = document.getElementById("download-csv-btn");
  const registerDialog = document.getElementById("register-dialog");
  const dialogCloseBtn = document.getElementById("dialog-close-btn");
  const dialogActivityName = document.getElementById("dialog-activity-name");

  let selectedActivity = "";

  downloadCsvButton.addEventListener("click", () => {
    window.location.href = "/reports/activities.csv";
  });

  // Open registration dialog for a given activity
  function openRegisterDialog(activityName) {
    selectedActivity = activityName;
    dialogActivityName.textContent = activityName;
    messageDiv.classList.add("hidden");
    signupForm.reset();
    registerDialog.showModal();
  }

  // Close dialog via close button
  dialogCloseBtn.addEventListener("click", () => {
    registerDialog.close();
  });

  // Close dialog when clicking the backdrop
  registerDialog.addEventListener("click", (event) => {
    if (event.target === registerDialog) {
      registerDialog.close();
    }
  });

  // Show a notification outside the dialog (e.g. after unregister)
  function showNotification(text, type) {
    notificationDiv.textContent = text;
    notificationDiv.className = type;
    notificationDiv.classList.remove("hidden");
    setTimeout(() => {
      notificationDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          <div class="card-actions">
            <button class="register-btn" data-activity="${name}"${spotsLeft === 0 ? " disabled" : ""}>
              Register Student
            </button>
          </div>
        `;

        activitiesList.appendChild(activityCard);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      // Add event listeners to register buttons
      document.querySelectorAll(".register-btn").forEach((button) => {
        button.addEventListener("click", () => {
          openRegisterDialog(button.getAttribute("data-activity"));
        });
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showNotification(result.message, "success");
        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showNotification(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showNotification("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = selectedActivity;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();

        // Close dialog after a short delay so user sees the success message
        setTimeout(() => {
          registerDialog.close();
        }, 1500);
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");

        // Hide message after 5 seconds
        setTimeout(() => {
          messageDiv.classList.add("hidden");
        }, 5000);
      }
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
