// Function to generate publication HTML
function generatePublicationHTML(publication) {
  // Check if 'remark' exists and create the HTML for it conditionally
  const remarkHTML = publication.remark ? `<div class="meta"><span class="remark">${publication.remark}</span></div>` : '';

  // Conditionally show the DOI, PDF, and Video links if they exist and are not '#'
  const pdfLinkHTML = publication.pdfLink && publication.pdfLink !== '#' ? `<a href="${publication.pdfLink}" target="_blank" class="fa-regular fa-file-pdf publication-links"></a>` : '';
  const videoLinkHTML = publication.videoLink && publication.videoLink !== '#' ? `<a href="${publication.videoLink}" target="_blank" class="fa-regular fa-circle-play publication-links"></a>` : '';

  return `
      <div class="content-container">
        <a class="image left teaser"><img src="${publication.imageSrc}" alt="Article Image" /></a>
        <div class="content-right">
          <header>
            <div class="title">
              <h2><a href="${publication.doiLink}" target="_blank">${publication.title}</a></h2> <!-- Title is now clickable -->
              ${remarkHTML} <!-- Only shows if the remark exists -->
              <p>${publication.authors}&nbsp
                ${pdfLinkHTML} <!-- Only shows if PDF link exists and is not '#' -->
                ${videoLinkHTML} <!-- Only shows if Video link exists and is not '#' -->
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
  // Select all the dynamically added expand buttons
  document.querySelectorAll('.expand-btn').forEach(button => {
    button.addEventListener('click', function () {
      const abstractText = this.previousElementSibling;

      // Toggle the expanded class to show or hide the abstract
      if (abstractText.classList.contains('expanded')) {
        abstractText.classList.remove('expanded');
        this.textContent = 'Read More ⋁'; // Change button text back
      } else {
        abstractText.classList.add('expanded');
        this.textContent = 'Read Less ⋀'; // Change button text to 'Read Less'
      }
    });
  });
}

// Fetch publications data from the JSON file
fetch('publications.json')
  .then(response => response.json())
  .then(data => {
    const publicationWrapper = document.querySelector('.publication-wrapper');

    // Dynamically inject publications into the DOM
    data.forEach(publication => {
      publicationWrapper.innerHTML += generatePublicationHTML(publication);
    });

    // Call the function to initialize "Read More" buttons AFTER the content is added
    initializeExpandButtons();
  })
  .catch(error => {
    console.error('Error fetching the publications:', error);
  });
