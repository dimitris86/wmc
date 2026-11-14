/* Watermark Consultants — vessel catalogue and accessible photo gallery */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const IMAGE_FOLDER = 'img/';
  const PAGE_SIZE = 12;

  let vessels = [];
  let visibleCount = PAGE_SIZE;
  let currentVessel = null;
  let currentImage = 0;

  const dialog = $('vesselDialog');
  const dialogContent = $('dialogContent');

  // Escape text before inserting it into HTML templates.
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  function imagePath(filename) {
    // database.js stores filenames only, without folder paths.
    return IMAGE_FOLDER + encodeURIComponent(filename);
  }

  function statusText(vessel) {
    return vessel.delivered ? 'Delivered' : 'Under construction';
  }

  function formatDate(date) {
    return date ? date : 'Not recorded';
  }

  function firstCategory(vessel) {
    return vessel.category.join(', ') || 'Uncategorized';
  }

  function makeCard(vessel) {
    const image = vessel.images[0];
    const picture = image
      ? `<img src="${imagePath(image)}" alt="${escapeHtml(vessel.name)}" loading="lazy">`
      : '<div class="card-fallback" aria-hidden="true">⚓</div>';

    return `
      <article class="vessel-card">
        <button class="card-button" type="button" data-vessel="${vessel.id}"
                aria-label="View ${escapeHtml(vessel.name)} details">
          <div class="card-image">
            ${picture}
            <span class="card-status ${vessel.delivered ? '' : 'construction'}">
              ${statusText(vessel)}
            </span>
          </div>
          <div class="card-content">
            <span class="card-category">${escapeHtml(firstCategory(vessel))}</span>
            <h3>${escapeHtml(vessel.name)}</h3>
            <p>${escapeHtml(vessel.client)}</p>
            <div class="card-bottom">
              <span>${vessel.deliveryDate ? `Delivery: ${escapeHtml(vessel.deliveryDate)}` : 'No delivery date'}</span>
              <strong>View details ↗</strong>
            </div>
          </div>
        </button>
      </article>`;
  }

  function filteredVessels() {
    const query = $('searchInput').value.trim().toLowerCase();
    const category = $('categoryFilter').value;
    const status = $('statusFilter').value;
    const sort = $('sortSelect').value;

    const results = vessels.filter((vessel) => {
      const searchable = [
        vessel.name, vessel.title, vessel.client, vessel.description,
        vessel.builder, vessel.country, vessel.shipName, vessel.scope,
        ...vessel.category
      ].join(' ').toLowerCase();

      return (!query || searchable.includes(query)) &&
        (!category || vessel.category.includes(category)) &&
        (!status || (status === 'delivered') === vessel.delivered);
    });

    results.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'date') return (b.deliveryDate || '').localeCompare(a.deliveryDate || '');
      return b.id - a.id;
    });
    return results;
  }

  function renderCards() {
    const results = filteredVessels();
    $('vesselGrid').innerHTML = results.slice(0, visibleCount).map(makeCard).join('');
    $('resultCount').textContent = `${results.length} vessel${results.length === 1 ? '' : 's'} found`;
    $('emptyState').hidden = results.length !== 0;
    $('loadMore').hidden = visibleCount >= results.length;
  }

  function addCategories() {
    const categories = [...new Set(vessels.flatMap((vessel) => vessel.category))].sort();
    $('categoryFilter').innerHTML = '<option value="">All categories</option>' +
      categories.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
  }

  function detail(label, value) {
    return value ? `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>` : '';
  }

  function galleryHtml(vessel) {
    if (!vessel.images.length) {
      return '<p class="photo-note">No photographs are available for this vessel.</p>';
    }

    return `
      <section class="gallery-section" aria-label="Vessel photographs">
        <h3>Vessel photographs</h3>
        <div class="image-viewer">
          <button id="previousImage" class="image-arrow previous" type="button"
                  aria-label="Previous photograph">‹</button>
          <img id="mainVesselImage" src="${imagePath(vessel.images[0])}"
               alt="${escapeHtml(vessel.name)}, photograph 1">
          <button id="nextImage" class="image-arrow next" type="button"
                  aria-label="Next photograph">›</button>
          <span class="image-count" id="imageCount"></span>
        </div>
        <div class="image-gallery" id="imageGallery" aria-label="Choose a photograph">
          ${vessel.images.map((filename, index) => `
            <button type="button" class="gallery-thumb" data-image="${index}"
                    aria-label="View photograph ${index + 1}">
              <img src="${imagePath(filename)}" alt="" loading="lazy">
            </button>`).join('')}
        </div>
      </section>`;
  }

  function showImage(index) {
    if (!currentVessel || !currentVessel.images.length) return;
    const count = currentVessel.images.length;
    currentImage = (index + count) % count;

    const mainImage = $('mainVesselImage');
    mainImage.src = imagePath(currentVessel.images[currentImage]);
    mainImage.alt = `${currentVessel.name}, photograph ${currentImage + 1} of ${count}`;
    $('imageCount').textContent = `${currentImage + 1} / ${count}`;

    $('imageGallery').querySelectorAll('[data-image]').forEach((button) => {
      const active = Number(button.dataset.image) === currentImage;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function openVessel(vessel) {
    currentVessel = vessel;
    currentImage = 0;

    // The description appears BEFORE the viewer; no large image banner.
    dialogContent.innerHTML = `
      <div class="dialog-inner">
        <div class="dialog-kicker">Vessel ${vessel.id} · ${escapeHtml(firstCategory(vessel))}</div>
        <h2 id="dialogTitle">${escapeHtml(vessel.title || vessel.name)}</h2>
        <dl class="detail-list">
          ${detail('Client / shipowner', vessel.client)}
          ${detail('Status', statusText(vessel))}
          ${detail('Delivery date', formatDate(vessel.deliveryDate))}
          ${detail('Builder / shipyard', vessel.builder)}
          ${detail('Country', vessel.country)}
          ${detail('Vessel designation', vessel.shipName)}
          ${detail('Work scope', vessel.scope)}
        </dl>
        <h3>Project overview</h3>
        <p class="dialog-description">${escapeHtml(vessel.description || 'No description recorded.')}</p>
        ${galleryHtml(vessel)}
        <div class="dialog-actions">
          <button type="button" id="copyLink">Copy vessel link ↗</button>
        </div>
      </div>`;

    if (!dialog.open) dialog.showModal();
    history.replaceState(null, '', `#vessel-${vessel.id}`);

    if (vessel.images.length) showImage(0);
    dialog.scrollTop = 0;
  }

  function closeVessel() {
    if (dialog.open) dialog.close();
    currentVessel = null;
    if (location.hash.startsWith('#vessel-')) {
      history.replaceState(null, '', '#vessels');
    }
  }

  // Use event delegation so dynamically created gallery buttons work.
  dialogContent.addEventListener('click', (event) => {
    if (event.target.closest('#previousImage')) showImage(currentImage - 1);
    if (event.target.closest('#nextImage')) showImage(currentImage + 1);

    const thumbnail = event.target.closest('[data-image]');
    if (thumbnail) showImage(Number(thumbnail.dataset.image));

    if (event.target.closest('#copyLink')) {
      const url = location.href;
      const button = $('copyLink');
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(() => {
          button.textContent = 'Link copied ✓';
        }).catch(() => { button.textContent = url; });
      } else {
        button.textContent = url;
      }
    }
  });

  dialog.addEventListener('keydown', (event) => {
    if (event.target.matches('input, textarea, select')) return;
    if (event.key === 'ArrowLeft') showImage(currentImage - 1);
    if (event.key === 'ArrowRight') showImage(currentImage + 1);
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeVessel();
  });
  dialog.addEventListener('close', closeVessel);
  $('dialogClose').addEventListener('click', closeVessel);

  $('vesselGrid').addEventListener('click', (event) => {
    const button = event.target.closest('[data-vessel]');
    if (!button) return;
    const vessel = vessels.find((item) => item.id === Number(button.dataset.vessel));
    if (vessel) openVessel(vessel);
  });

  for (const id of ['searchInput', 'categoryFilter', 'statusFilter', 'sortSelect']) {
    $(id).addEventListener(id === 'searchInput' ? 'input' : 'change', () => {
      visibleCount = PAGE_SIZE;
      renderCards();
    });
  }
  $('loadMore').addEventListener('click', () => {
    visibleCount += PAGE_SIZE;
    renderCards();
  });

  // Data is loaded by database.js before this script executes.
  // This works both on a local file:// page and on a web server.
  function loadDatabase() {
    if (!window.VESSEL_DATABASE) {
      throw new Error('database.js is missing or could not be loaded.');
    }
    return window.VESSEL_DATABASE;
  }

  async function initialize() {
    try {
      const database = await loadDatabase();
      if (!Array.isArray(database.vessels)) throw new Error('Missing vessels array');
      vessels = database.vessels;
      addCategories();
      renderCards();

      const match = location.hash.match(/^#vessel-(\d+)$/);
      if (match) {
        const vessel = vessels.find((item) => item.id === Number(match[1]));
        if (vessel) openVessel(vessel);
      }
    } catch (error) {
      $('resultCount').textContent = 'Could not load vessel records.';
      $('loadError').hidden = false;
      $('loadError').textContent = 'Could not load vessel records. Keep database.js beside index.html and app.js.';
      console.error('Could not load vessel data:', error);
    }
  }

  initialize();
})();
