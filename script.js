//Storage keys
const STORAGE_KEY_ENTRIES = "carligurumi_entries";
const STORAGE_KEY_TRASH = "carligurumi_trash";

let photoEntries =
  JSON.parse(localStorage.getItem("carligurumi_entries")) || [];
let trashedEntries =
  JSON.parse(localStorage.getItem("carligurumi_trash")) || [];

function saveData() {
  localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(photoEntries));
  localStorage.setItem(STORAGE_KEY_TRASH, JSON.stringify(trashedEntries));
}

function saveSettingsData() {
  localStorage.setItem(
    "carligurumi_settings",
    JSON.stringify(userSettingsData)
  );
}

function loadSettingsData() {
  const saved = localStorage.getItem("carligurumi_settings");
  if (saved) {
    userSettingsData = JSON.parse(saved);
  }
  animationsToggle.checked = userSettingsData.animationsDisabled;
  if (userSettingsData.animationsDisabled) {
    document.body.classList.add("no-animations");
  }
  document.body.setAttribute("data-theme", userSettingsData.theme);
}

//User settings data
let userSettingsData = {
  theme: "theme-light",
  animationsDisabled: false,
  sortOrder: "newest",
};

//Load screen function
function loadScreen(screenId) {
  document
    .querySelectorAll(".screen")
    .forEach((screen) => screen.classList.remove("active"));
  const target = document.getElementById(screenId);
  if (target) target.classList.add("active");
}

//DOM content load
document.addEventListener("DOMContentLoaded", () => {
  loadSettingsData();
  renderPhotoEntries();
  renderTrashEntries();
  renderTagFilters();

  sortSelect.value = userSettingsData.sortOrder;

  //Prevent reload on form submit
  document.querySelectorAll(".form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
    });
  });

  document.body.setAttribute("data-theme", userSettingsData.theme);

  //Load home screen initially
  loadScreen("home-screen");
});

//UI elements
const sortSelect = document.getElementById("sort-photos-by");
const homeScreenBtn = document.getElementById("home-screen-btn");
const trashScreenBtn = document.getElementById("trash-screen-btn");
const settingsBtn = document.getElementById("settings-btn");
const addPhotoBtn = document.getElementById("add-photo-btn");
const addPhotoForm = document.getElementById("add-photo-form");
const cancelPhotoBtn = document.getElementById("cancel-photo-btn");
const photoEntriesContainer = document.getElementById("photo-entries");
const trashContainer = document.getElementById("deleted-photos");
const filterBar = document.getElementById("tag-filter-bar");

//Event listeners
homeScreenBtn.addEventListener("click", () => {
  loadScreen("home-screen");
});

trashScreenBtn.addEventListener("click", () => {
  loadScreen("trash-screen");
});

settingsBtn.addEventListener("click", () => {
  loadScreen("settings-screen");
});

addPhotoBtn.addEventListener("click", () => {
  loadScreen("add-photo-screen");
});

cancelPhotoBtn.addEventListener("click", () => {
  addPhotoForm.reset();
  editIndex = null;
  loadScreen("home-screen");
});

//Add photo screen
let editIndex = null;

addPhotoForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("new-photo-title").value.trim();
  const description = document.getElementById("new-photo-content").value.trim();
  const tagsRaw = document.getElementById("new-photo-tags").value.trim();
  const url = document.getElementById("new-photo-url").value.trim();

  if (!title || !description || !tagsRaw) {
    alert("Por favor completa todos los campos.");
    return;
  }

  const tags = tagsRaw
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag);
  const newEntry = { title, description, url, tags, timestamp: Date.now() };

  if (editIndex !== null && photoEntries[editIndex]) {
    newEntry.timestamp = photoEntries[editIndex].timestamp;
    photoEntries[editIndex] = newEntry;
    editIndex = null;
  } else {
    photoEntries.push(newEntry);
  }

  saveData();
  renderPhotoEntries();
  renderTagFilters();
  e.target.reset();
  loadScreen("home-screen");
});

//Render photos
function renderPhotoEntries(filterTag = null) {
  photoEntriesContainer.innerHTML = "";

  const filteredEntries = filterTag
    ? photoEntries.filter((entry) =>
        entry.tags.includes(filterTag.toLowerCase())
      )
    : photoEntries;

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    return userSettingsData.sortOrder === "newest"
      ? b.timestamp - a.timestamp
      : a.timestamp - b.timestamp;
  });

  sortedEntries.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "photo-card";
    const formattedDate = new Date(entry.timestamp).toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const tagHTML = entry.tags
      .map((tag) => `<span class="photo-tag">${tag}</span>`)
      .join(" ");

    card.innerHTML = `
      <h3>${entry.title}</h3>
      <p>${entry.description}</p>
      <a href="${entry.url}" target="_blank">Ver en Instagram</a>
      <div class="tag-list">${tagHTML}</div>
      <p class="timestamp">Creado el ${formattedDate}</p>
      <div class="entry-actions">
    <button class="edit-btn">Editar</button>
    <button class="delete-btn">Eliminar</button>
    </div>
    `;

    // Delete logic
    card.querySelector(".delete-btn").addEventListener("click", () => {
      const entryIndex = photoEntries.indexOf(entry);
      if (entryIndex !== -1) {
        trashedEntries.push(entry);
        photoEntries.splice(entryIndex, 1);
        saveData();
        renderPhotoEntries();
        renderTrashEntries();
        renderTagFilters();
      }
    });

    card.querySelector(".edit-btn").addEventListener("click", () => {
      const entryIndex = photoEntries.indexOf(entry);
      if (entryIndex !== -1) {
        editIndex = entryIndex; // store the true index

        document.getElementById("new-photo-title").value = entry.title;
        document.getElementById("new-photo-content").value = entry.description;
        document.getElementById("new-photo-url").value = entry.url;
        document.getElementById("new-photo-tags").value = entry.tags.join(", ");

        loadScreen("add-photo-screen");
      }
    });

    photoEntriesContainer.appendChild(card);
  });

  if (filteredEntries.length === 0) {
    photoEntriesContainer.innerHTML = "<p>No hay amigurumis para mostrar.</p>";
  }
}

//Render trash can
function renderTrashEntries() {
  trashContainer.innerHTML = "";

  trashedEntries.forEach((entry, index) => {
    const card = document.createElement("div");
    card.className = "photo-card deleted";

    const tagHTML = entry.tags
      .map((tag) => `<span class="photo-tag">${tag}</span>`)
      .join(" ");

    card.innerHTML = `
      <h3>${entry.title}</h3>
      <p>${entry.description}</p>
      <a href="${entry.url}" target="_blank">Ver en Instagram</a>
      <div class="tag-list">${tagHTML}</div>
      <div class="trash-actions">
        <button class="restore-btn">Recuperar</button>
        <button class="delete-btn">Eliminar Permanentemente</button>
      </div>
    `;

    // Restore logic
    card.querySelector(".restore-btn").addEventListener("click", () => {
      photoEntries.push(entry);
      trashedEntries.splice(index, 1);
      saveData();
      renderPhotoEntries();
      renderTrashEntries();
      renderTagFilters();
    });

    // Permanent delete logic with double confirmation
    card.querySelector(".delete-btn").addEventListener("click", () => {
      const confirmDelete = confirm(
        "¿Eliminar este amigurumi permanentemente? Esta acción no se puede deshacer."
      );
      if (!confirmDelete) return;

      trashedEntries.splice(index, 1);
      saveData();
      renderTrashEntries();
    });

    trashContainer.appendChild(card);
  });

  if (trashedEntries.length === 0) {
    trashContainer.innerHTML = "<p>No hay amigurumis en la basura.</p>";
  }
}

//Render tag filters
function renderTagFilters() {
  filterBar.innerHTML = "";

  const allTags = new Set(photoEntries.flatMap((entry) => entry.tags));

  if (allTags.size === 0) {
    filterBar.innerHTML = "<p>No has agregado etiquetas.</p>";
    return;
  }

  // "Todos" button
  const allBtn = document.createElement("button");
  allBtn.textContent = "Todos";
  allBtn.className = "tag-filter-btn";
  allBtn.addEventListener("click", () => renderPhotoEntries());
  filterBar.appendChild(allBtn);

  // Tag buttons
  allTags.forEach((tag) => {
    const btn = document.createElement("button");
    btn.textContent = tag;
    btn.className = "tag-filter-btn";
    btn.addEventListener("click", () => renderPhotoEntries(tag));
    filterBar.appendChild(btn);
  });
}

//Settings screen
const themeButtons = document.querySelectorAll(".theme-btn");
const themePopup = document.getElementById("change-theme-popup");
const closeThemePopupBtn = document.getElementById("close-theme-popup");
const clearTrashBtn = document.getElementById("clear-trash");
const resetDataBtn = document.getElementById("reset-data-btn");
const animationsToggle = document.getElementById("disable-animations-toggle");

document.getElementById("theme-btn").addEventListener("click", () => {
  themePopup.classList.remove("hidden");
});

closeThemePopupBtn.addEventListener("click", () => {
  themePopup.classList.add("hidden");
});

themeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const theme = btn.id.replace("theme-", "");
    document.body.setAttribute("data-theme", theme);
    userSettingsData.theme = theme;
    saveSettingsData();
  });
});

clearTrashBtn.addEventListener("click", () => {
  const confirmClear = confirm(
    "¿Vaciar la basura? Esta acción no se puede deshacer."
  );
  if (!confirmClear) return;

  trashedEntries.length = 0;
  saveData();
  renderTrashEntries();
});

resetDataBtn.addEventListener("click", () => {
  const confirmReset = confirm(
    "¿Borrar todos los datos? Esto eliminará todos los amigurumis y etiquetas."
  );
  if (!confirmReset) return;

  photoEntries.length = 0;
  trashedEntries.length = 0;
  saveData();
  renderPhotoEntries();
  renderTrashEntries();
  renderTagFilters();
  loadScreen("home-screen");
});

animationsToggle.addEventListener("change", () => {
  const disabled = animationsToggle.checked;
  document.body.classList.toggle("no-animations", disabled);
  userSettingsData.animationsDisabled = disabled;
  saveSettingsData();
});

sortSelect.addEventListener("change", () => {
  userSettingsData.sortOrder = sortSelect.value;
  saveSettingsData();
  renderPhotoEntries();
});
