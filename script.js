document.addEventListener("DOMContentLoaded", function () {
  // Initialize modals
  const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
  const editModal = new bootstrap.Modal(document.getElementById("editModal"));

  // Reference to the database
  const db = firebase.database();
  const questionsRef = db.ref("questions");
  const conceptsRef = db.ref("concepts");

  // DOM Elements
  const questionForm = document.getElementById("questionForm");
  const editForm = document.getElementById("editForm");
  const questionsList = document.getElementById("questionsList");
  const filterName = document.getElementById("filterName");
  const filterConcept = document.getElementById("filterConcept");
  const filterDate = document.getElementById("filterDate");
  const conceptsList = document.getElementById("conceptsList");
  const addQuestionCard = document.getElementById("addQuestionCard");
  const authSection = document.getElementById("authSection");
  const loginBtn = document.getElementById("loginBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const questionCount = document.getElementById("questionCount");

  // Login form elements
  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const loginError = document.getElementById("loginError");

  // Edit form elements
  const editId = document.getElementById("editId");
  const editName = document.getElementById("editName");
  const editLink = document.getElementById("editLink");
  const editConcept = document.getElementById("editConcept");
  const editDate = document.getElementById("editDate");
  const editError = document.getElementById("editError");

  // Variables to store questions and concepts
  let allQuestions = [];
  let allConcepts = [];
  let currentUser = null;

  // Check if mobile device
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  // Auth state observer
  // In the auth state observer:
  firebase.auth().onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
      // User is signed in
      authSection.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="me-2 text-truncate" style="max-width: 300px;">Welcome, ${user.email}</span>
                <button id="logoutBtn" class="btn btn-outline-danger btn-sm">Logout</button>
            </div>
        `;
      addQuestionCard.classList.remove("d-none");
      document.getElementById("questionDate").value = new Date(Date.now()).toLocaleDateString("en-CA");
      // Close login modal if open
      loginModal.hide();

      document.getElementById("logoutBtn").addEventListener("click", () => {
        firebase.auth().signOut();
      });

      // Re-render questions to show edit buttons
      renderQuestions(allQuestions);
    } else {
      // User is signed out
      authSection.innerHTML = `
            <button id="loginBtn" class="btn btn-outline-primary ${
              isMobile ? "w-100" : ""
            }">Login</button>
        `;
      addQuestionCard.classList.add("d-none");

      document.getElementById("loginBtn").addEventListener("click", () => {
        loginModal.show();
      });

      // Re-render questions to hide edit buttons
      renderQuestions(allQuestions);
    }
  });

  // Updated renderQuestions function:
  function renderQuestions(questions) {
    questionsList.innerHTML = "";

    if (questions.length === 0) {
      questionsList.innerHTML =
        '<tr><td colspan="5" class="text-center py-3">No questions found</td></tr>';
      return;
    }

    questions.sort((a, b) => new Date(b.date) - new Date(a.date));

    const displayQuestions = isMobile ? questions.slice(0, 50) : questions;

    displayQuestions.forEach((question, index) => {
      const row = document.createElement("tr");
      row.classList.add("fade-in");

      // Only show edit button if user is logged in (regardless of ownership)
      const showEditButton = !!currentUser;

      if (isMobile) {
        row.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <div class="d-flex flex-column">
                        <span class="fw-bold">${question.name}</span>
                        <span class="badge bg-primary concept-badge align-self-start">${
                          question.concept
                        }</span>
                        <small class="text-muted">${formatDate(
                          question.date
                        )}</small>
                    </div>
                </td>
                <td class="text-center">
                    <a href="${
                      question.link
                    }" target="_blank" class="action-btn text-success me-2">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                    ${
                      showEditButton
                        ? `
                    <button class="action-btn text-primary edit-btn" data-id="${question.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    `
                        : ""
                    }
                </td>
            `;
      } else {
        row.innerHTML = `
                <td>${index + 1}</td>
                <td>${question.name}</td>
                <td><span class="badge bg-primary concept-badge">${
                  question.concept
                }</span></td>
                <td>${formatDate(question.date)}</td>
                <td class="text-center">
                    <a href="${
                      question.link
                    }" target="_blank" class="action-btn text-success me-3">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                    ${
                      showEditButton
                        ? `
                    <button class="action-btn text-primary edit-btn me-3" data-id="${question.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    `
                        : ""
                    }
                </td>
            `;
      }

      questionsList.appendChild(row);
    });

    // Set up edit buttons if user is logged in
    if (currentUser) {
      setupQuestionActions();
    }
  }

  // Login handler
  loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    loginError.classList.add("d-none");

    const email = loginEmail.value;
    const password = loginPassword.value;

    // Show loading state
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
    submitBtn.disabled = true;

    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        loginForm.reset();
      })
      .catch((error) => {
        loginError.textContent = error.message;
        loginError.classList.remove("d-none");
        if (isMobile) {
          loginError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      })
      .finally(() => {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
      });
  });

  // Load concepts from Firebase
  conceptsRef.on("value", (snapshot) => {
    allConcepts = snapshot.val() || [];
    updateConceptsDropdown();
    updateFilterConcepts();
  });

  // Load questions from Firebase
  questionsRef.on("value", (snapshot) => {
    allQuestions = [];
    const data = snapshot.val();

    if (data) {
      Object.keys(data).forEach((key) => {
        allQuestions.push({
          id: key,
          ...data[key],
        });
      });
    }

    renderQuestions(allQuestions);
    updateQuestionCount(allQuestions.length);
  });

  // Add new question
  questionForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("You must be logged in to add questions");
      return;
    }

    // Show loading state
    const submitBtn = questionForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';
    submitBtn.disabled = true;

    const name = document.getElementById("questionName").value;
    const link = document.getElementById("questionLink").value;
    const concept = document.getElementById("questionConcept").value;
    const date =
      document.getElementById("questionDate").value ||
      new Date().toISOString().split("T")[0];

    // Add question to Firebase
    questionsRef
      .push({
        name,
        link,
        concept,
        date,
        addedBy: currentUser.email,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        userId: currentUser.uid,
      })
      .then(() => {
        // Add concept to concepts list if it doesn't exist
        if (concept && !allConcepts.includes(concept)) {
          allConcepts.push(concept);
          conceptsRef.set(allConcepts);
        }

        // Reset form
        questionForm.reset();
        document.getElementById("questionDate").value = new Date(Date.now()).toLocaleDateString("en-CA");
        if (isMobile) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      })
      .catch((error) => {
        console.error("Error adding question: ", error);
        if (isMobile) {
          alert("Error adding question: " + error.message);
        }
      })
      .finally(() => {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
      });
  });

  // Edit question handler
  editForm?.addEventListener("submit", (e) => {
    if (!currentUser) {
      alert("You must be logged in to edit questions");
      return;
    }

    const id = editId.value;
    const question = allQuestions.find((q) => q.id === id);

    // Additional check to ensure user owns the question they're trying to edit
    if (question && question.userId !== currentUser.uid) {
      alert("You can only edit your own questions");
      return;
    }

    const name = editName.value;
    const link = editLink.value;
    const concept = editConcept.value;
    const date = editDate.value;

    // Show loading state
    const submitBtn = editForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
    submitBtn.disabled = true;

    // Update question in Firebase
    questionsRef
      .child(id)
      .update({
        name,
        link,
        concept,
        date,
      })
      .then(() => {
        // Add concept to concepts list if it doesn't exist
        if (concept && !allConcepts.includes(concept)) {
          allConcepts.push(concept);
          conceptsRef.set(allConcepts);
        }

        editModal.hide();
      })
      .catch((error) => {
        console.error("Error updating question: ", error);
        editError.textContent = error.message;
        editError.classList.remove("d-none");
      })
      .finally(() => {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
      });
  });

  // Delete question handler
  deleteBtn?.addEventListener("click", () => {
    if (!currentUser) {
      alert("You must be logged in to delete questions");
      return;
    }

    if (!confirm("Are you sure you want to delete this question?")) {
      return;
    }

    const id = editId.value;

    // Show loading state
    deleteBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
    deleteBtn.disabled = true;

    // Delete question from Firebase
    questionsRef
      .child(id)
      .remove()
      .then(() => {
        editModal.hide();
      })
      .catch((error) => {
        console.error("Error deleting question: ", error);
        editError.textContent = error.message;
        editError.classList.remove("d-none");
      })
      .finally(() => {
        deleteBtn.innerHTML = "Delete";
        deleteBtn.disabled = false;
      });
  });

  // Setup question row actions
  function setupQuestionActions() {
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = this.dataset.id;
        const question = allQuestions.find((q) => q.id === id);

        if (question) {
          editId.value = question.id;
          editName.value = question.name;
          editLink.value = question.link;
          editConcept.value = question.concept;
          editDate.value = question.date;

          editError.classList.add("d-none");
          editModal.show();
        }
      });
    });
  }

  // Filter questions
  function setupFilters() {
    filterName.addEventListener("input", () => {
      filterQuestions();
      if (isMobile && filterName.value.length > 0) {
        questionsList.scrollIntoView({ behavior: "smooth" });
      }
    });

    filterConcept.addEventListener("change", filterQuestions);
    filterDate.addEventListener("change", filterQuestions);
  }

  // Function to filter questions based on filters
  function filterQuestions() {
    const nameFilter = filterName.value.toLowerCase();
    const conceptFilter = filterConcept.value;
    const dateFilter = filterDate.value;

    let filtered = allQuestions;

    if (nameFilter) {
      filtered = filtered.filter((q) =>
        q.name.toLowerCase().includes(nameFilter)
      );
    }

    if (conceptFilter) {
      filtered = filtered.filter((q) => q.concept === conceptFilter);
    }

    if (dateFilter) {
      filtered = filtered.filter((q) => q.date === dateFilter);
    }

    renderQuestions(filtered);
    updateQuestionCount(filtered.length);
  }

  // Update question count display
  function updateQuestionCount(count) {
    questionCount.textContent = `${count} question${count !== 1 ? "s" : ""}`;
  }

  // Function to update concepts datalist
  function updateConceptsDropdown() {
    conceptsList.innerHTML = "";
    allConcepts.forEach((concept) => {
      const option = document.createElement("option");
      option.value = concept;
      conceptsList.appendChild(option);
    });
  }

  // Function to update filter concepts dropdown
  function updateFilterConcepts() {
    filterConcept.innerHTML = '<option value="">All Concepts</option>';
    allConcepts.forEach((concept) => {
      const option = document.createElement("option");
      option.value = concept;
      option.textContent = concept;
      filterConcept.appendChild(option);
    });
  }

  // Helper function to format date with mobile consideration
  function formatDate(dateString) {
    if (isMobile) {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } else {
      const options = { year: "numeric", month: "short", day: "numeric" };
      return new Date(dateString).toLocaleDateString(undefined, options);
    }
  }

  // Initialize filters
  setupFilters();
});
