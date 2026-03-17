function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// Function to generate publication HTML
function generatePublicationHTML(publication) {
  const remarkHTML = publication.remark
    ? `<div class="meta"><span class="remark">${publication.remark}</span></div>`
    : '';

  const pdfLinkHTML =
    publication.pdfLink && publication.pdfLink !== '#'
      ? `<a href="${publication.pdfLink}" target="_blank" class="fa-regular fa-file-pdf publication-links"></a>`
      : '';

  const videoLinkHTML =
    publication.videoLink && publication.videoLink !== '#'
      ? `<a href="${publication.videoLink}" target="_blank" class="fa-regular fa-circle-play publication-links"></a>`
      : '';

  // If this publication has an interactive demo, make the teaser clickable
const teaserHTML =
  publication.interactiveDemo
    ? `
      <div class="publication-teaser-wrap image left teaser">
        <a
          class="publication-teaser js-demo-trigger"
          href="#"
          data-demo-src="${publication.interactiveDemo}"
          data-demo-title="${escapeHTML(publication.title)}"
        >
          <img src="${publication.imageSrc}" alt="Article Image" />
          <span class="publication-teaser__overlay">
            <span class="publication-teaser__play">
              <i class="fa-solid fa-play"></i>
            </span>
          </span>
        </a>
      </div>
    `
    : `
      <div class="publication-teaser-wrap image left teaser">
        <a class="publication-teaser">
          <img src="${publication.imageSrc}" alt="Article Image" />
        </a>
      </div>
    `;

  return `
      <div class="content-container">
        ${teaserHTML}
        <div class="content-right">
          <header>
            <div class="title">
              <h2><a href="${publication.doiLink}" target="_blank">${publication.title}</a></h2>
              ${remarkHTML}
              <p>${publication.authors}&nbsp
                ${pdfLinkHTML}
                ${videoLinkHTML}
              </p>
            </div>
          </header>
          <div class="abstract">
            <p class="abstract-text">${publication.abstract}</p>
            <button class="expand-btn">Read More ⋁</button>
          </div>
        </div>
      </div>`;
}

// Function to initialize the expand button functionality
function initializeExpandButtons() {
  document.querySelectorAll('.expand-btn').forEach(button => {
    button.addEventListener('click', function () {
      const abstractText = this.previousElementSibling;

      if (abstractText.classList.contains('expanded')) {
        abstractText.classList.remove('expanded');
        this.textContent = 'Read More ⋁';
      } else {
        abstractText.classList.add('expanded');
        this.textContent = 'Read Less ⋀';
      }
    });
  });
}

// Modal logic
function initializeDemoModal() {
  const modal = document.getElementById('demo-modal');
  if (!modal) return;

  const backdrop = modal.querySelector('.demo-modal__backdrop');
  const closeBtn = document.getElementById('demo-modal-close');
  const frame = document.getElementById('demo-modal-frame');
  const title = document.getElementById('demo-modal-title');

  function openDemo(src, demoTitle) {
    if (frame) frame.src = src;
    if (title) title.textContent = demoTitle || 'Interactive Demo';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeDemo() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (frame) frame.src = '';
    document.body.style.overflow = '';
  }

  document.addEventListener('click', function (e) {
    const trigger = e.target.closest('.js-demo-trigger');

    if (trigger) {
      e.preventDefault();
      openDemo(trigger.dataset.demoSrc, trigger.dataset.demoTitle);
      return;
    }

    if (e.target === backdrop || e.target === closeBtn) {
      closeDemo();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeDemo();
    }
  });
}

// Fetch publications data from the JSON file
fetch('publications.json')
  .then(response => response.json())
  .then(data => {
    const publicationWrapper = document.querySelector('.publication-wrapper');

    data.forEach(publication => {
      publicationWrapper.innerHTML += generatePublicationHTML(publication);
    });

    initializeExpandButtons();
    initializeDemoModal();
  })
  .catch(error => {
    console.error('Error fetching the publications:', error);
  });