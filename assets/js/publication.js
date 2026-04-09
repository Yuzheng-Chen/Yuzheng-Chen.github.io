(function () {
  const PUBLICATIONS_URL = 'publications.json';
  const WRAPPER_SELECTOR = '.publication-wrapper';

  let modalElements = null;
  let interactionsInitialized = false;

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);

    if (className) {
      element.className = className;
    }

    if (typeof text === 'string') {
      element.textContent = text;
    }

    return element;
  }

  function createExternalLink(href, className, label) {
    const link = createElement('a', className);
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', label);
    return link;
  }

  function createTeaser(publication) {
    const wrapper = createElement('div', 'publication-teaser-wrap image left teaser');

    if (publication.interactiveDemo) {
      const trigger = createElement('a', 'publication-teaser js-demo-trigger');
      const image = createElement('img');
      const overlay = createElement('span', 'publication-teaser__overlay');
      const playButton = createElement('span', 'publication-teaser__play');
      const icon = createElement('i', 'fa-solid fa-play');

      trigger.href = '#';
      trigger.dataset.demoSrc = publication.interactiveDemo;
      trigger.dataset.demoTitle = publication.title || 'Interactive Demo';

      image.src = publication.imageSrc;
      image.alt = publication.title || 'Publication teaser';

      playButton.appendChild(icon);
      overlay.appendChild(playButton);
      trigger.append(image, overlay);
      wrapper.appendChild(trigger);

      return wrapper;
    }

    const figure = createElement('div', 'publication-teaser');
    const image = createElement('img');

    image.src = publication.imageSrc;
    image.alt = publication.title || 'Publication teaser';

    figure.appendChild(image);
    wrapper.appendChild(figure);

    return wrapper;
  }

  function createAuthorsLine(publication) {
    const paragraph = createElement('p');
    const authors = createElement('span');

    authors.innerHTML = publication.authors || '';
    paragraph.appendChild(authors);

    if (publication.pdfLink && publication.pdfLink !== '#') {
      paragraph.appendChild(document.createTextNode(' '));
      paragraph.appendChild(
        createExternalLink(
          publication.pdfLink,
          'fa-regular fa-file-pdf publication-links',
          `Open PDF for ${publication.title}`
        )
      );
    }

    if (publication.videoLink && publication.videoLink !== '#') {
      paragraph.appendChild(document.createTextNode(' '));
      paragraph.appendChild(
        createExternalLink(
          publication.videoLink,
          'fa-regular fa-circle-play publication-links',
          `Watch video for ${publication.title}`
        )
      );
    }

    return paragraph;
  }

  function createPublicationCard(publication) {
    const container = createElement('section', 'content-container');
    const contentRight = createElement('div', 'content-right');
    const header = createElement('header');
    const title = createElement('div', 'title');
    const heading = createElement('h2');
    const titleLink = createExternalLink(
      publication.doiLink,
      null,
      `Open publication page for ${publication.title}`
    );
    const abstract = createElement('div', 'abstract');
    const abstractText = createElement('p', 'abstract-text', publication.abstract || '');
    const expandButton = createElement('button', 'expand-btn', 'Read more');

    titleLink.textContent = publication.title || 'Untitled publication';
    heading.appendChild(titleLink);
    title.appendChild(heading);

    if (publication.remark) {
      const meta = createElement('div', 'meta');
      const remark = createElement('span', 'remark', publication.remark);
      meta.appendChild(remark);
      title.appendChild(meta);
    }

    title.appendChild(createAuthorsLine(publication));
    header.appendChild(title);

    expandButton.type = 'button';
    expandButton.setAttribute('aria-expanded', 'false');

    abstract.append(abstractText, expandButton);
    contentRight.append(header, abstract);
    container.append(createTeaser(publication), contentRight);

    return container;
  }

  function ensureDemoModal() {
    if (modalElements) {
      return modalElements;
    }

    const existingModal = document.getElementById('demo-modal');

    if (existingModal) {
      modalElements = {
        modal: existingModal,
        backdrop: existingModal.querySelector('.demo-modal__backdrop'),
        closeButton: existingModal.querySelector('.demo-modal__close'),
        frame: existingModal.querySelector('#demo-modal-frame'),
        title: existingModal.querySelector('#demo-modal-title')
      };

      return modalElements;
    }

    const modal = createElement('div', 'demo-modal');
    const backdrop = createElement('div', 'demo-modal__backdrop');
    const dialog = createElement('div', 'demo-modal__dialog');
    const header = createElement('div', 'demo-modal__header');
    const title = createElement('h3', null, 'Interactive Demo');
    const closeButton = createElement('button', 'demo-modal__close', 'Close');
    const body = createElement('div', 'demo-modal__body');
    const frame = createElement('iframe');

    modal.id = 'demo-modal';
    modal.setAttribute('aria-hidden', 'true');

    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'demo-modal-title');

    title.id = 'demo-modal-title';

    closeButton.type = 'button';
    closeButton.id = 'demo-modal-close';
    closeButton.setAttribute('aria-label', 'Close interactive demo');

    frame.id = 'demo-modal-frame';
    frame.src = '';
    frame.loading = 'lazy';
    frame.allowFullscreen = true;

    header.append(title, closeButton);
    body.appendChild(frame);
    dialog.append(header, body);
    modal.append(backdrop, dialog);
    document.body.appendChild(modal);

    modalElements = {
      modal,
      backdrop,
      closeButton,
      frame,
      title
    };

    return modalElements;
  }

  function openDemo(src, demoTitle) {
    const { modal, frame, title } = ensureDemoModal();

    frame.src = src;
    title.textContent = demoTitle || 'Interactive Demo';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeDemo() {
    const { modal, frame } = ensureDemoModal();

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    frame.src = '';
    document.body.style.overflow = '';
  }

  function toggleAbstract(button) {
    const abstractText = button.previousElementSibling;
    const isExpanded = abstractText.classList.toggle('expanded');

    button.textContent = isExpanded ? 'Read less' : 'Read more';
    button.setAttribute('aria-expanded', String(isExpanded));
  }

  function initializeInteractions() {
    if (interactionsInitialized) {
      return;
    }

    interactionsInitialized = true;

    document.addEventListener('click', function (event) {
      const expandButton = event.target.closest('.expand-btn');
      if (expandButton) {
        toggleAbstract(expandButton);
        return;
      }

      const demoTrigger = event.target.closest('.js-demo-trigger');
      if (demoTrigger) {
        event.preventDefault();
        openDemo(demoTrigger.dataset.demoSrc, demoTrigger.dataset.demoTitle);
        return;
      }

      if (
        modalElements &&
        (event.target === modalElements.backdrop || event.target === modalElements.closeButton)
      ) {
        closeDemo();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && modalElements && modalElements.modal.classList.contains('is-open')) {
        closeDemo();
      }
    });
  }

  function renderPublications(publications) {
    const wrapper = document.querySelector(WRAPPER_SELECTOR);
    if (!wrapper) {
      return;
    }

    const fragment = document.createDocumentFragment();

    publications.forEach(function (publication) {
      fragment.appendChild(createPublicationCard(publication));
    });

    wrapper.appendChild(fragment);
  }

  function initializePublications() {
    if (!document.querySelector(WRAPPER_SELECTOR)) {
      return;
    }

    initializeInteractions();

    fetch(PUBLICATIONS_URL)
      .then(function (response) {
        if (!response.ok) {
          throw new Error(`Failed to load publications: ${response.status}`);
        }

        return response.json();
      })
      .then(function (publications) {
        renderPublications(publications);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  initializePublications();
})();
