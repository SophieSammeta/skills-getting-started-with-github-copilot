document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

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

        const spotsLeft = details.max_participants - details.participants.length;
        
        let participantsList = '';
        if (details.participants.length > 0) {
          participantsList = `<ul class="participants-list" style="list-style-type:none;padding-left:0;">
            ${details.participants.map(email => `
              <li style="display:flex;align-items:center;">
                <span style="flex-grow:1;">${email}</span>
                <span class="delete-participant" title="Entfernen" style="cursor:pointer;margin-left:10px;color:#c00;" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(email)}">&#128465;</span>
              </li>
            `).join('')}
          </ul>`;
        } else {
          participantsList = `<p class="no-participants"><em>No participants yet - be the first to sign up!</em></p>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p><strong>Participants (${details.participants.length}/${details.max_participants}):</strong></p>
            ${participantsList}
          </div>
        `;

        // Event Delegation für das Löschen
        activityCard.addEventListener('click', async function(e) {
          if (e.target.classList.contains('delete-participant')) {
            const activityName = decodeURIComponent(e.target.getAttribute('data-activity'));
            const email = decodeURIComponent(e.target.getAttribute('data-email'));
            if (confirm(`Teilnehmer ${email} von ${activityName} entfernen?`)) {
              try {
                const response = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, {
                  method: 'DELETE'
                });
                if (response.ok) {
                  fetchActivities(); // Liste neu laden
                } else {
                  alert('Fehler beim Entfernen des Teilnehmers.');
                }
              } catch (err) {
                alert('Fehler beim Entfernen des Teilnehmers.');
              }
            }
          }
        });

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities(); // Aktivitätenliste sofort aktualisieren
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
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
